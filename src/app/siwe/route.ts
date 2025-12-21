import { NextRequest, NextResponse } from "next/server";
import { SiweMessage, generateNonce } from "siwe";
import { Address } from "viem";
import { client as baseClient } from "@/viem/base-client";
import { client as mainnetClient } from "@/viem/mainnet-client";
import { client as sepoliaClient } from "@/viem/sepolia-client";

import { base, mainnet, sepolia } from "viem/chains";
import { z } from "zod";

import { signNonce, verifyNonce } from "./nonce-utils";
import { randomBytes } from "crypto";
import { clearSession, getSession, setSession } from "./session-utils";

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    address: session.address,
    chainId: session.chainId,
  });
}

export async function PUT() {
  const nonce = randomBytes(32).toString("hex");
  const timestamp = Date.now();
  const signedNonce = signNonce(nonce, timestamp);
  return NextResponse.json({
    nonce: signedNonce,
  });
}

const VerifyMessageInput = z.object({
  message: z.string().min(1),
  signature: z.string().min(1),
});

function getPublicClientForChain(chainId: number) {
  switch (chainId) {
    case base.id:
      return baseClient;
    case mainnet.id:
      return mainnetClient;
    case sepolia.id:
      return sepoliaClient;
    default:
      throw new Error(`Unsupported chain ID: ${chainId}`);
  }
}

export async function POST(request: NextRequest) {
  const parseResult = VerifyMessageInput.safeParse(await request.json());
  if (!parseResult.success)
    return NextResponse.json("Invalid request body", { status: 422 });

  const { message, signature } = parseResult.data;

  let siweMessage: SiweMessage;
  try {
    siweMessage = new SiweMessage(message);
  } catch {
    const response = new NextResponse("Invalid SIWE message format", {
      status: 400,
    });
    clearSession(response);
    return response;
  }

  const requestHost = request.headers.get("host") || "";
  const requestOrigin = request.headers.get("origin") || "";

  const isValidUri =
    siweMessage.uri === requestOrigin ||
    siweMessage.uri === `http://${requestHost}` ||
    siweMessage.uri === `https://${requestHost}`;

  if (siweMessage.domain !== requestHost || !isValidUri) {
    const response = new NextResponse("Message validation failed", {
      status: 400,
    });
    clearSession(response);
    return response;
  }

  if (!verifyNonce(siweMessage.nonce)) {
    const response = new NextResponse("Invalid nonce", { status: 400 });
    clearSession(response);
    return response;
  }

  if (siweMessage.expirationTime) {
    const expirationDate = new Date(siweMessage.expirationTime);
    if (expirationDate < new Date()) {
      const response = new NextResponse("Message expired", { status: 400 });
      clearSession(response);
      return response;
    }
  }

  if (siweMessage.notBefore) {
    const notBeforeDate = new Date(siweMessage.notBefore);
    if (notBeforeDate > new Date()) {
      const response = new NextResponse("Message not yet valid", {
        status: 400,
      });
      clearSession(response);
      return response;
    }
  }

  try {
    const publicClient = getPublicClientForChain(siweMessage.chainId);
    const isValid = await publicClient.verifyMessage({
      address: siweMessage.address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });

    if (!isValid) {
      const response = new NextResponse("Invalid signature", { status: 401 });
      clearSession(response);
      return response;
    }
    const response = NextResponse.json({
      address: siweMessage.address,
      chainId: siweMessage.chainId,
    });
    setSession(response, siweMessage.address, siweMessage.chainId);
    return response;
  } catch (error) {
    const response = new NextResponse(String(error), { status: 400 });
    clearSession(response);
    return response;
  }
}

export async function DELETE(request: NextRequest) {
  const response = new NextResponse();
  clearSession(response);
  return response;
}
