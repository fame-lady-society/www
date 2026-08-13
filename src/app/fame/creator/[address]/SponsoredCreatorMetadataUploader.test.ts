import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

const source = readFileSync(
  resolve(
    process.cwd(),
    "src/app/fame/creator/[address]/SponsoredCreatorMetadataUploader.tsx",
  ),
  "utf8",
);

describe("sponsored creator metadata uploader UI contract", () => {
  it("exposes the signature, direct-upload, limit, and retry states", () => {
    for (const phrase of [
      "Approve sponsored image upload",
      "Uploading the image directly to Irys",
      "FLS pays Irys storage",
      "Retry metadata only",
      "MAX_CREATOR_IMAGE_BYTES",
      "revokeCreatorImageAuthorization",
    ]) {
      assert.equal(source.includes(phrase), true, phrase);
    }
    assert.equal(source.includes("new FormData"), false);
  });
});
