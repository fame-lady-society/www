import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { isAddress } from "viem";

export function requireSessionSecret(value: string | undefined): string {
  if (!value?.trim()) {
    throw new Error("SESSION_SECRET is required for SIWE sessions.");
  }
  return value;
}

export const SESSION_SECRET = requireSessionSecret(process.env.SESSION_SECRET);
export const COOKIE_NAME = "siwe";
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

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

  if (!/^[0-9a-f]{64}$/i.test(signature)) {
    return null;
  }
  if (
    !timingSafeEqual(
      Buffer.from(expectedSignature, "hex"),
      Buffer.from(signature, "hex"),
    )
  ) {
    return null;
  }

  try {
    const data = JSON.parse(payload) as Partial<SessionData>;
    if (
      !isAddress(data.address ?? "") ||
      !Number.isSafeInteger(data.chainId) ||
      !Number.isSafeInteger(data.expiresAt) ||
      data.expiresAt! <= Date.now()
    ) {
      return null;
    }
    return data as SessionData;
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

export function getSession(request: NextRequest): SessionData | null {
  const cookie = request.cookies.get(COOKIE_NAME);
  return cookie?.value ? verifySession(cookie.value) : null;
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
