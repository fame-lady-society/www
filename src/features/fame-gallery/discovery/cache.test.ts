import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BASE_SEPOLIA_TEST_GALLERY_CONFIG } from "../config/baseSepoliaTestGallery";
import {
  DISCOVERY_CACHE_MAX_BYTES,
  createGalleryDiscoveryProvenance,
  mergeGalleryDiscoveryCaches,
  parseGalleryDiscoveryCache,
  serializeGalleryDiscoveryCache,
  type GalleryDiscoveryCache,
} from "./cache";

const provenance = createGalleryDiscoveryProvenance();

function validCache(
  overrides: Partial<GalleryDiscoveryCache> = {},
): GalleryDiscoveryCache {
  return {
    schemaVersion: 1,
    provenance,
    candidateTokenIds: ["1", "2"],
    cursor: {
      blockNumber:
        BASE_SEPOLIA_TEST_GALLERY_CONFIG.checkpoint.blockNumber.toString(),
      blockHash: BASE_SEPOLIA_TEST_GALLERY_CONFIG.checkpoint.blockHash,
    },
    updatedAt: 1_000,
    ...overrides,
  };
}

describe("gallery discovery cache", () => {
  it("restores a bounded provenance-matching record", () => {
    assert.deepEqual(
      parseGalleryDiscoveryCache(
        serializeGalleryDiscoveryCache(validCache()),
        provenance,
      ),
      validCache(),
    );
  });

  it("rejects identity drift, missing manifest candidates, and future cursors", () => {
    const wrongGallery = validCache({
      provenance: {
        ...provenance,
        galleryAddress:
          BASE_SEPOLIA_TEST_GALLERY_CONFIG.addresses.fame.toLowerCase(),
      },
    });
    const missingManifestCandidate = validCache({
      candidateTokenIds: ["2"],
    });
    const futureCursor = validCache({
      cursor: {
        blockNumber: "44268000",
        blockHash: BASE_SEPOLIA_TEST_GALLERY_CONFIG.checkpoint.blockHash,
      },
    });

    assert.equal(
      parseGalleryDiscoveryCache(
        serializeGalleryDiscoveryCache(wrongGallery),
        provenance,
      ),
      null,
    );
    assert.equal(
      parseGalleryDiscoveryCache(
        serializeGalleryDiscoveryCache(missingManifestCandidate),
        provenance,
      ),
      null,
    );
    assert.equal(
      parseGalleryDiscoveryCache(
        serializeGalleryDiscoveryCache(futureCursor),
        provenance,
        { maxCursorBlock: 44_267_999n },
      ),
      null,
    );
  });

  it("rejects poisoned or amplifying records", () => {
    for (const candidateTokenIds of [
      ["1", "1"],
      ["0", "1"],
      ["1", "889"],
      ["0000000000000000000000000000000000000001"],
    ]) {
      assert.equal(
        parseGalleryDiscoveryCache(
          serializeGalleryDiscoveryCache(validCache({ candidateTokenIds })),
          provenance,
        ),
        null,
      );
    }

    assert.equal(
      parseGalleryDiscoveryCache(
        "x".repeat(DISCOVERY_CACHE_MAX_BYTES + 1),
        provenance,
      ),
      null,
    );
    assert.equal(
      parseGalleryDiscoveryCache(
        serializeGalleryDiscoveryCache(
          validCache({
            cursor: {
              blockNumber: (
                BASE_SEPOLIA_TEST_GALLERY_CONFIG.checkpoint.blockNumber - 1n
              ).toString(),
              blockHash: BASE_SEPOLIA_TEST_GALLERY_CONFIG.checkpoint.blockHash,
            },
          }),
        ),
        provenance,
      ),
      null,
    );
  });

  it("merges candidate unions without allowing an older cursor to win", () => {
    const older = validCache({
      candidateTokenIds: ["1", "2"],
      updatedAt: 2_000,
    });
    const newer = validCache({
      candidateTokenIds: ["1", "3"],
      cursor: {
        blockNumber: "44268000",
        blockHash:
          "0x1111111111111111111111111111111111111111111111111111111111111111",
      },
      updatedAt: 3_000,
    });

    assert.deepEqual(mergeGalleryDiscoveryCaches(newer, older), {
      ...newer,
      candidateTokenIds: ["1", "2", "3"],
    });
  });
});
