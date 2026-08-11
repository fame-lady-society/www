import { NextRequest, NextResponse } from "next/server";
import { SiweMessage } from "siwe";

import { verifyMessage as verifyEoaMessage } from "viem";
import { z } from "zod";

import {
  clearNonceCookie,
  NONCE_COOKIE_NAME,
  setNonceCookie,
  signNonce,
  verifyNonceCookieBinding,
  verifyNonce,
} from "./nonce-utils";
import { randomBytes } from "crypto";
import {
  SESSION_MAX_AGE,
  clearSession,
  getSession,
  setSession,
} from "./session-utils";
import { getSiwePublicClient } from "./public-client";

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    address: session.address,
    chainId: session.chainId,
    expiresAt: session.expiresAt,
  });
}

export async function PUT() {
  const nonce = randomBytes(32).toString("hex");
  const timestamp = Date.now();
  const signedNonce = signNonce(nonce, timestamp);
  const response = NextResponse.json({
    nonce: signedNonce,
  });
  setNonceCookie(response, signedNonce);
  return response;
}

const VerifyMessageInput = z.object({
  message: z.string().min(1),
  signature: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const fail = (error: string, status: number, attemptNonce?: string) => {
    const response = NextResponse.json({ error }, { status });
    const nonceCookie = request.cookies.get(NONCE_COOKIE_NAME)?.value;
    if (!attemptNonce || verifyNonceCookieBinding(attemptNonce, nonceCookie)) {
      clearNonceCookie(response);
    }
    return response;
  };

  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
    return fail("Invalid request body", 422);
  }
  const parseResult = VerifyMessageInput.safeParse(requestBody);
  if (!parseResult.success) return fail("Invalid request body", 422);

  const { message, signature } = parseResult.data;

  let siweMessage: SiweMessage;
  try {
    siweMessage = new SiweMessage(message);
  } catch {
    return fail("Invalid SIWE message format", 400);
  }

  const requestHost = request.headers.get("host") || "";
  const requestOrigin = request.nextUrl.origin;
  const originHeader = request.headers.get("origin");

  if (
    !requestHost ||
    siweMessage.domain !== requestHost ||
    siweMessage.uri !== requestOrigin ||
    (originHeader !== null && originHeader !== requestOrigin)
  ) {
    return fail("Message validation failed", 400, siweMessage.nonce);
  }

  const publicClient = getSiwePublicClient(siweMessage.chainId);
  if (!publicClient) {
    return fail("Unsupported SIWE chain", 400, siweMessage.nonce);
  }

  const nonceCookie = request.cookies.get(NONCE_COOKIE_NAME)?.value;
  const verifiedNonce = verifyNonce(siweMessage.nonce);
  if (
    !verifiedNonce.valid ||
    !verifyNonceCookieBinding(siweMessage.nonce, nonceCookie)
  ) {
    return fail("Invalid nonce", 400, siweMessage.nonce);
  }

  const now = new Date();
  if (siweMessage.issuedAt && new Date(siweMessage.issuedAt) > now) {
    return fail("Message issued in the future", 400, siweMessage.nonce);
  }

  if (siweMessage.expirationTime) {
    const expirationDate = new Date(siweMessage.expirationTime);
    if (expirationDate <= now) {
      return fail("Message expired", 400, siweMessage.nonce);
    }
  }

  if (siweMessage.notBefore) {
    const notBeforeDate = new Date(siweMessage.notBefore);
    if (notBeforeDate > now) {
      return fail("Message not yet valid", 400, siweMessage.nonce);
    }
  }

  try {
    const verification = {
      address: siweMessage.address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    };
    let isValid = false;
    try {
      isValid = await verifyEoaMessage(verification);
    } catch {
      // Contract-wallet signatures cannot be recovered as EOAs.
    }
    if (!isValid) {
      try {
        isValid = await publicClient.verifyMessage(verification);
      } catch {
        return fail(
          "Contract-wallet signature verification is temporarily unavailable",
          503,
          siweMessage.nonce,
        );
      }
    }

    if (!isValid) {
      return fail("Invalid signature", 401, siweMessage.nonce);
    }
    const expiresAt = Date.now() + SESSION_MAX_AGE * 1000;
    const response = NextResponse.json({
      address: siweMessage.address,
      chainId: siweMessage.chainId,
      expiresAt,
    });
    setSession(
      response,
      siweMessage.address as `0x${string}`,
      siweMessage.chainId,
      expiresAt,
    );
    clearNonceCookie(response);
    return response;
  } catch {
    return fail("Message verification failed", 400, siweMessage.nonce);
  }
}

const ConditionalCleanupInput = z.object({
  address: z.string(),
  nonce: z.string().optional(),
  expiresAt: z.number().int().positive().optional(),
});

export async function DELETE(request: NextRequest) {
  const response = new NextResponse();
  let cleanupInput: z.infer<typeof ConditionalCleanupInput> | null = null;
  const body = await request.text();
  if (body) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(body);
    } catch {
      return NextResponse.json(
        { error: "Invalid cleanup request" },
        { status: 422 },
      );
    }
    const result = ConditionalCleanupInput.safeParse(parsed);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid cleanup request" },
        { status: 422 },
      );
    }
    cleanupInput = result.data;
  }

  if (!cleanupInput) {
    clearNonceCookie(response);
    clearSession(response);
    return response;
  }

  const nonceCookie = request.cookies.get(NONCE_COOKIE_NAME)?.value;
  if (
    cleanupInput.nonce &&
    verifyNonceCookieBinding(cleanupInput.nonce, nonceCookie)
  ) {
    clearNonceCookie(response);
  }
  const session = getSession(request);
  if (
    session &&
    cleanupInput.expiresAt !== undefined &&
    session.expiresAt === cleanupInput.expiresAt &&
    session.address.toLowerCase() === cleanupInput.address.toLowerCase()
  ) {
    clearSession(response);
  }
  return response;
}
