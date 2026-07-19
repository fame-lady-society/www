import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Address, Hash } from "viem";
import {
  scanGalleryCustody,
  type GalleryCustodyScanSource,
} from "./recoveryScan";

const marketplace =
  "0x1111111111111111111111111111111111111111" as Address;
const outside = "0x2222222222222222222222222222222222222222" as Address;
const artworkHash =
  "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as Hash;

function successCustody(tokenId: bigint, held: boolean, blockNumber: bigint) {
  return {
    status: "success" as const,
    blockNumber,
    data: {
      tokenId,
      owner: held ? marketplace : outside,
      marketplaceHeld: held,
    },
  };
}

function successToken(tokenId: bigint, blockNumber: bigint) {
  return {
    status: "success" as const,
    blockNumber,
    data: {
      tokenId,
      owner: marketplace,
      marketplaceHeld: true,
      artworkHash,
      tokenUri: `data:application/json,${tokenId}`,
      artworkError: null,
    },
  };
}

describe("gallery custody scan", () => {
  it("includes IDs 1 and 888, caps batches at 64 and concurrency at two, and isolates owner failures", async () => {
    const batchSizes: number[] = [];
    let active = 0;
    let maxActive = 0;
    const source: GalleryCustodyScanSource = {
      getBlockNumber: async () => 100n,
      async readCustodyStates(tokenIds, blockNumber) {
        batchSizes.push(tokenIds.length);
        active += 1;
        maxActive = Math.max(maxActive, active);
        await Promise.resolve();
        active -= 1;
        return new Map(
          tokenIds
            .filter((tokenId) => tokenId !== 2n)
            .map((tokenId) => [
              tokenId,
              successCustody(
                tokenId,
                tokenId === 1n || tokenId === 888n,
                blockNumber,
              ),
            ]),
        );
      },
      getAffectedTokenIds: async () => [],
      async readTokenStates(tokenIds, blockNumber) {
        return new Map(
          tokenIds.map((tokenId) => [
            tokenId,
            successToken(tokenId, blockNumber),
          ]),
        );
      },
    };

    const result = await scanGalleryCustody({ source, marketplace });

    assert.equal(batchSizes.length, 14);
    assert.ok(batchSizes.every((size) => size <= 64));
    assert.ok(maxActive <= 2);
    assert.deepEqual(result.heldTokenIds, [1n, 888n]);
    assert.deepEqual(result.failedTokenIds, [2n]);
    assert.deepEqual(
      result.targets.map(({ tokenId }) => tokenId),
      [1n, 888n],
    );
  });

  it("reconciles transfers between pinned scan start and end with final owner reads", async () => {
    let blockRead = 0;
    const reconciled: bigint[][] = [];
    const source: GalleryCustodyScanSource = {
      getBlockNumber: async () => (++blockRead === 1 ? 100n : 102n),
      async readCustodyStates(tokenIds, blockNumber) {
        if (blockNumber === 102n) reconciled.push([...tokenIds]);
        return new Map(
          tokenIds.map((tokenId) => [
            tokenId,
            successCustody(
              tokenId,
              blockNumber === 100n
                ? tokenId === 1n
                : tokenId === 2n,
              blockNumber,
            ),
          ]),
        );
      },
      async getAffectedTokenIds(fromBlock, toBlock) {
        assert.deepEqual([fromBlock, toBlock], [100n, 102n]);
        return [1n, 2n];
      },
      async readTokenStates(tokenIds, blockNumber) {
        return new Map(
          tokenIds.map((tokenId) => [
            tokenId,
            successToken(tokenId, blockNumber),
          ]),
        );
      },
    };

    const result = await scanGalleryCustody({ source, marketplace });

    assert.deepEqual(reconciled, [[1n, 2n]]);
    assert.deepEqual(result.affectedTokenIds, [1n, 2n]);
    assert.deepEqual(result.heldTokenIds, [2n]);
    assert.equal(result.reconciliationBlock, 102n);
  });

  it("supports cancellation between batches", async () => {
    const controller = new AbortController();
    let calls = 0;
    const source: GalleryCustodyScanSource = {
      getBlockNumber: async () => 100n,
      async readCustodyStates() {
        calls += 1;
        controller.abort();
        return new Map();
      },
      getAffectedTokenIds: async () => [],
      readTokenStates: async () => new Map(),
    };

    await assert.rejects(
      scanGalleryCustody({
        source,
        marketplace,
        signal: controller.signal,
      }),
      /cancelled/i,
    );
    assert.ok(calls <= 2);
  });
});
