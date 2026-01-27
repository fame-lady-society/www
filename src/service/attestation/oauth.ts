import { randomBytes, createHash } from "node:crypto";
import { type SocialProviderId } from "@/features/naming/attestations";

type OAuthTokenResponse = {
  accessToken: string;
};

type ProviderProfile = {
  subject: string;
  handle: string;
};

type ProviderConfig = {
  id: SocialProviderId;
  authorizeUrl: string;
  tokenUrl: string;
  userUrl: string;
  scope: string[];
  clientId: string;
  clientSecret: string;
};

const PROVIDER_CONFIGS: Record<SocialProviderId, Omit<ProviderConfig, "clientId" | "clientSecret">> = {
  x: {
    id: "x",
    authorizeUrl: "https://twitter.com/i/oauth2/authorize",
    tokenUrl: "https://api.twitter.com/2/oauth2/token",
    userUrl: "https://api.twitter.com/2/users/me?user.fields=username",
    scope: ["users.read"],
  },
  discord: {
    id: "discord",
    authorizeUrl: "https://discord.com/oauth2/authorize",
    tokenUrl: "https://discord.com/api/oauth2/token",
    userUrl: "https://discord.com/api/users/@me",
    scope: ["identify"],
  },
};

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

export function getProviderConfig(provider: SocialProviderId): ProviderConfig {
  const base = PROVIDER_CONFIGS[provider];
  const clientId = getEnv(`SOCIAL_${provider.toUpperCase()}_CLIENT_ID`);
  const clientSecret = getEnv(`SOCIAL_${provider.toUpperCase()}_CLIENT_SECRET`);
  return { ...base, clientId, clientSecret };
}

export function generateCodeVerifier(): string {
  return randomBytes(32).toString("base64url");
}

export function generateCodeChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function generateStateToken(): string {
  return randomBytes(16).toString("base64url");
}

export function buildAuthorizeUrl({
  provider,
  redirectUri,
  state,
  codeChallenge,
}: {
  provider: SocialProviderId;
  redirectUri: string;
  state: string;
  codeChallenge: string;
}): string {
  const config = getProviderConfig(provider);
  const url = new URL(config.authorizeUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", config.scope.join(" "));
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

async function fetchToken({
  provider,
  code,
  codeVerifier,
  redirectUri,
}: {
  provider: SocialProviderId;
  code: string;
  codeVerifier: string;
  redirectUri: string;
}): Promise<OAuthTokenResponse> {
  const config = getProviderConfig(provider);
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
    client_id: config.clientId,
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  if (provider === "x") {
    const auth = Buffer.from(
      `${config.clientId}:${config.clientSecret}`,
    ).toString("base64");
    headers.Authorization = `Basic ${auth}`;
  } else {
    body.set("client_secret", config.clientSecret);
  }

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers,
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token exchange failed: ${text}`);
  }

  const json = (await response.json()) as { access_token?: string };
  if (!json.access_token) {
    throw new Error("Token response missing access_token");
  }

  return { accessToken: json.access_token };
}

async function fetchProfile(
  provider: SocialProviderId,
  accessToken: string,
): Promise<ProviderProfile> {
  const config = getProviderConfig(provider);
  const response = await fetch(config.userUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Profile fetch failed: ${text}`);
  }

  const json = (await response.json()) as
    | { data?: { id?: string; username?: string } }
    | { id?: string; username?: string };

  if (provider === "x" && "data" in json) {
    const subject = json.data?.id;
    const handle = json.data?.username;
    if (!subject || !handle) {
      throw new Error("X profile missing id or username");
    }
    return { subject, handle };
  } else if (provider === "discord" && "id" in json) {
    const subject = json.id;
    const handle = json.username;
    if (!subject || !handle) {
      throw new Error("Discord profile missing id or username");
    }
    return { subject, handle };
  }

  throw new Error("Invalid profile response");
}

export async function exchangeOAuthCode({
  provider,
  code,
  codeVerifier,
  redirectUri,
}: {
  provider: SocialProviderId;
  code: string;
  codeVerifier: string;
  redirectUri: string;
}): Promise<ProviderProfile> {
  const token = await fetchToken({ provider, code, codeVerifier, redirectUri });
  return fetchProfile(provider, token.accessToken);
}
