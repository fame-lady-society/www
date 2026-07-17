import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Address } from "viem";
import {
  scanGalleryRecoveryInventory,
  type GalleryRecoveryScanSource,
} from "./recoveryScan";

const gallery = "0x1111111111111111111111111111111111111111" as Address;
const outside = "0x2222222222222222222222222222222222222222" as Address;

describe("gallery recovery scan", () => {
  it("pins all 888 owner reads, caps batches at 64 and concurrency at two, then reconciles custody changes", async () => {
    let blockReads = 0;
    let activeOwnerReads = 0;
    let maxOwnerConcurrency = 0;
    const ownerBatchSizes: number[] = [];
    const source: GalleryRecoveryScanSource = {
      async getBlockNumber() {
        blockReads += 1;
        return blockReads === 1 ? 100n : 102n;
      },
      async readOwners(tokenIds, blockNumber) {
        assert.equal(blockNumber, 100n);
        ownerBatchSizes.push(tokenIds.length);
        activeOwnerReads += 1;
        maxOwnerConcurrency = Math.max(maxOwnerConcurrency, activeOwnerReads);
        await Promise.resolve();
        activeOwnerReads -= 1;
        return new Map(
          tokenIds.map((tokenId) => [
            tokenId,
            tokenId === 1n ? gallery : outside,
          ]),
        );
      },
      async getAffectedTokenIds(fromBlock, toBlock) {
        assert.equal(fromBlock, 100n);
        assert.equal(toBlock, 102n);
        return [1n, 2n];
      },
      async readFinalStates(tokenIds, blockNumber) {
        assert.equal(blockNumber, 102n);
        return new Map(
          tokenIds.map((tokenId) => [
            tokenId,
            {
              tokenId,
              owner: tokenId === 2n ? gallery : outside,
              listingActive: tokenId === 2n,
            },
          ]),
        );
      },
    };

    const result = await scanGalleryRecoveryInventory({ source, gallery });

    assert.equal(ownerBatchSizes.length, 14);
    assert.ok(ownerBatchSizes.every((size) => size <= 64));
    assert.ok(maxOwnerConcurrency <= 2);
    assert.deepEqual(result.galleryOwnedTokenIds, [2n]);
    assert.deepEqual(result.activeListingTokenIds, [2n]);
    assert.deepEqual(result.affectedTokenIds, [1n, 2n]);
  });

  it("cancels before starting later batches", async () => {
    const controller = new AbortController();
    let ownerCalls = 0;
    const source: GalleryRecoveryScanSource = {
      async getBlockNumber() {
        return 100n;
      },
      async readOwners(tokenIds) {
        ownerCalls += 1;
        controller.abort();
        return new Map(tokenIds.map((tokenId) => [tokenId, outside]));
      },
      async getAffectedTokenIds() {
        return [];
      },
      async readFinalStates() {
        return new Map();
      },
    };

    await assert.rejects(
      scanGalleryRecoveryInventory({
        source,
        gallery,
        signal: controller.signal,
      }),
      /cancelled/,
    );
    assert.ok(ownerCalls <= 2);
  });
});
