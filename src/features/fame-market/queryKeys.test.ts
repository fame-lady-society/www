import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BASE_SEPOLIA_TEST_GALLERY_CONFIG } from "./config/baseSepoliaTestGallery";
import {
  GALLERY_CANONICAL_QUERY_OPTIONS,
  galleryQueryKeys,
  type GalleryQueryIdentity,
} from "./queryKeys";

const identity: GalleryQueryIdentity = {
  chainId: BASE_SEPOLIA_TEST_GALLERY_CONFIG.chainId,
  manifestVersion: BASE_SEPOLIA_TEST_GALLERY_CONFIG.schemaVersion,
  marketplaceAddress: BASE_SEPOLIA_TEST_GALLERY_CONFIG.addresses.gallery,
  deploymentBlock: BASE_SEPOLIA_TEST_GALLERY_CONFIG.deployment.blockNumber,
};

describe("successor gallery query keys", () => {
  it("separates projection kind, pinned block, token, and account", () => {
    const account =
      "0x0000000000000000000000000000000000000001" as const;
    assert.notDeepEqual(
      galleryQueryKeys.global(identity, 100n),
      galleryQueryKeys.pool(identity, 100n),
    );
    assert.notDeepEqual(
      galleryQueryKeys.global(identity, 100n),
      galleryQueryKeys.global(identity, 101n),
    );
    assert.notDeepEqual(
      galleryQueryKeys.token(identity, 100n, 1n),
      galleryQueryKeys.token(identity, 100n, 2n),
    );
    assert.notDeepEqual(
      galleryQueryKeys.account(identity, 100n, account),
      galleryQueryKeys.authority(identity, 100n, account),
    );
  });

  it("separates chain, marketplace, and deployment identities", () => {
    const base = galleryQueryKeys.global(identity, 100n);
    assert.notDeepEqual(
      base,
      galleryQueryKeys.global({ ...identity, chainId: 1 }, 100n),
    );
    assert.notDeepEqual(
      base,
      galleryQueryKeys.global(
        { ...identity, manifestVersion: identity.manifestVersion + 1 },
        100n,
      ),
    );
    assert.notDeepEqual(
      base,
      galleryQueryKeys.global(
        {
          ...identity,
          marketplaceAddress:
            "0x0000000000000000000000000000000000000004",
        },
        100n,
      ),
    );
    assert.notDeepEqual(
      base,
      galleryQueryKeys.global(
        { ...identity, deploymentBlock: identity.deploymentBlock + 1n },
        100n,
      ),
    );
  });

  it("normalizes every bigint key field to a string", () => {
    const key = galleryQueryKeys.token(identity, 100n, 888n);
    assert.equal(key.includes(100n), false);
    assert.equal(key.includes(888n), false);
    assert.equal(key.includes(identity.deploymentBlock), false);
    assert.equal(key.includes("100"), true);
    assert.equal(key.includes("888"), true);
    assert.equal(key.includes(identity.deploymentBlock.toString()), true);
  });

  it("keeps canonical queries quiet until explicitly advanced", () => {
    assert.equal(GALLERY_CANONICAL_QUERY_OPTIONS.staleTime, Infinity);
    assert.equal(GALLERY_CANONICAL_QUERY_OPTIONS.refetchInterval, false);
    assert.equal(GALLERY_CANONICAL_QUERY_OPTIONS.refetchOnMount, false);
    assert.equal(GALLERY_CANONICAL_QUERY_OPTIONS.refetchOnWindowFocus, false);
    assert.equal(GALLERY_CANONICAL_QUERY_OPTIONS.refetchOnReconnect, false);
    assert.equal(GALLERY_CANONICAL_QUERY_OPTIONS.retry, false);
  });
});
