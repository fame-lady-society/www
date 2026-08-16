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
  it("exposes the signature, preview, direct-upload, limit, and reset states", () => {
    for (const phrase of [
      "Approve sponsored image upload",
      "Uploading the image directly to Irys",
      "FLS pays Irys storage",
      "MAX_CREATOR_IMAGE_BYTES",
      "revokeCreatorImageAuthorization",
      "Selected artwork preview",
      "Image uploaded — release below",
      "Update metadata",
      "Reset everything",
      "URL.createObjectURL",
    ]) {
      assert.equal(source.includes(phrase), true, phrase);
    }
    assert.match(source, /disabled=\{busy \|\| Boolean\(imageUpload\)\}/);
    assert.match(source, /if \(!file \|\| busy \|\| imageUpload\) return/);
    assert.equal(source.includes("new FormData"), false);
  });
});
