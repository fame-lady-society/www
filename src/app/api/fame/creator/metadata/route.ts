import * as sentry from "@sentry/nextjs";
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isAddress, isAddressEqual, type Address } from "viem";
import { base } from "viem/chains";
import { getBalance, readContract } from "viem/actions";
import { privateKeyToAccount } from "viem/accounts";
import { getSession, type SessionData } from "@/app/siwe/session-utils";
import {
  canUploadCreatorMetadata,
  createCreatorMetadataJson,
  creatorMetadataTags,
  decodeCreatorPortalRoles,
  isCreatorMetadataUploadMode,
  isReleasedCreatorUpdateToken,
  normalizeCreatorAddress,
  type CreatorMetadataUploadMode,
} from "@/features/fame/creatorMetadata";
import { creatorArtistMagicAddress } from "@/features/fame/contract";
import { client as basePublicClient } from "@/viem/base-client";
import { creatorArtistMagicAbi } from "@/wagmi";
import { buildNodeIrysUploader } from "@/service/irys_backend_client_node";
import {
  ensureIrysBalance,
  type IrysSponsoredUploader,
  uploadToIrys,
} from "@/service/irys_sponsored_upload";
import {
  createCreatorUploadJournal,
  type CreatorUploadJournal,
} from "@/service/creator_upload_journal";
import {
  createCreatorIrysVerifier,
  parseCreatorIrysGatewayUri,
  verifyCreatorImage,
  type CreatorIrysVerifier,
} from "@/service/creator_irys_verifier";
import {
  CREATOR_UPLOAD_CHAIN_ID,
  CREATOR_UPLOAD_LEASE_SECONDS,
  CREATOR_UPLOAD_MAX_BODY_BYTES,
  digestSessionCookie,
  verifyCreatorUploadCapability,
} from "@/service/creator_upload_authorization";

type CreatorMetadataFinalizeRequest = {
  address: string;
  tokenId: number;
  mode: string;
  imageUri: string;
  capability: string;
};

export type CreatorMetadataUploadDeps = {
  getSession: (request: NextRequest) => SessionData | null;
  readRoles: (address: Address) => Promise<bigint>;
  readNextTokenId: () => Promise<number | bigint>;
  createUploader: () => Promise<IrysSponsoredUploader>;
  createVerifier: (uploader: IrysSponsoredUploader) => CreatorIrysVerifier;
  getMaxFundAmount: () => Promise<bigint>;
  journal: CreatorUploadJournal;
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function hasTrustedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return false;
  const fetchSite = request.headers.get("sec-fetch-site");
  return !fetchSite || fetchSite === "same-origin" || fetchSite === "same-site";
}

function safeJsonBody(value: unknown): value is CreatorMetadataFinalizeRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const body = value as Partial<CreatorMetadataFinalizeRequest>;
  const keys = Object.keys(body).sort().join(",");
  return (
    keys === "address,capability,imageUri,mode,tokenId" &&
    typeof body.address === "string" &&
    typeof body.capability === "string" &&
    typeof body.imageUri === "string" &&
    typeof body.mode === "string" &&
    Number.isSafeInteger(body.tokenId) &&
    body.tokenId! >= 0
  );
}

async function parseBody(
  request: NextRequest,
): Promise<CreatorMetadataFinalizeRequest | null> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0];
  if (contentType !== "application/json") return null;
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > CREATOR_UPLOAD_MAX_BODY_BYTES) {
    return null;
  }
  const text = await request.text();
  if (
    new TextEncoder().encode(text).byteLength > CREATOR_UPLOAD_MAX_BODY_BYTES
  ) {
    return null;
  }
  try {
    const body: unknown = JSON.parse(text);
    return safeJsonBody(body) ? body : null;
  } catch {
    return null;
  }
}

async function defaultGetMaxFundAmount() {
  const privateKey = process.env.METADATA_PRIVATE_KEY;
  if (!privateKey) throw new Error("METADATA_PRIVATE_KEY not configured");
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const accountBalance = await getBalance(basePublicClient, {
    address: account.address,
  });
  const estimatedGas = 21000n * 20n;
  return accountBalance > estimatedGas ? accountBalance - estimatedGas : 0n;
}

async function defaultCreateUploader() {
  const privateKey = process.env.METADATA_PRIVATE_KEY;
  if (!privateKey) throw new Error("METADATA_PRIVATE_KEY not configured");
  return (await buildNodeIrysUploader({
    privateKey: privateKey as `0x${string}`,
  })) as unknown as IrysSponsoredUploader;
}

const defaultDeps: CreatorMetadataUploadDeps = {
  getSession,
  readRoles: async (address) =>
    readContract(basePublicClient, {
      address: creatorArtistMagicAddress(base.id),
      abi: creatorArtistMagicAbi,
      functionName: "rolesOf",
      args: [address],
    }),
  readNextTokenId: async () =>
    readContract(basePublicClient, {
      address: creatorArtistMagicAddress(base.id),
      abi: creatorArtistMagicAbi,
      functionName: "nextTokenId",
    }),
  createUploader: defaultCreateUploader,
  createVerifier: (uploader) => createCreatorIrysVerifier(uploader),
  getMaxFundAmount: defaultGetMaxFundAmount,
  journal: createCreatorUploadJournal(),
};

async function revokeImageApproval(
  uploader: IrysSponsoredUploader,
  address: string,
) {
  if (!uploader.approval) {
    throw new Error("Irys approval support is unavailable");
  }
  await uploader.approval.revokeApproval({
    approvedAddress: normalizeCreatorAddress(address),
  });
}

const METADATA_INDEX_RETRY_DELAYS_MS = [0, 250, 750] as const;

async function findMetadataWithRetry(
  verifier: CreatorIrysVerifier,
  input: Parameters<CreatorIrysVerifier["findMetadataTransaction"]>[0],
) {
  for (const [index, delay] of METADATA_INDEX_RETRY_DELAYS_MS.entries()) {
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    const transaction = await verifier.findMetadataTransaction(input);
    if (transaction || index === METADATA_INDEX_RETRY_DELAYS_MS.length - 1) {
      return transaction;
    }
  }
  return null;
}

export function isExactIrysGatewayUri(value: unknown): value is string {
  return parseCreatorIrysGatewayUri(value) !== null;
}

export async function handleCreatorMetadataUpload(
  request: NextRequest,
  deps: CreatorMetadataUploadDeps = defaultDeps,
) {
  if (!hasTrustedOrigin(request)) return jsonError("Invalid origin", 403);
  const session = deps.getSession(request);
  if (!session) return jsonError("Unauthorized", 401);
  if (session.chainId !== CREATOR_UPLOAD_CHAIN_ID) {
    return jsonError("Sign in with Ethereum on Base before uploading", 403);
  }
  const cookie = request.cookies.get("siwe")?.value;
  if (!cookie) return jsonError("Unauthorized", 401);
  const body = await parseBody(request);
  if (!body) return jsonError("Invalid request body", 422);
  if (
    !isAddress(body.address) ||
    !isAddressEqual(body.address, session.address)
  ) {
    return jsonError("Unauthorized", 403);
  }
  if (!isCreatorMetadataUploadMode(body.mode)) {
    return jsonError("Invalid mode", 400);
  }
  const capability = verifyCreatorUploadCapability(body.capability);
  if (
    !capability ||
    (capability.purpose !== "image-upload" &&
      capability.purpose !== "metadata-finalization")
  ) {
    return jsonError("Invalid or expired upload authorization", 403);
  }
  const creatorAddress = normalizeCreatorAddress(body.address);
  if (
    capability.address.toLowerCase() !== creatorAddress.toLowerCase() ||
    capability.sessionDigest !== digestSessionCookie(cookie) ||
    capability.mode !== body.mode
  ) {
    return jsonError("Upload authorization scope mismatch", 403);
  }
  if (
    capability.purpose === "image-upload" &&
    capability.tokenId !== body.tokenId
  ) {
    return jsonError("Upload authorization scope mismatch", 403);
  }
  if (
    capability.purpose === "metadata-finalization" &&
    (capability.tokenId !== body.tokenId ||
      capability.imageUri !== body.imageUri)
  ) {
    return jsonError("Metadata authorization scope mismatch", 403);
  }

  const roles = decodeCreatorPortalRoles(await deps.readRoles(body.address));
  if (!canUploadCreatorMetadata(roles, body.mode)) {
    return jsonError("Forbidden", 403);
  }
  if (body.mode === "update") {
    if (
      !isReleasedCreatorUpdateToken(body.tokenId, await deps.readNextTokenId())
    ) {
      return jsonError("Token is outside the released FAME range", 400);
    }
  }

  const operation = await deps.journal.getOperation(capability.operationId);
  if (
    !operation ||
    operation.creatorAddress.toLowerCase() !== creatorAddress.toLowerCase() ||
    operation.sessionDigest !== capability.sessionDigest ||
    operation.mode !== capability.mode ||
    (capability.mode === "update" &&
      operation.tokenId !== capability.tokenId) ||
    operation.imageHash !== capability.imageHash ||
    operation.imageBytes !== capability.imageBytes
  ) {
    return jsonError("Upload operation not found", 404);
  }
  if (
    operation.status === "finalized" &&
    operation.metadataUri &&
    capability.purpose === "image-upload"
  ) {
    if (operation.imageUri !== body.imageUri) {
      return jsonError("Upload operation image mismatch", 409);
    }
    return NextResponse.json({
      imageUri: operation.imageUri,
      metadataUri: operation.metadataUri,
    });
  }
  if (operation.status === "revoked" || operation.status === "failed") {
    return jsonError("Upload operation is no longer active", 409);
  }

  const lease = randomUUID();
  const locked = await deps.journal.acquireFinalization(
    capability.operationId,
    lease,
    CREATOR_UPLOAD_LEASE_SECONDS,
  );
  if (!locked)
    return jsonError("Upload finalization is already in progress", 409);

  let imageVerified = false;
  try {
    const uploader = await deps.createUploader();
    const verifier = deps.createVerifier(uploader);
    const verifiedImage = await verifyCreatorImage({
      verifier,
      imageUri: body.imageUri,
      operationId: capability.operationId,
      creatorAddress,
      tokenId: operation.tokenId,
      mode: capability.mode,
      imageType: capability.imageType,
      imageBytes: capability.imageBytes,
      imageHash: capability.imageHash,
    });
    imageVerified = true;
    await deps.journal.updateOperation(capability.operationId, {
      status: "image_verified",
      imageUri: verifiedImage.imageUri,
      imageTxId: verifiedImage.imageTxId,
    });

    const existingMetadata = await findMetadataWithRetry(verifier, {
      operationId: capability.operationId,
      tokenId: body.tokenId,
      creatorAddress,
      mode: capability.mode,
      imageUri: verifiedImage.imageUri,
      sponsorAddress: capability.sponsorAddress,
    });
    if (existingMetadata) {
      const metadataUri = `${"https://gateway.irys.xyz"}/${existingMetadata.id}`;
      await deps.journal.updateOperation(capability.operationId, {
        status: "finalized",
        metadataUri,
        metadataTxId: existingMetadata.id,
      });
      if (capability.purpose === "image-upload") {
        await revokeImageApproval(uploader, creatorAddress);
      }
      await deps.journal.releaseCreator(creatorAddress, capability.operationId);
      return NextResponse.json({
        imageUri: verifiedImage.imageUri,
        metadataUri,
      });
    }

    if (capability.purpose === "image-upload") {
      await revokeImageApproval(uploader, creatorAddress);
    }
    const metadataContent = createCreatorMetadataJson(
      body.tokenId,
      verifiedImage.imageUri,
    );
    const metadataBytes = new TextEncoder().encode(metadataContent).byteLength;
    await ensureIrysBalance({
      uploader,
      bytes: metadataBytes + 4096,
      maxFundAmount: await deps.getMaxFundAmount(),
      logContext: {
        operationId: capability.operationId,
        kind: "creator-metadata",
      },
    });
    const metadataUri = await uploadToIrys({
      uploader,
      content: metadataContent,
      tags: creatorMetadataTags({
        operationId: capability.operationId,
        creatorAddress,
        tokenId: body.tokenId,
        mode: capability.mode,
        content: metadataContent,
        imageUri: verifiedImage.imageUri,
      }),
    });
    const metadataTxId = parseCreatorIrysGatewayUri(metadataUri)?.transactionId;
    if (!metadataTxId)
      throw new Error("Metadata upload returned an invalid URI");
    await deps.journal.updateOperation(capability.operationId, {
      status: "finalized",
      metadataUri,
      metadataTxId,
    });
    await deps.journal.releaseCreator(creatorAddress, capability.operationId);
    return NextResponse.json({ imageUri: verifiedImage.imageUri, metadataUri });
  } catch (error) {
    if (imageVerified) {
      await deps.journal.updateOperation(capability.operationId, {
        status: "image_verified",
      });
    } else {
      await deps.journal.updateOperation(capability.operationId, {
        status: "failed",
      });
      await deps.journal.releaseCreator(creatorAddress, capability.operationId);
    }
    console.error("[creator-upload] metadata finalization failed", {
      operationId: capability.operationId,
      error: error instanceof Error ? error.message : String(error),
    });
    sentry.captureException(error, {
      extra: { operationId: capability.operationId },
    });
    return jsonError(
      imageVerified
        ? "Image uploaded, but metadata finalization failed. Retry metadata."
        : "Unable to verify the uploaded image",
      imageVerified ? 503 : 422,
    );
  } finally {
    await deps.journal.releaseFinalization(capability.operationId, lease);
  }
}

export async function POST(request: NextRequest) {
  try {
    return await handleCreatorMetadataUpload(request);
  } catch (error) {
    console.error("[creator-upload] metadata route failed");
    sentry.captureException(error);
    return jsonError("Internal server error", 500);
  }
}
