import assert from "node:assert/strict";
import { describe, it } from "node:test";

process.env.SESSION_SECRET ||= "test-session-secret";

describe("SIWE nonce signing", () => {
  it("accepts an untampered nonce inside the five-minute window", async () => {
    const {
      createNonceCookieBinding,
      signNonce,
      verifyNonce,
      verifyNonceCookieBinding,
    } = await import("./nonce-utils");
    const signed = signNonce("nonce", Date.now());
    const binding = createNonceCookieBinding(signed);

    assert.deepEqual(verifyNonce(signed), { valid: true, nonce: "nonce" });
    assert.notEqual(binding, signed);
    assert.equal(verifyNonceCookieBinding(signed, binding), true);
    assert.equal(verifyNonceCookieBinding(`${signed}x`, binding), false);
  });

  it("rejects malformed, expired, future, and tampered nonces", async () => {
    const { signNonce, verifyNonce } = await import("./nonce-utils");
    const now = Date.now();

    assert.equal(verifyNonce("not-a-signed-nonce").valid, false);
    assert.equal(verifyNonce(signNonce("old", now - 300_001)).valid, false);
    assert.equal(verifyNonce(signNonce("future", now + 60_000)).valid, false);

    const signed = signNonce("nonce", now);
    const tampered = `${signed.slice(0, -1)}${signed.endsWith("a") ? "b" : "a"}`;
    assert.equal(verifyNonce(tampered).valid, false);

    const [nonce, timestamp, signature] = Buffer.from(signed, "base64url")
      .toString("utf8")
      .split(":");
    const nonCanonicalTimestamp = Buffer.from(
      `${nonce}:${timestamp}junk:${signature}`,
    ).toString("base64url");
    assert.equal(verifyNonce(nonCanonicalTimestamp).valid, false);
  });
});
