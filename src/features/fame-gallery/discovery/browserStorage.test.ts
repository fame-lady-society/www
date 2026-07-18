import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getBrowserGalleryDiscoveryStorage } from "./browserStorage";

describe("browser gallery discovery storage", () => {
  it("shares memory between discovery and recovery scan callers", () => {
    assert.equal(
      getBrowserGalleryDiscoveryStorage(),
      getBrowserGalleryDiscoveryStorage(),
    );
  });
});
