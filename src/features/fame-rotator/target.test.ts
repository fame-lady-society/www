import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FAME_METADATA_FALLBACK_IMAGE } from "@/service/fameMetadata";
import {
  parseTargetIdParam,
  resolveBurnPoolTarget,
  SOCIETY_TOKEN_ID_MAX,
  ROTATION_EXCHANGE_EXPLANATION,
} from "./target";

const sampleSnapshot = {
  blockNumber: 12_345_678n,
  tokenIds: [10, 20, 30, 40, 50],
};

describe("parseTargetIdParam", () => {
  it("accepts canonical positive decimal token IDs in range", () => {
    assert.deepEqual(parseTargetIdParam("1"), {
      status: "valid",
      tokenId: 1,
      raw: "1",
    });
    assert.deepEqual(parseTargetIdParam("12"), {
      status: "valid",
      tokenId: 12,
      raw: "12",
    });
    assert.deepEqual(parseTargetIdParam(String(SOCIETY_TOKEN_ID_MAX)), {
      status: "valid",
      tokenId: SOCIETY_TOKEN_ID_MAX,
      raw: String(SOCIETY_TOKEN_ID_MAX),
    });
  });

  it("rejects empty, signed, fractional, padded, nonnumeric, zero, negative, and out-of-range IDs", () => {
    const rejected = [
      "",
      " ",
      "+12",
      "-1",
      "-12",
      "12.5",
      "1e2",
      "012",
      "001",
      "0",
      "abc",
      "12abc",
      " 12",
      "12 ",
      String(SOCIETY_TOKEN_ID_MAX + 1),
      "9999",
      "0x12",
    ];

    for (const raw of rejected) {
      assert.deepEqual(
        parseTargetIdParam(raw),
        { status: "invalid_id", raw },
        `expected invalid for ${JSON.stringify(raw)}`,
      );
    }
  });
});

describe("resolveBurnPoolTarget", () => {
  it("resolves first, middle, and final pool positions with 1-based display and index+1 bound", () => {
    const first = resolveBurnPoolTarget({
      rawTargetId: "10",
      snapshot: sampleSnapshot,
    });
    assert.equal(first.status, "available");
    if (first.status !== "available") return;
    assert.equal(first.tokenId, 10);
    assert.equal(first.index, 0);
    assert.equal(first.position, 1);
    assert.equal(first.maxRotations, 1);
    assert.equal(first.blockNumber, sampleSnapshot.blockNumber);
    assert.equal(first.image, FAME_METADATA_FALLBACK_IMAGE);

    const middle = resolveBurnPoolTarget({
      rawTargetId: "30",
      snapshot: sampleSnapshot,
      image: "https://images.example/30.png",
    });
    assert.equal(middle.status, "available");
    if (middle.status !== "available") return;
    assert.equal(middle.index, 2);
    assert.equal(middle.position, 3);
    assert.equal(middle.maxRotations, 3);
    assert.equal(middle.image, "https://images.example/30.png");

    const final = resolveBurnPoolTarget({
      rawTargetId: "50",
      snapshot: sampleSnapshot,
    });
    assert.equal(final.status, "available");
    if (final.status !== "available") return;
    assert.equal(final.index, 4);
    assert.equal(final.position, 5);
    assert.equal(final.maxRotations, 5);
  });

  it("rejects invalid route IDs without consulting the pool", () => {
    const resolution = resolveBurnPoolTarget({
      rawTargetId: "012",
      snapshot: sampleSnapshot,
    });
    assert.deepEqual(resolution, { status: "invalid_id", raw: "012" });
  });

  it("marks a valid token absent from the pool as unavailable with /fame return", () => {
    const resolution = resolveBurnPoolTarget({
      rawTargetId: "99",
      snapshot: sampleSnapshot,
    });
    assert.deepEqual(resolution, {
      status: "unavailable",
      tokenId: 99,
      raw: "99",
      returnHref: "/fame",
    });
  });

  it("keeps pool read failures retryable and does not masquerade as unavailable", () => {
    const resolution = resolveBurnPoolTarget({
      rawTargetId: "20",
      poolReadError: new Error("RPC timeout"),
      // Even if a stale snapshot is also present, an explicit error wins.
      snapshot: sampleSnapshot,
    });
    assert.equal(resolution.status, "retryable_read_failure");
    if (resolution.status !== "retryable_read_failure") return;
    assert.equal(resolution.tokenId, 20);
    assert.match(resolution.message, /RPC timeout/);
  });

  it("treats a missing snapshot without an error as retryable, not unavailable", () => {
    const resolution = resolveBurnPoolTarget({
      rawTargetId: "20",
      snapshot: null,
    });
    assert.equal(resolution.status, "retryable_read_failure");
    if (resolution.status !== "retryable_read_failure") return;
    assert.equal(resolution.tokenId, 20);
  });

  it("leaves target identity and eligibility intact when metadata falls back", () => {
    const withMissingImage = resolveBurnPoolTarget({
      rawTargetId: "20",
      snapshot: sampleSnapshot,
      image: null,
    });
    assert.equal(withMissingImage.status, "available");
    if (withMissingImage.status !== "available") return;
    assert.equal(withMissingImage.tokenId, 20);
    assert.equal(withMissingImage.position, 2);
    assert.equal(withMissingImage.maxRotations, 2);
    assert.equal(withMissingImage.image, FAME_METADATA_FALLBACK_IMAGE);

    const withEmptyImage = resolveBurnPoolTarget({
      rawTargetId: "20",
      snapshot: sampleSnapshot,
      image: "",
    });
    assert.equal(withEmptyImage.status, "available");
    if (withEmptyImage.status !== "available") return;
    assert.equal(withEmptyImage.image, FAME_METADATA_FALLBACK_IMAGE);
  });

  it("exposes the R3 exchange explanation for the page shell", () => {
    assert.match(ROTATION_EXCHANGE_EXPLANATION, /explicitly select/i);
    assert.match(ROTATION_EXCHANGE_EXPLANATION, /reverts/i);
    assert.match(ROTATION_EXCHANGE_EXPLANATION, /keep your NFT/i);
    assert.match(ROTATION_EXCHANGE_EXPLANATION, /burn-pool target/i);
  });
});
