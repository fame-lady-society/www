import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type {
  CreatorMetadataUploadMode,
  CreatorImageType,
} from "@/features/fame/creatorMetadata";

const CAPABILITY_VERSION = 1;
const CAPABILITY_ISSUER = "fls-www";
const CAPABILITY_AUDIENCE = "fame-creator-upload";
const CAPABILITY_ENVIRONMENT = process.env.DEPLOYMENT ?? "unknown";
export const CREATOR_UPLOAD_CHAIN_ID = 8453;
export const CREATOR_UPLOAD_EXPIRY_SECONDS = 5 * 60;
export const CREATOR_UPLOAD_LEASE_SECONDS = 30;
export const CREATOR_UPLOAD_MAX_BODY_BYTES = 32 * 1024;
export const CREATOR_UPLOAD_TAG_OVERHEAD_BYTES = 4096;

export type CreatorUploadPurpose =
  | "image-upload"
  | "metadata-finalization";

export type CreatorUploadCapability = {
  v: 1;
  iss: typeof CAPABILITY_ISSUER;
  aud: typeof CAPABILITY_AUDIENCE;
  env: string;
  purpose: CreatorUploadPurpose;
  jti: string;
  operationId: string;
  address: `0x${string}`;
  sessionDigest: string;
  chainId: typeof CREATOR_UPLOAD_CHAIN_ID;
  tokenId: number;
  mode: CreatorMetadataUploadMode;
  imageType: CreatorImageType;
  imageBytes: number;
  imageHash: string;
  sponsorAddress: `0x${string}`;
  approvalAmount: string;
  iat: number;
  nbf: number;
  exp: number;
  imageUri?: string;
  imageTxId?: string;
};

type CapabilityInput = Omit<
  CreatorUploadCapability,
  | "v"
  | "iss"
  | "aud"
  | "env"
  | "jti"
  | "iat"
  | "nbf"
  | "exp"
  | "chainId"
> & {
  ttlSeconds?: number;
};

function capabilitySecret() {
  const secret = process.env.CREATOR_UPLOAD_CAPABILITY_SECRET;
  if (!secret?.trim()) {
    throw new Error("CREATOR_UPLOAD_CAPABILITY_SECRET is required");
  }
  return secret;
}

export function digestSessionCookie(cookie: string): string {
  return createHash("sha256").update(cookie).digest("hex");
}

function canonicalCapability(payload: CreatorUploadCapability): string {
  return JSON.stringify(payload);
}

function signPayload(payload: string): string {
  return createHmac("sha256", capabilitySecret())
    .update(`creator-upload-capability:v1:${payload}`)
    .digest("base64url");
}

function parseCapabilityPayload(value: unknown): CreatorUploadCapability | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const payload = value as Partial<CreatorUploadCapability>;
  if (
    payload.v !== CAPABILITY_VERSION ||
    payload.iss !== CAPABILITY_ISSUER ||
    payload.aud !== CAPABILITY_AUDIENCE ||
    payload.env !== CAPABILITY_ENVIRONMENT ||
    (payload.purpose !== "image-upload" &&
      payload.purpose !== "metadata-finalization") ||
    typeof payload.jti !== "string" ||
    !/^[0-9a-f-]{36}$/.test(payload.jti) ||
    typeof payload.operationId !== "string" ||
    !/^[a-zA-Z0-9_-]{20,80}$/.test(payload.operationId) ||
    typeof payload.address !== "string" ||
    !/^0x[0-9a-f]{40}$/i.test(payload.address) ||
    typeof payload.sessionDigest !== "string" ||
    !/^[0-9a-f]{64}$/.test(payload.sessionDigest) ||
    payload.chainId !== CREATOR_UPLOAD_CHAIN_ID ||
    !Number.isSafeInteger(payload.tokenId) ||
    payload.tokenId! < 0 ||
    typeof payload.mode !== "string" ||
    typeof payload.imageType !== "string" ||
    !Number.isSafeInteger(payload.imageBytes) ||
    payload.imageBytes! <= 0 ||
    typeof payload.imageHash !== "string" ||
    !/^[0-9a-f]{64}$/.test(payload.imageHash) ||
    typeof payload.sponsorAddress !== "string" ||
    !/^0x[0-9a-f]{40}$/i.test(payload.sponsorAddress) ||
    typeof payload.approvalAmount !== "string" ||
    !/^\d+$/.test(payload.approvalAmount) ||
    !Number.isSafeInteger(payload.iat) ||
    !Number.isSafeInteger(payload.nbf) ||
    !Number.isSafeInteger(payload.exp) ||
    payload.exp! <= payload.nbf!
  ) {
    return null;
  }
  if (payload.purpose === "metadata-finalization") {
    if (
      typeof payload.imageUri !== "string" ||
      typeof payload.imageTxId !== "string" ||
      !/^[A-Za-z0-9_-]{43}$/.test(payload.imageTxId)
    ) {
      return null;
    }
  } else if (payload.imageUri !== undefined || payload.imageTxId !== undefined) {
    return null;
  }
  return payload as CreatorUploadCapability;
}

export function createCreatorUploadCapability(
  input: CapabilityInput,
  now = Date.now(),
): { token: string; capability: CreatorUploadCapability } {
  const iat = Math.floor(now / 1000);
  const ttlSeconds = input.ttlSeconds ?? CREATOR_UPLOAD_EXPIRY_SECONDS;
  const capability: CreatorUploadCapability = {
    v: CAPABILITY_VERSION,
    iss: CAPABILITY_ISSUER,
    aud: CAPABILITY_AUDIENCE,
    env: CAPABILITY_ENVIRONMENT,
    purpose: input.purpose,
    jti: randomUUID(),
    operationId: input.operationId,
    address: input.address,
    sessionDigest: input.sessionDigest,
    chainId: CREATOR_UPLOAD_CHAIN_ID,
    tokenId: input.tokenId,
    mode: input.mode,
    imageType: input.imageType,
    imageBytes: input.imageBytes,
    imageHash: input.imageHash,
    sponsorAddress: input.sponsorAddress,
    approvalAmount: input.approvalAmount,
    iat,
    nbf: iat - 5,
    exp: iat + ttlSeconds,
    ...(input.purpose === "metadata-finalization"
      ? { imageUri: input.imageUri, imageTxId: input.imageTxId }
      : {}),
  };
  const payload = canonicalCapability(capability);
  return {
    token: `${Buffer.from(payload).toString("base64url")}.${signPayload(payload)}`,
    capability,
  };
}

export function verifyCreatorUploadCapability(
  token: string,
  now = Date.now(),
): CreatorUploadCapability | null {
  if (typeof token !== "string" || token.length > 16 * 1024) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encodedPayload, receivedSignature] = parts;
  if (!encodedPayload || !/^[A-Za-z0-9_-]+$/.test(receivedSignature)) return null;
  let payload: string;
  try {
    payload = Buffer.from(encodedPayload, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const expectedSignature = signPayload(payload);
  const expected = Buffer.from(expectedSignature);
  const received = Buffer.from(receivedSignature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return null;
  }
  const capability = parseCapabilityPayload(parsed);
  if (!capability) return null;
  const seconds = Math.floor(now / 1000);
  if (seconds < capability.nbf || seconds >= capability.exp) return null;
  if (canonicalCapability(capability) !== payload) return null;
  return capability;
}

export function newCreatorUploadOperationId(): string {
  return `cu_${randomUUID().replaceAll("-", "")}`;
}
