import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createCreatorUploadCapability,
  digestSessionCookie,
  verifyCreatorUploadCapability,
} from "./creator_upload_authorization";

process.env.CREATOR_UPLOAD_CAPABILITY_SECRET ||= "test-creator-upload-secret";

const baseInput = {
  purpose: "image-upload" as const,
  operationId: "cu_test-operation-123456",
  address: "0x0000000000000000000000000000000000000001" as const,
  sessionDigest: digestSessionCookie("session-cookie"),
  tokenId: 123,
  mode: "update" as const,
  imageType: "image/png" as const,
  imageBytes: 12,
  imageHash: "a".repeat(64),
  sponsorAddress: "0x0000000000000000000000000000000000000009" as const,
  approvalAmount: "1000",
};

describe("creator upload capabilities", () => {
  it("round-trips a canonical capability", () => {
    const now = 1_700_000_000_000;
    const issued = createCreatorUploadCapability(baseInput, now);
    const verified = verifyCreatorUploadCapability(issued.token, now + 1000);
    assert.deepEqual(verified, issued.capability);
  });

  it("rejects tampering, cross-session use, and expiry", () => {
    const now = 1_700_000_000_000;
    const issued = createCreatorUploadCapability(baseInput, now);
    const [payload, signature] = issued.token.split(".");
    const tampered = `${Buffer.from(
      payload.replace("image/png", "image/jpeg"),
    ).toString("base64url")}.${signature}`;
    assert.equal(verifyCreatorUploadCapability(tampered, now + 1000), null);
    assert.equal(verifyCreatorUploadCapability(issued.token, now + 301_000), null);
    assert.notEqual(
      issued.capability.sessionDigest,
      digestSessionCookie("other-session"),
    );
  });

  it("requires an image transaction for metadata capabilities", () => {
    const issued = createCreatorUploadCapability({
      ...baseInput,
      purpose: "metadata-finalization",
      imageUri: `https://gateway.irys.xyz/${"i".repeat(43)}`,
      imageTxId: "i".repeat(43),
    });
    assert.equal(verifyCreatorUploadCapability(issued.token)?.purpose, "metadata-finalization");
  });
});
