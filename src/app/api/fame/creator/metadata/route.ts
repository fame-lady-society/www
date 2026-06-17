import * as sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { getSession, type SessionData } from "@/app/siwe/session-utils";
import { creatorArtistMagicAddress } from "@/features/fame/contract";
import {
  canUploadCreatorMetadata,
  createCreatorMetadataJson,
  decodeCreatorPortalRoles,
  isCreatorMetadataUploadMode,
} from "@/features/fame/creatorMetadata";
import { client as basePublicClient } from "@/viem/base-client";
import { creatorArtistMagicAbi } from "@/wagmi";
import { buildNodeIrysUploader } from "@/service/irys_backend_client_node";
import {
  ensureIrysBalance,
  type IrysSponsoredUploader,
  uploadToIrys,
} from "@/service/irys_sponsored_upload";
import { getBalance, readContract } from "viem/actions";
import {
  isAddress,
  isAddressEqual,
  keccak256,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set([
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

type CreatorMetadataUploadDeps = {
  getSession: (request: NextRequest) => SessionData | null;
  readRoles: (address: Address) => Promise<bigint>;
  createUploader: () => Promise<IrysSponsoredUploader>;
  getMaxFundAmount: () => Promise<bigint>;
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function sanitizeFilename(filename: string) {
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 80);
  return sanitized || "creator-image";
}

function contentLength(bytes: Uint8Array | string) {
  return typeof bytes === "string"
    ? new TextEncoder().encode(bytes).length
    : bytes.byteLength;
}

function contentHash(bytes: Uint8Array | string) {
  return keccak256(
    typeof bytes === "string" ? new TextEncoder().encode(bytes) : bytes,
  ).slice(2);
}

async function defaultGetMaxFundAmount() {
  const privateKey = process.env.METADATA_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("METADATA_PRIVATE_KEY not configured");
  }
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const accountBalance = await getBalance(basePublicClient, {
    address: account.address,
  });
  const estimatedGas = 21000n * 20n;
  return accountBalance > estimatedGas ? accountBalance - estimatedGas : 0n;
}

async function defaultCreateUploader() {
  const privateKey = process.env.METADATA_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("METADATA_PRIVATE_KEY not configured");
  }
  return buildNodeIrysUploader({
    privateKey: privateKey as `0x${string}`,
  }) as Promise<IrysSponsoredUploader>;
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
  createUploader: defaultCreateUploader,
  getMaxFundAmount: defaultGetMaxFundAmount,
};

export async function handleCreatorMetadataUpload(
  request: NextRequest,
  deps: CreatorMetadataUploadDeps = defaultDeps,
) {
  const session = deps.getSession(request);
  if (!session) {
    return jsonError("Unauthorized", 401);
  }

  const formData = await request.formData();
  const address = formData.get("address");
  const tokenIdRaw = formData.get("tokenId");
  const mode = formData.get("mode");
  const image = formData.get("image");

  if (typeof address !== "string" || !isAddress(address)) {
    return jsonError("Invalid address", 400);
  }
  if (!isAddressEqual(address, session.address)) {
    return jsonError("Unauthorized", 403);
  }
  if (typeof tokenIdRaw !== "string" || !/^\d+$/.test(tokenIdRaw)) {
    return jsonError("Invalid tokenId", 400);
  }
  const tokenId = Number(tokenIdRaw);
  if (!Number.isSafeInteger(tokenId)) {
    return jsonError("Invalid tokenId", 400);
  }
  if (!isCreatorMetadataUploadMode(mode)) {
    return jsonError("Invalid mode", 400);
  }
  if (!(image instanceof File)) {
    return jsonError("Missing image", 400);
  }
  if (!SUPPORTED_IMAGE_TYPES.has(image.type)) {
    return jsonError("Unsupported image type", 400);
  }
  if (image.size <= 0 || image.size > MAX_IMAGE_BYTES) {
    return jsonError("Invalid image size", 400);
  }

  const roles = decodeCreatorPortalRoles(await deps.readRoles(address));
  if (!canUploadCreatorMetadata(roles, mode)) {
    return jsonError("Forbidden", 403);
  }

  const imageBytes = new Uint8Array(await image.arrayBuffer());
  const uploader = await deps.createUploader();

  await ensureIrysBalance({
    uploader,
    bytes: imageBytes.byteLength,
    maxFundAmount: await deps.getMaxFundAmount(),
    logContext: { address, tokenId, kind: "creator-image" },
  });
  const imageUri = await uploadToIrys({
    uploader,
    content: imageBytes,
    tags: [
      { name: "Content-Type", value: image.type },
      { name: "Content-Length", value: String(imageBytes.byteLength) },
      {
        name: "Content-Disposition",
        value: `attachment; filename="${sanitizeFilename(image.name)}"`,
      },
      { name: "Content-Hash", value: contentHash(imageBytes) },
    ],
  });

  const metadataContent = createCreatorMetadataJson(tokenId, imageUri);
  const metadataBytes = contentLength(metadataContent);
  await ensureIrysBalance({
    uploader,
    bytes: metadataBytes,
    maxFundAmount: await deps.getMaxFundAmount(),
    logContext: { address, tokenId, kind: "creator-metadata" },
  });
  const metadataUri = await uploadToIrys({
    uploader,
    content: metadataContent,
    tags: [
      { name: "Content-Type", value: "application/json" },
      { name: "Content-Length", value: String(metadataBytes) },
      {
        name: "Content-Disposition",
        value: `attachment; filename="fame-creator-${tokenId}.json"`,
      },
      { name: "Content-Hash", value: contentHash(metadataContent) },
    ],
  });

  return NextResponse.json({ imageUri, metadataUri });
}

export async function POST(request: NextRequest) {
  try {
    return await handleCreatorMetadataUpload(request);
  } catch (error) {
    console.error(error);
    sentry.captureException(error);
    return jsonError("Internal server error", 500);
  }
}
