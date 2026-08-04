import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { zeroAddress } from "viem";
import { classifyFameGalleryStatus } from "./status";

const marketplace = "0x1111111111111111111111111111111111111111" as const;

describe("FAME Gallery status", () => {
  it("prioritizes a verified available path", () => assert.equal(classifyFameGalleryStatus({ owner: marketplace, marketplace, available: true }), "available"));
  it("does not label marketplace custody as owned", () => assert.equal(classifyFameGalleryStatus({ owner: marketplace, marketplace, available: false }), "not_available"));
  it("labels a verified collector holder as owned", () => assert.equal(classifyFameGalleryStatus({ owner: "0x2222222222222222222222222222222222222222", marketplace, available: false }), "owned"));
  it("never infers owned from a successful owner read when marketplace authority is ambiguous", () => assert.equal(classifyFameGalleryStatus({
    owner: "0x2222222222222222222222222222222222222222",
    marketplace,
    available: false,
    authorityVerified: false,
  }), "unknown"));
  it("keeps uncertain authority unknown", () => assert.equal(classifyFameGalleryStatus({ owner: zeroAddress, marketplace: null, available: null }), "unknown"));
});
