import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { SESSION_SECRET } from "./session-utils";

export const NONCE_COOKIE_NAME = "siwe_nonce";
export const NONCE_MAX_AGE = 5 * 60;
const NONCE_EXPIRY_MS = NONCE_MAX_AGE * 1000;

function nonceHmac(value: string): string {
  return createHmac("sha256", SESSION_SECRET)
    .update(`siwe-nonce:${value}`)
    .digest("hex");
}

export function createNonceCookieBinding(signedNonce: string): string {
  return nonceHmac(`binding:${signedNonce}`);
}

export function verifyNonceCookieBinding(
  signedNonce: string,
  binding: string | undefined,
): boolean {
  if (!binding || !/^[0-9a-f]{64}$/i.test(binding)) return false;
  return timingSafeEqual(
    Buffer.from(createNonceCookieBinding(signedNonce), "hex"),
    Buffer.from(binding, "hex"),
  );
}

export function signNonce(nonce: string, timestamp: number): string {
  const signature = nonceHmac(`${nonce}:${timestamp}`);
  const signedData = `${nonce}:${timestamp}:${signature}`;
  return Buffer.from(signedData).toString("base64url");
}

export function verifyNonce(signedNonce: string): {
  valid: boolean;
  nonce: string;
} {
  let signedData: string;
  try {
    signedData = Buffer.from(signedNonce, "base64url").toString("utf-8");
  } catch {
    return { valid: false, nonce: "" };
  }

  const parts = signedData.split(":");
  if (parts.length !== 3) {
    return { valid: false, nonce: "" };
  }

  const [nonce, timestampStr, signature] = parts;
  if (
    !nonce ||
    !/^\d+$/.test(timestampStr) ||
    !/^[0-9a-f]{64}$/i.test(signature)
  ) {
    return { valid: false, nonce: "" };
  }
  const timestamp = Number(timestampStr);

  if (!Number.isSafeInteger(timestamp)) {
    return { valid: false, nonce: "" };
  }

  const now = Date.now();
  if (timestamp > now || now - timestamp > NONCE_EXPIRY_MS) {
    return { valid: false, nonce: "" };
  }

  const expectedSignature = nonceHmac(`${nonce}:${timestamp}`);

  const expectedBuffer = Buffer.from(expectedSignature, "hex");
  const receivedBuffer = Buffer.from(signature, "hex");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return { valid: false, nonce: "" };
  }

  const isValid = timingSafeEqual(expectedBuffer, receivedBuffer);
  return { valid: isValid, nonce };
}

export function setNonceCookie(
  response: NextResponse,
  signedNonce: string,
): void {
  response.cookies.set(
    NONCE_COOKIE_NAME,
    createNonceCookieBinding(signedNonce),
    {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: NONCE_MAX_AGE,
      path: "/siwe",
    },
  );
}

export function clearNonceCookie(response: NextResponse): void {
  response.cookies.set(NONCE_COOKIE_NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/siwe",
    expires: new Date(0),
  });
}
