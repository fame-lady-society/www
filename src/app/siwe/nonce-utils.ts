import { createHmac, timingSafeEqual } from "node:crypto";

const NONCE_SECRET = process.env.SIWE_NONCE_SECRET || "change-me-in-production";
const NONCE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

export function signNonce(nonce: string, timestamp: number): string {
  const hmac = createHmac("sha256", NONCE_SECRET);
  hmac.update(`${nonce}:${timestamp}`);
  const signature = hmac.digest("hex");
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
  const timestamp = parseInt(timestampStr, 10);

  if (isNaN(timestamp)) {
    return { valid: false, nonce: "" };
  }

  const now = Date.now();
  if (now - timestamp > NONCE_EXPIRY_MS) {
    return { valid: false, nonce: "" };
  }

  const expectedSignature = createHmac("sha256", NONCE_SECRET)
    .update(`${nonce}:${timestamp}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature, "hex");
  const receivedBuffer = Buffer.from(signature, "hex");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return { valid: false, nonce: "" };
  }

  const isValid = timingSafeEqual(expectedBuffer, receivedBuffer);
  return { valid: isValid, nonce };
}
