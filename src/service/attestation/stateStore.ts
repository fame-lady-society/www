import { type SocialProviderId } from "@/features/naming/attestations";
import { type Hex } from "viem";
import { EncryptJWT, jwtDecrypt } from "jose";
import { createHash, createSecretKey } from "node:crypto";
import { SESSION_SECRET } from "@/app/siwe/session-utils";

export type OAuthStatePayload = {
  provider: SocialProviderId;
  name: string;
  namehash: Hex;
  address: `0x${string}`;
  chainId: number;
  codeVerifier: string;
  returnTo: string;
  state?: string;
};

export const STATE_TTL_SECONDS = 10 * 60;

function deriveSecretKey() {
  const digest = createHash("sha256").update(SESSION_SECRET).digest();
  return createSecretKey(digest);
}

function isAddressValue(value: string): value is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

function isHexValue(value: string): value is Hex {
  return /^0x[a-fA-F0-9]*$/.test(value);
}

function isSocialProvider(value: string): value is SocialProviderId {
  return value === "x" || value === "discord";
}

export async function encryptState(payload: OAuthStatePayload): Promise<string> {
  const key = deriveSecretKey();
  return new EncryptJWT(payload)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(`${STATE_TTL_SECONDS}s`)
    .encrypt(key);
}

export async function decryptState(stateToken: string): Promise<OAuthStatePayload | null> {
  const key = deriveSecretKey();

  try {
    const { payload } = await jwtDecrypt(stateToken, key);
    const provider = payload.provider;
    const name = payload.name;
    const namehash = payload.namehash;
    const address = payload.address;
    const chainId = payload.chainId;
    const codeVerifier = payload.codeVerifier;
    const returnTo = payload.returnTo;
    const state = payload.state;
    
    if (
      typeof provider !== "string" ||
      !isSocialProvider(provider) ||
      typeof name !== "string" ||
      typeof namehash !== "string" ||
      !isHexValue(namehash) ||
      typeof address !== "string" ||
      !isAddressValue(address) ||
      typeof chainId !== "number" ||
      typeof codeVerifier !== "string" ||
      typeof returnTo !== "string" ||
      typeof state !== "string"
    ) {
      return null;
    }

    return {
      provider,
      name,
      namehash,
      address,
      chainId,
      codeVerifier,
      returnTo,
      state,
    };
  } catch {
    return null;
  }
}
