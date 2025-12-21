import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { signNonce } from "../nonce-utils";

export async function GET(_request: NextRequest) {
  console.log("GET /siwe/nonce");
  const nonce = randomBytes(32).toString("hex");
  const timestamp = Date.now();
  const signedNonce = signNonce(nonce, timestamp);
  return NextResponse.json({ nonce: signedNonce });
}
