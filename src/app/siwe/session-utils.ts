import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "node:crypto";

export const SESSION_SECRET = process.env.SESSION_SECRET!;
export const COOKIE_NAME = "siwe";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

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

export function getSession(request: NextRequest): SessionData | null {
  const cookie = request.cookies.get(COOKIE_NAME);
  if (!cookie?.value) {
    return null;
  }
  return verifySession(cookie.value);
}

export function setSession(
  response: NextResponse,
  address: `0x${string}`,
  chainId: number,
): void {
  const expiresAt = Date.now() + SESSION_MAX_AGE * 1000;
  const sessionData: SessionData = { address, chainId, expiresAt };
  const signedSession = signSession(sessionData);

  const cookieOptions: Parameters<typeof response.cookies.set>[2] = {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  };

  response.cookies.set(COOKIE_NAME, signedSession, cookieOptions);
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
