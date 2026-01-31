import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/app/siwe/session-utils";
import {
  SOCIAL_PROVIDERS,
  type SocialProviderId,
} from "@/features/naming/attestations";
import {
  createOAuthAuthLink,
  generateStateToken,
} from "@/service/attestation/oauth";
import { STATE_TTL_SECONDS, encryptState } from "@/service/attestation/stateStore";
import { keccak256, toHex } from "viem";

function isSocialProvider(value: string): value is SocialProviderId {
  return SOCIAL_PROVIDERS.includes(value as SocialProviderId);
}

function normalizeReturnTo(request: NextRequest, returnTo?: string | null): string {
  if (!returnTo) {
    return new URL(request.url).origin;
  }

  try {
    const target = new URL(returnTo, request.url);
    const origin = new URL(request.url).origin;
    return target.origin === origin ? target.toString() : origin;
  } catch {
    return new URL(request.url).origin;
  }
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
  const name = searchParams.get("name") ?? "";
  if (!name.trim()) {
    return NextResponse.json({ error: "Missing name" }, { status: 400 });
  }

  const returnTo = normalizeReturnTo(request, searchParams.get("returnTo"));
  const namehash = keccak256(toHex(name));

  const redirectUri = new URL(
    `/api/attestations/oauth/${provider}/callback`,
    request.url,
  ).toString();

  const authLink = await createOAuthAuthLink({
    provider,
    redirectUri,
    state: provider === "x" ? undefined : generateStateToken(),
  });

  const encodedState = await encryptState({
    provider,
    name,
    namehash,
    address: session.address,
    chainId: session.chainId,
    codeVerifier: authLink.codeVerifier,
    returnTo,
    state: authLink.state,
  });

  const url = new URL(authLink.url);



  return NextResponse.json({ url: url.toString(), state: encodedState }, {
    headers: {
      "Set-Cookie": `state-${provider}=${encodedState}; Path=/; HttpOnly;${process.env.NODE_ENV === 'production' ? ' Secure;' : ''} SameSite=Lax; Max-Age=${STATE_TTL_SECONDS}`,
    }
  });
}
