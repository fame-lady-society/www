import * as sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { isAddress, isAddressEqual, type Address } from "viem";
import { base } from "viem/chains";
import { getBalance, readContract } from "viem/actions";
import { privateKeyToAccount } from "viem/accounts";
import { getSession, type SessionData } from "@/app/siwe/session-utils";
import {
  canUploadCreatorMetadata,
  decodeCreatorPortalRoles,
  isCreatorMetadataUploadMode,
  normalizeCreatorAddress,
  validateCreatorImageDescriptor,
  type CreatorImageType,
} from "@/features/fame/creatorMetadata";
import { creatorArtistMagicAddress } from "@/features/fame/contract";
import { client as basePublicClient } from "@/viem/base-client";
import { creatorArtistMagicAbi } from "@/wagmi";
import { buildNodeIrysUploader } from "@/service/irys_backend_client_node";
import {
  computeBufferedIrysPrice,
  ensureIrysBalance,
  toBigIntAmount,
  type IrysSponsoredUploader,
} from "@/service/irys_sponsored_upload";
import {
  createCreatorUploadCapability,
  CREATOR_UPLOAD_CHAIN_ID,
  CREATOR_UPLOAD_EXPIRY_SECONDS,
  CREATOR_UPLOAD_MAX_BODY_BYTES,
  CREATOR_UPLOAD_TAG_OVERHEAD_BYTES,
  digestSessionCookie,
  newCreatorUploadOperationId,
} from "@/service/creator_upload_authorization";
import {
  createCreatorUploadJournal,
  type CreatorUploadJournal,
} from "@/service/creator_upload_journal";

type AuthorizationRequest = {
  address: string;
  tokenId: number;
  mode: string;
  imageType: string;
  imageBytes: number;
  imageHash: string;
};

export type CreatorMetadataAuthorizeDeps = {
  getSession: (request: NextRequest) => SessionData | null;
  readRoles: (address: Address) => Promise<bigint>;
  createUploader: () => Promise<IrysSponsoredUploader>;
  getSponsorAddress: () => Address;
  getMaxFundAmount: () => Promise<bigint>;
  journal: CreatorUploadJournal;
  now?: () => number;
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

function safeJsonBody(value: unknown): value is AuthorizationRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const body = value as Partial<AuthorizationRequest>;
  const keys = Object.keys(body).sort().join(",");
  return (
    keys === "address,imageBytes,imageHash,imageType,mode,tokenId" &&
    typeof body.address === "string" &&
    typeof body.mode === "string" &&
    typeof body.imageType === "string" &&
    typeof body.imageHash === "string" &&
    /^[0-9a-f]{64}$/.test(body.imageHash) &&
    Number.isSafeInteger(body.tokenId) &&
    body.tokenId! >= 0 &&
    Number.isSafeInteger(body.imageBytes) &&
    body.imageBytes! > 0
  );
}

async function parseBody(request: NextRequest): Promise<AuthorizationRequest | null> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0];
  if (contentType !== "application/json") return null;
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > CREATOR_UPLOAD_MAX_BODY_BYTES) {
    return null;
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > CREATOR_UPLOAD_MAX_BODY_BYTES) {
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

function defaultSponsorAddress(): Address {
  const privateKey = process.env.METADATA_PRIVATE_KEY;
  if (!privateKey) throw new Error("METADATA_PRIVATE_KEY not configured");
  return privateKeyToAccount(privateKey as `0x${string}`).address;
}

const defaultDeps: CreatorMetadataAuthorizeDeps = {
  getSession,
  readRoles: async (address) =>
    readContract(basePublicClient, {
      address: creatorArtistMagicAddress(base.id),
      abi: creatorArtistMagicAbi,
      functionName: "rolesOf",
      args: [address],
    }),
  createUploader: defaultCreateUploader,
  getSponsorAddress: defaultSponsorAddress,
  getMaxFundAmount: defaultGetMaxFundAmount,
  journal: createCreatorUploadJournal(),
};

export async function handleCreatorMetadataAuthorize(
  request: NextRequest,
  deps: CreatorMetadataAuthorizeDeps = defaultDeps,
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
  if (!isAddress(body.address) || !isAddressEqual(body.address, session.address)) {
    return jsonError("Unauthorized", 403);
  }
  if (!isCreatorMetadataUploadMode(body.mode)) {
    return jsonError("Invalid mode", 400);
  }
  if (!isAddress(body.address)) return jsonError("Invalid address", 400);
  const imageError = validateCreatorImageDescriptor({
    type: body.imageType,
    size: body.imageBytes,
  });
  if (imageError) return jsonError(imageError, 400);
  if (!/^[0-9a-f]{64}$/.test(body.imageHash)) {
    return jsonError("Invalid image hash", 400);
  }
  const roles = decodeCreatorPortalRoles(await deps.readRoles(body.address));
  if (!canUploadCreatorMetadata(roles, body.mode)) {
    return jsonError("Forbidden", 403);
  }

  const creatorAddress = normalizeCreatorAddress(body.address);
  const operationId = newCreatorUploadOperationId();
  const reserved = await deps.journal.reserveCreator(
    creatorAddress,
    operationId,
    CREATOR_UPLOAD_EXPIRY_SECONDS,
  );
  if (!reserved) return jsonError("An upload is already in progress", 409);

  let uploaderForCleanup: IrysSponsoredUploader | null = null;
  let approvalCreated = false;
  try {
    const uploader = await deps.createUploader();
    uploaderForCleanup = uploader;
    const sponsorAddress = normalizeCreatorAddress(deps.getSponsorAddress());
    const priceBytes = body.imageBytes + CREATOR_UPLOAD_TAG_OVERHEAD_BYTES;
    const price = computeBufferedIrysPrice(
      toBigIntAmount(await uploader.getPrice(priceBytes)),
    );
    await ensureIrysBalance({
      uploader,
      bytes: priceBytes,
      maxFundAmount: await deps.getMaxFundAmount(),
      logContext: { operationId, kind: "creator-image-approval" },
    });
    if (!uploader.approval) {
      throw new Error("Irys approval support is unavailable");
    }
    await uploader.approval.createApproval({
      approvedAddress: creatorAddress,
      amount: price,
      expiresInSeconds: CREATOR_UPLOAD_EXPIRY_SECONDS,
    });
    approvalCreated = true;
    const confirmedApproval = await uploader.approval.getApproval({
      approvedAddress: creatorAddress,
      payingAddress: sponsorAddress,
    });
    if (BigInt(confirmedApproval.amount) < price) {
      throw new Error("Irys approval amount was not confirmed");
    }
    const now = deps.now?.() ?? Date.now();
    const capabilityResult = createCreatorUploadCapability(
      {
        purpose: "image-upload",
        operationId,
        address: creatorAddress,
        sessionDigest: digestSessionCookie(cookie),
        tokenId: body.tokenId,
        mode: body.mode,
        imageType: body.imageType as CreatorImageType,
        imageBytes: body.imageBytes,
        imageHash: body.imageHash,
        sponsorAddress,
        approvalAmount: price.toString(),
        ttlSeconds: CREATOR_UPLOAD_EXPIRY_SECONDS,
      },
      now,
    );
    const operation = {
      operationId,
      creatorAddress,
      sessionDigest: digestSessionCookie(cookie),
      tokenId: body.tokenId,
      mode: body.mode,
      imageType: body.imageType as CreatorImageType,
      imageBytes: body.imageBytes,
      imageHash: body.imageHash,
      sponsorAddress,
      approvalAmount: price.toString(),
      createdAt: now,
      expiresAt: capabilityResult.capability.exp * 1000,
      status: "authorized" as const,
    };
    const created = await deps.journal.createOperation(
      operation,
      CREATOR_UPLOAD_EXPIRY_SECONDS,
    );
    if (!created) {
      throw new Error("Unable to create upload operation");
    }
    return NextResponse.json({
      capability: capabilityResult.token,
      operationId,
      sponsorAddress,
      expiresAt: capabilityResult.capability.exp * 1000,
    });
  } catch (error) {
    if (approvalCreated && uploaderForCleanup?.approval) {
      try {
        await uploaderForCleanup.approval.revokeApproval({
          approvedAddress: creatorAddress,
        });
      } catch (revokeError) {
        console.error("[creator-upload] approval cleanup failed", {
          operationId,
          error: revokeError,
        });
        sentry.captureException(revokeError, { extra: { operationId } });
      }
    }
    await deps.journal.releaseCreator(creatorAddress, operationId);
    console.error("[creator-upload] authorization failed", { operationId });
    sentry.captureException(error, { extra: { operationId } });
    return jsonError("Unable to authorize sponsored upload", 503);
  }
}

export async function POST(request: NextRequest) {
  try {
    return await handleCreatorMetadataAuthorize(request);
  } catch (error) {
    console.error("[creator-upload] authorization route failed");
    sentry.captureException(error);
    return jsonError("Internal server error", 500);
  }
}
