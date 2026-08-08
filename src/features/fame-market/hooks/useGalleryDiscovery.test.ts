import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isCurrentGalleryScan } from "./useGalleryDiscovery";

describe("gallery discovery scan generations", () => {
  it("does not let an initial scan overwrite newer targeted revalidation", () => {
    assert.equal(isCurrentGalleryScan(2, 2), true);
    assert.equal(isCurrentGalleryScan(2, 3), false);
  });
});
