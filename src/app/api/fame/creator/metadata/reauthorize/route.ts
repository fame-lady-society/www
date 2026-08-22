import { NextRequest, NextResponse } from "next/server";
import { isAddress, isAddressEqual, type Address } from "viem";
import { base } from "viem/chains";
import { readContract } from "viem/actions";
import { getSession, type SessionData } from "@/app/siwe/session-utils";
import {
  canUploadCreatorMetadata,
  decodeCreatorPortalRoles,
  isCreatorMetadataUploadMode,
  isReleasedCreatorUpdateToken,
  normalizeCreatorAddress,
} from "@/features/fame/creatorMetadata";
import { creatorArtistMagicAddress } from "@/features/fame/contract";
import { client as basePublicClient } from "@/viem/base-client";
import { creatorArtistMagicAbi } from "@/wagmi";
import {
  createCreatorUploadCapability,
  CREATOR_UPLOAD_CHAIN_ID,
  CREATOR_UPLOAD_MAX_BODY_BYTES,
  digestSessionCookie,
} from "@/service/creator_upload_authorization";
import {
  createCreatorUploadJournal,
  type CreatorUploadJournal,
} from "@/service/creator_upload_journal";
import { parseCreatorIrysGatewayUri } from "@/service/creator_irys_verifier";

type ReauthorizeRequest = {
  address: string;
  tokenId: number;
  mode: string;
  operationId: string;
  imageUri: string;
};

type ReauthorizeDeps = {
  getSession: (request: NextRequest) => SessionData | null;
  readRoles: (address: Address) => Promise<bigint>;
  readNextTokenId: () => Promise<number | bigint>;
  journal: CreatorUploadJournal;
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function validBody(value: unknown): value is ReauthorizeRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const body = value as Partial<ReauthorizeRequest>;
  return (
    Object.keys(body).sort().join(",") ===
      "address,imageUri,mode,operationId,tokenId" &&
    typeof body.address === "string" &&
    typeof body.imageUri === "string" &&
    typeof body.mode === "string" &&
    typeof body.operationId === "string" &&
    /^[a-zA-Z0-9_-]{20,80}$/.test(body.operationId) &&
    Number.isSafeInteger(body.tokenId) &&
    body.tokenId! >= 0
  );
}

function trustedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  return (
    (!origin || origin === request.nextUrl.origin) &&
    (!fetchSite || fetchSite === "same-origin" || fetchSite === "same-site")
  );
}

async function readBody(request: NextRequest) {
  if (
    request.headers.get("content-type")?.split(";", 1)[0] !== "application/json"
  ) {
    return null;
  }
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
    return validBody(body) ? body : null;
  } catch {
    return null;
  }
}

const defaultDeps: ReauthorizeDeps = {
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
  journal: createCreatorUploadJournal(),
};

export async function handleCreatorMetadataReauthorize(
  request: NextRequest,
  deps: ReauthorizeDeps = defaultDeps,
) {
  if (!trustedOrigin(request)) return jsonError("Invalid origin", 403);
  const session = deps.getSession(request);
  if (!session || session.chainId !== CREATOR_UPLOAD_CHAIN_ID) {
    return jsonError("Unauthorized", 401);
  }
  const cookie = request.cookies.get("siwe")?.value;
  const body = await readBody(request);
  if (!cookie || !body) return jsonError("Invalid request", 422);
  if (
    !isAddress(body.address) ||
    !isAddressEqual(body.address, session.address)
  ) {
    return jsonError("Unauthorized", 403);
  }
  if (!isCreatorMetadataUploadMode(body.mode)) {
    return jsonError("Invalid mode", 400);
  }
  const parsedUri = parseCreatorIrysGatewayUri(body.imageUri);
  if (!parsedUri) return jsonError("Invalid image URI", 400);
  const operation = await deps.journal.getOperation(body.operationId);
  const creatorAddress = normalizeCreatorAddress(body.address);
  if (
    !operation ||
    operation.creatorAddress.toLowerCase() !== creatorAddress.toLowerCase() ||
    operation.sessionDigest !== digestSessionCookie(cookie) ||
    operation.mode !== body.mode ||
    (body.mode === "update" && operation.tokenId !== body.tokenId) ||
    operation.imageUri !== body.imageUri ||
    operation.imageTxId !== parsedUri.transactionId ||
    (operation.status !== "image_verified" && operation.status !== "finalized")
  ) {
    return jsonError("Verified image operation not found", 404);
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
  const result = createCreatorUploadCapability({
    purpose: "metadata-finalization",
    operationId: operation.operationId,
    address: creatorAddress,
    sessionDigest: operation.sessionDigest,
    tokenId: body.tokenId,
    mode: body.mode,
    imageType: operation.imageType,
    imageBytes: operation.imageBytes,
    imageHash: operation.imageHash,
    sponsorAddress: operation.sponsorAddress,
    approvalAmount: operation.approvalAmount,
    imageUri: body.imageUri,
    imageTxId: operation.imageTxId,
  });
  return NextResponse.json({
    capability: result.token,
    operationId: operation.operationId,
    sponsorAddress: operation.sponsorAddress,
    imageUri: body.imageUri,
    expiresAt: result.capability.exp * 1000,
  });
}

export async function POST(request: NextRequest) {
  try {
    return await handleCreatorMetadataReauthorize(request);
  } catch {
    return jsonError("Internal server error", 500);
  }
}
