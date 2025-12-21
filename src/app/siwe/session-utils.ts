import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "node:crypto";

const SESSION_SECRET = process.env.SIWE_SESSION_SECRET || "change-me-in-production";
const COOKIE_NAME = "siwe-session";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export type SessionData = {
  address: string;
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
  address: string,
  chainId: number,
): void {
  const expiresAt = Date.now() + SESSION_MAX_AGE * 1000;
  const sessionData: SessionData = { address, chainId, expiresAt };
  const signedSession = signSession(sessionData);

  response.cookies.set(COOKIE_NAME, signedSession, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export function clearSession(response: NextResponse): void {
  response.cookies.delete(COOKIE_NAME);
}

