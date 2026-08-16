import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CREATOR_IMAGE_TYPES,
  CREATOR_UPLOAD_TAGS,
  MAX_CREATOR_IMAGE_BYTES,
  creatorContentHash,
  creatorImageTags,
  findCreatorTag,
  validateCreatorImageDescriptor,
} from "./creatorMetadata";

const CREATOR = "0x0000000000000000000000000000000000000001";

describe("creator metadata image contract", () => {
  it("accepts all supported image types", () => {
    for (const type of CREATOR_IMAGE_TYPES) {
      assert.equal(
        validateCreatorImageDescriptor({ type, size: 1 }),
        null,
      );
    }
  });

  it("accepts the exact 12 MiB boundary and rejects the next byte", () => {
    assert.equal(
      validateCreatorImageDescriptor({
        type: "image/png",
        size: MAX_CREATOR_IMAGE_BYTES,
      }),
      null,
    );
    assert.equal(
      validateCreatorImageDescriptor({
        type: "image/png",
        size: MAX_CREATOR_IMAGE_BYTES + 1,
      }),
      "Image exceeds the 12 MB limit",
    );
  });

  it("rejects unsupported and empty images", () => {
    assert.equal(
      validateCreatorImageDescriptor({ type: "text/plain", size: 1 }),
      "Unsupported image type",
    );
    assert.equal(
      validateCreatorImageDescriptor({ type: "image/png", size: 0 }),
      "Invalid image size",
    );
  });

  it("builds a deterministic, queryable image tag contract", () => {
    const bytes = new TextEncoder().encode("image");
    const tags = creatorImageTags({
      operationId: "op-1",
      creatorAddress: CREATOR,
      tokenId: 123,
      mode: "update",
      type: "image/png",
      size: bytes.byteLength,
      contentHash: creatorContentHash(bytes),
    });

    assert.equal(findCreatorTag(tags, CREATOR_UPLOAD_TAGS.operation), "op-1");
    assert.equal(findCreatorTag(tags, CREATOR_UPLOAD_TAGS.creator), CREATOR);
    assert.equal(findCreatorTag(tags, CREATOR_UPLOAD_TAGS.contentLength), "5");
    assert.equal(
      findCreatorTag(tags, CREATOR_UPLOAD_TAGS.contentHash),
      creatorContentHash(bytes),
    );
    assert.equal(
      findCreatorTag(
        [...tags, { name: CREATOR_UPLOAD_TAGS.operation, value: "duplicate" }],
        CREATOR_UPLOAD_TAGS.operation,
      ),
      null,
    );
  });
});
