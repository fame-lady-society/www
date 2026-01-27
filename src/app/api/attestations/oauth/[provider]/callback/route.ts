import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/app/siwe/session-utils";
import {
  SOCIAL_PROVIDERS,
  normalizeHandle,
  providerIdToBytes32,
  encodeAttestationV1,
  buildAttestationTypedData,
  type SocialProviderId,
} from "@/features/naming/attestations";
import { exchangeOAuthCode } from "@/service/attestation/oauth";
import { decryptState } from "@/service/attestation/stateStore";
import { flsNamingAddress } from "@/wagmi";
import { createHmac, randomBytes } from "node:crypto";
import {
  bytesToHex,
  encodePacked,
  hexToBytes,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

function isSocialProvider(value: string): value is SocialProviderId {
  return SOCIAL_PROVIDERS.includes(value as SocialProviderId);
}

function getAttestorAccount() {
  const privateKey = process.env.SOCIAL_ATTESTOR_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("SOCIAL_ATTESTOR_PRIVATE_KEY not configured");
  }
  return privateKeyToAccount(privateKey as Hex);
}

function getAttestationTtlSeconds(): number {
  const value = process.env.SOCIAL_ATTESTATION_TTL_DAYS;
  const days = value ? Number(value) : 180;
  if (!Number.isFinite(days) || days <= 0) {
    return 180 * 24 * 60 * 60;
  }
  return Math.floor(days * 24 * 60 * 60);
}

function getSubtagKeyId(): number {
  const value = process.env.SOCIAL_ATTESTATION_SUBTAG_KEY_ID;
  const parsed = value ? Number(value) : 1;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 1;
}

function getAudience(request: NextRequest): string {
  return process.env.SOCIAL_ATTESTATION_AUD ?? new URL(request.url).origin;
}

function getSubtagSecret(): string {
  const secret = process.env.SOCIAL_ATTESTATION_SUBTAG_SECRET;
  if (!secret) {
    throw new Error("SOCIAL_ATTESTATION_SUBTAG_SECRET not configured");
  }
  return secret;
}

function buildSubtag({
  secret,
  chainId,
  verifyingContract,
  namehash,
  providerHash,
  subject,
}: {
  secret: string;
  chainId: number;
  verifyingContract: Address;
  namehash: Hex;
  providerHash: Hex;
  subject: string;
}): Hex {
  const payload = encodePacked(
    ["string", "uint256", "address", "bytes32", "bytes32", "string"],
    [
      "SOCIAL_SUBTAG_V1",
      BigInt(chainId),
      verifyingContract,
      namehash,
      providerHash,
      subject,
    ],
  );
  const digest = createHmac("sha256", secret)
    .update(hexToBytes(payload))
    .digest();
  return bytesToHex(digest);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } },
) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const provider = params.provider.toLowerCase();
  if (!isSocialProvider(provider)) {
    return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  if (!code || !state) {
    return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
  }

  const stateRecord = await decryptState(state);
  if (!stateRecord) {
    return NextResponse.json({ error: "Invalid or expired state" }, { status: 400 });
  }
  if (stateRecord.provider !== provider) {
    return NextResponse.json({ error: "Provider mismatch" }, { status: 400 });
  }
  if (session.address.toLowerCase() !== stateRecord.address.toLowerCase()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const redirectUri = new URL(
    `/api/attestations/oauth/${provider}/callback`,
    request.url,
  ).toString();

  try {
    const profile = await exchangeOAuthCode({
      provider,
      code,
      codeVerifier: stateRecord.codeVerifier,
      redirectUri,
    });

    const chainId = stateRecord.chainId;
    const verifyingContract =
      flsNamingAddress[chainId as keyof typeof flsNamingAddress];
    if (!verifyingContract) {
      return NextResponse.json(
        { error: "Naming contract not configured for chain" },
        { status: 400 },
      );
    }

    const providerHash = providerIdToBytes32(provider);
    const handle = normalizeHandle(provider, profile.handle);
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + getAttestationTtlSeconds();
    const nonce = bytesToHex(randomBytes(32));
    const aud = getAudience(request);
    const subtagKeyId = getSubtagKeyId();

    const subtag = buildSubtag({
      secret: getSubtagSecret(),
      chainId,
      verifyingContract,
      namehash: stateRecord.namehash,
      providerHash,
      subject: profile.subject,
    });

    const attestation = {
      v: 1 as const,
      namehash: stateRecord.namehash,
      provider: providerHash,
      handle,
      issuedAt,
      expiresAt,
      nonce,
      aud,
      subtag,
      subtagKeyId,
      sig: "0x" as Hex,
    };

    const account = getAttestorAccount();
    const typedData = buildAttestationTypedData(
      attestation,
      chainId,
      verifyingContract,
    );
    const sig = await account.signTypedData(typedData);
    const signedAttestation = { ...attestation, sig };
    const encoded = encodeAttestationV1(signedAttestation);

    const payload = {
      provider,
      attestation: encoded,
      subtag,
      name: stateRecord.name,
    };

    const redirectUrl = new URL(stateRecord.returnTo);
    redirectUrl.searchParams.set(
      "socialAttestation",
      Buffer.from(JSON.stringify(payload)).toString("base64url"),
    );
    redirectUrl.searchParams.set("provider", provider);

    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown OAuth error";
    console.error("[attestations][oauth][callback]", {
      provider,
      message,
    });

    return NextResponse.json(
      {
        error: "OAuth callback failed",
        message,
      },
      { status: 500 },
    );
  }
}
