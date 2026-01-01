import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "node:crypto";

export const SESSION_SECRET = process.env.SESSION_SECRET!;
export const COOKIE_NAME = "siwe";
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds
const BEARER_PREFIX = "bearer ";

export type SessionData = {
  address: `0x${string}`;
  chainId: number;
  expiresAt: number;
};

function signSession(data: SessionData): string {
  const payload = JSON.stringify(data);
  const hmac = createHmac("sha256", SESSION_SECRET);
  hmac.update(payload);
  const signature = hmac.digest("hex");
  return `${Buffer.from(payload).toString("base64url")}.${signature}`;
}

function verifySession(signedSession: string): SessionData | null {
  const parts = signedSession.split(".");
  if (parts.length !== 2) {
    return null;
  }

  const [payloadBase64, signature] = parts;
  let payload: string;
  try {
    payload = Buffer.from(payloadBase64, "base64url").toString("utf-8");
  } catch {
    return null;
  }

  const expectedSignature = createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("hex");

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const data: SessionData = JSON.parse(payload);
    if (data.expiresAt < Date.now()) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function createSignedSession(
  address: `0x${string}`,
  chainId: number,
  expiresAt: number = Date.now() + SESSION_MAX_AGE * 1000,
): { token: string; session: SessionData } {
  const session: SessionData = { address, chainId, expiresAt };
  return { token: signSession(session), session };
}

function extractBearerToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization");
  if (!header) {
    return null;
  }
  const lower = header.toLowerCase();
  if (!lower.startsWith(BEARER_PREFIX)) {
    return null;
  }
  const token = header.slice(BEARER_PREFIX.length);
  return token ? token.trim() : null;
}

export function getSession(request: NextRequest): SessionData | null {
  const bearerToken = extractBearerToken(request);
  if (bearerToken) {
    const bearerSession = verifySession(bearerToken);
    if (bearerSession) {
      return bearerSession;
    }
  }

  const cookie = request.cookies.get(COOKIE_NAME);
  if (cookie?.value) {
    return verifySession(cookie.value);
  }

  return null;
}

export function setSession(
  response: NextResponse,
  address: `0x${string}`,
  chainId: number,
  expiresAt?: number,
): string {
  const { token } = createSignedSession(
    address,
    chainId,
    expiresAt ?? Date.now() + SESSION_MAX_AGE * 1000,
  );

  const cookieOptions: Parameters<typeof response.cookies.set>[2] = {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  };

  response.cookies.set(COOKIE_NAME, token, cookieOptions);
  return token;
}

export function clearSession(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
}
