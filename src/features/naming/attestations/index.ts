import {
  decodeAbiParameters,
  encodeAbiParameters,
  hexToString,
  isHex,
  keccak256,
  toHex,
  recoverTypedDataAddress,
  type Address,
  type Hex,
} from "viem";

export const SOCIAL_PROVIDERS = ["x", "discord"] as const;
export type SocialProviderId = (typeof SOCIAL_PROVIDERS)[number];

export type AttestationV1 = {
  v: 1;
  namehash: Hex;
  provider: Hex;
  handle: string;
  issuedAt: number;
  expiresAt: number;
  nonce: Hex;
  aud: string;
  subtag: Hex;
  subtagKeyId: number;
  sig: Hex;
};

const ATTESTATION_ABI = [
  { name: "v", type: "uint8" },
  { name: "namehash", type: "bytes32" },
  { name: "provider", type: "bytes32" },
  { name: "handle", type: "string" },
  { name: "issuedAt", type: "uint64" },
  { name: "expiresAt", type: "uint64" },
  { name: "nonce", type: "bytes32" },
  { name: "aud", type: "string" },
  { name: "subtag", type: "bytes32" },
  { name: "subtagKeyId", type: "uint8" },
  { name: "sig", type: "bytes" },
] as const;

const ATTESTATION_TYPES = {
  Attestation: [
    { name: "v", type: "uint8" },
    { name: "namehash", type: "bytes32" },
    { name: "provider", type: "bytes32" },
    { name: "handleHash", type: "bytes32" },
    { name: "issuedAt", type: "uint64" },
    { name: "expiresAt", type: "uint64" },
    { name: "nonce", type: "bytes32" },
    { name: "audHash", type: "bytes32" },
    { name: "subtag", type: "bytes32" },
    { name: "subtagKeyId", type: "uint8" },
  ],
} as const;

export type SocialAttestationStatus = {
  provider: SocialProviderId;
  handle: string;
  issuedAt: number;
  expiresAt: number;
  verified: boolean;
  reason?: string;
  attestation: AttestationV1;
};

export function normalizeHandle(provider: SocialProviderId, handle: string): string {
  const trimmed = handle.trim().replace(/^@+/, "").toLowerCase();
  if (provider === "discord") {
    return trimmed.split("#")[0] ?? "";
  }
  return trimmed;
}

export function providerIdToBytes32(provider: SocialProviderId): Hex {
  return keccak256(toHex(provider));
}

export function getSocialAttestationKey(provider: SocialProviderId): Hex {
  return keccak256(toHex(`social:${provider}:att:v1`));
}

export function getSocialSubtagKey(provider: SocialProviderId): Hex {
  return keccak256(toHex(`social:${provider}:subtag:v1`));
}

export function encodeAttestationV1(attestation: AttestationV1): Hex {
  return encodeAbiParameters(ATTESTATION_ABI, [
    attestation.v,
    attestation.namehash,
    attestation.provider,
    attestation.handle,
    BigInt(attestation.issuedAt),
    BigInt(attestation.expiresAt),
    attestation.nonce,
    attestation.aud,
    attestation.subtag,
    attestation.subtagKeyId,
    attestation.sig,
  ]);
}

export function decodeAttestationV1(payload: Hex): AttestationV1 | null {
  if (payload === "0x") return null;

  const decoded = decodeAbiParameters(ATTESTATION_ABI, payload);
  const v = Number(decoded[0]);
  const issuedAt = Number(decoded[4]);
  const expiresAt = Number(decoded[5]);
  const subtagKeyId = Number(decoded[9]);

  if (v !== 1) return null;

  return {
    v: 1,
    namehash: decoded[1],
    provider: decoded[2],
    handle: decoded[3],
    issuedAt,
    expiresAt,
    nonce: decoded[6],
    aud: decoded[7],
    subtag: decoded[8],
    subtagKeyId,
    sig: decoded[10],
  };
}

export function parseAttestationPayload(payload: unknown): AttestationV1 | null {
  if (typeof payload === "string" && isHex(payload)) {
    return decodeAttestationV1(payload);
  }
  return null;
}

export function buildAttestationTypedData(
  attestation: AttestationV1,
  chainId: number,
  verifyingContract: Address,
) {
  const handleHash = keccak256(toHex(attestation.handle));
  const audHash = keccak256(toHex(attestation.aud));

  return {
    domain: {
      name: "FLSNamingSocialAttestation",
      version: "1",
      chainId: BigInt(chainId),
      verifyingContract,
    },
    types: ATTESTATION_TYPES,
    primaryType: "Attestation" as const,
    message: {
      v: attestation.v,
      namehash: attestation.namehash,
      provider: attestation.provider,
      handleHash,
      issuedAt: BigInt(attestation.issuedAt),
      expiresAt: BigInt(attestation.expiresAt),
      nonce: attestation.nonce,
      audHash,
      subtag: attestation.subtag,
      subtagKeyId: attestation.subtagKeyId,
    },
  };
}

export async function verifyAttestation(
  attestation: AttestationV1,
  options: {
    provider: SocialProviderId;
    namehash: Hex;
    chainId: number;
    verifyingContract: Address;
    attestorAddress: Address;
    expectedAudience?: string;
    now?: number;
  },
): Promise<{ valid: boolean; reason?: string }> {
  if (attestation.v !== 1) {
    return { valid: false, reason: "unsupported_version" };
  }

  if (attestation.provider !== providerIdToBytes32(options.provider)) {
    return { valid: false, reason: "provider_mismatch" };
  }

  if (attestation.namehash !== options.namehash) {
    return { valid: false, reason: "namehash_mismatch" };
  }

  if (
    options.expectedAudience &&
    attestation.aud !== options.expectedAudience
  ) {
    return { valid: false, reason: "audience_mismatch" };
  }

  const normalizedHandle = normalizeHandle(options.provider, attestation.handle);
  if (normalizedHandle !== attestation.handle) {
    return { valid: false, reason: "handle_not_normalized" };
  }

  const now = options.now ?? Math.floor(Date.now() / 1000);
  if (attestation.expiresAt < now) {
    return { valid: false, reason: "expired" };
  }

  try {
    const typedData = buildAttestationTypedData(
      attestation,
      options.chainId,
      options.verifyingContract,
    );
    const recovered = await recoverTypedDataAddress({
      ...typedData,
      signature: attestation.sig,
    });

    if (recovered.toLowerCase() !== options.attestorAddress.toLowerCase()) {
      return { valid: false, reason: "invalid_signature" };
    }
  } catch (error) {
    return { valid: false, reason: "invalid_signature" };
  }

  return { valid: true };
}

export async function getSocialAttestationStatus(
  provider: SocialProviderId,
  payload: unknown,
  options: {
    chainId: number;
    verifyingContract: Address;
    attestorAddress: Address;
    namehash: Hex;
    expectedAudience?: string;
  },
): Promise<SocialAttestationStatus | null> {
  const attestation = parseAttestationPayload(payload);
  if (!attestation) return null;

  const verification = await verifyAttestation(attestation, {
    provider,
    namehash: options.namehash,
    chainId: options.chainId,
    verifyingContract: options.verifyingContract,
    attestorAddress: options.attestorAddress,
    expectedAudience: options.expectedAudience,
  });

  return {
    provider,
    handle: attestation.handle,
    issuedAt: attestation.issuedAt,
    expiresAt: attestation.expiresAt,
    verified: verification.valid,
    reason: verification.reason,
    attestation,
  };
}

export function safeHexToString(value: unknown): string | null {
  if (typeof value === "string" && isHex(value)) {
    return hexToString(value);
  }
  return null;
}
