import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Address, Hash } from "viem";
import type { GalleryArtworkTarget } from "../types";
import {
  createGalleryCustodyHintCache,
  type GalleryCustodyCacheIdentity,
} from "./cache";
import {
  createInitialGalleryScanRegistry,
  discoverGalleryHoldings,
  revalidateGalleryHeldTokenIds,
  type GalleryCustodyDiscoverySource,
} from "./discovery";

const marketplace = "0x1111111111111111111111111111111111111111" as Address;
const outside = "0x2222222222222222222222222222222222222222" as Address;
const hash =
  "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as Hash;
const cacheIdentity: GalleryCustodyCacheIdentity = {
  chainId: 8_453,
  manifestVersion: 1,
  marketplaceAddress: marketplace,
  deploymentBlock: "0",
  firstTokenId: "1",
  lastTokenId: "888",
};

function hintCache(tokenIds: readonly bigint[], updatedAt: number) {
  return createGalleryCustodyHintCache(tokenIds, cacheIdentity, updatedAt);
}

function target(tokenId: bigint): GalleryArtworkTarget {
  return {
    targetId: `held:${tokenId}`,
    kind: "held",
    tokenId,
    artworkHash: hash,
    tokenUri: `data:application/json,${tokenId}`,
    artworkError: null,
  };
}

function source(options?: {
  held?: readonly bigint[];
  failScan?: boolean;
  failCustody?: readonly bigint[];
}): GalleryCustodyDiscoverySource {
  const held = new Set(options?.held ?? []);
  const failedCustody = new Set(options?.failCustody ?? []);
  return {
    getBlockNumber: async () => 100n,
    async readCustodyStates(tokenIds, blockNumber) {
      if (options?.failScan && tokenIds.length > 2) {
        throw new Error("rpc unavailable");
      }
      return new Map(
        tokenIds
          .filter((tokenId) => !failedCustody.has(tokenId))
          .map((tokenId) => [
            tokenId,
            {
              status: "success" as const,
              blockNumber,
              data: {
                tokenId,
                owner: held.has(tokenId) ? marketplace : outside,
                marketplaceHeld: held.has(tokenId),
              },
            },
          ]),
      );
    },
    getAffectedTokenIds: async () => [],
    async readTokenStates(tokenIds, blockNumber) {
      return new Map(
        tokenIds.map((tokenId) => [
          tokenId,
          held.has(tokenId)
            ? {
                status: "success" as const,
                blockNumber,
                data: {
                  tokenId,
                  owner: marketplace,
                  marketplaceHeld: true,
                  artworkHash: hash,
                  tokenUri: `data:application/json,${tokenId}`,
                  artworkError: null,
                },
              }
            : {
                status: "success" as const,
                blockNumber,
                data: {
                  tokenId,
                  owner: outside,
                  marketplaceHeld: false,
                  artworkHash: null,
                  tokenUri: null,
                  artworkError: null,
                },
              },
        ]),
      );
    },
  };
}

describe("gallery custody discovery", () => {
  it("shows only revalidated hints, then still completes the full scan", async () => {
    const stages: { kind: string; tokenIds: bigint[] }[] = [];
    const result = await discoverGalleryHoldings({
      source: source({ held: [1n, 3n] }),
      marketplace,
      cacheIdentity,
      restoredHints: hintCache([1n, 2n], 1),
      persist: async () => undefined,
      onTargets: (kind, targets) => {
        stages.push({ kind, tokenIds: targets.map(({ tokenId }) => tokenId) });
      },
    });

    assert.deepEqual(stages, [
      { kind: "hints", tokenIds: [1n] },
      { kind: "scan", tokenIds: [1n, 3n] },
    ]);
    assert.deepEqual(
      result.targets.map(({ tokenId }) => tokenId),
      [1n, 3n],
    );
  });

  it("keeps discovery silent when the full scan cannot produce holdings", async () => {
    const result = await discoverGalleryHoldings({
      source: source({ held: [1n], failScan: true }),
      marketplace,
      cacheIdentity,
      restoredHints: null,
      persist: async () => undefined,
    });

    assert.deepEqual(result.targets, []);
    assert.equal(result.scanCompleted, false);
    assert.equal("error" in result, false);
  });

  it("preserves revalidated holdings when their full-scan reads fail", async () => {
    const stages: { kind: string; tokenIds: bigint[] }[] = [];
    let persistedIds: string[] = [];
    const result = await discoverGalleryHoldings({
      source: source({ held: [1n], failCustody: [1n] }),
      marketplace,
      cacheIdentity,
      restoredHints: hintCache([1n], 1),
      persist: async (record) => {
        persistedIds = record.heldTokenIds;
      },
      onTargets: (kind, targets) => {
        stages.push({ kind, tokenIds: targets.map(({ tokenId }) => tokenId) });
      },
    });

    assert.deepEqual(stages, [
      { kind: "hints", tokenIds: [1n] },
      { kind: "scan", tokenIds: [1n] },
    ]);
    assert.deepEqual(result.targets, [target(1n)]);
    assert.equal(result.scanCompleted, false);
    assert.deepEqual(persistedIds, ["1"]);
  });

  it("does not duplicate a held target when only its reconciliation read fails", async () => {
    const base = source({ held: [1n] });
    let blockReads = 0;
    const reconciliationFailure: GalleryCustodyDiscoverySource = {
      ...base,
      getBlockNumber: async () => (++blockReads === 1 ? 100n : 101n),
      getAffectedTokenIds: async () => [1n],
      readCustodyStates: (tokenIds, blockNumber) =>
        blockNumber === 101n
          ? Promise.resolve(new Map())
          : base.readCustodyStates(tokenIds, blockNumber),
    };

    const result = await discoverGalleryHoldings({
      source: reconciliationFailure,
      marketplace,
      cacheIdentity,
      restoredHints: hintCache([1n], 1),
      persist: async () => undefined,
    });

    assert.deepEqual(
      result.targets.map(({ tokenId }) => tokenId),
      [1n],
    );
    assert.equal(result.scanCompleted, true);
  });

  it("drops a hint when final hydration proves the token is no longer held", async () => {
    const base = source({ held: [1n] });
    let blockReads = 0;
    let tokenStateReads = 0;
    let persistedIds: string[] = [];
    const finallyNotHeld: GalleryCustodyDiscoverySource = {
      ...base,
      getBlockNumber: async () => (++blockReads === 1 ? 100n : 101n),
      getAffectedTokenIds: async () => [1n],
      readCustodyStates: (tokenIds, blockNumber) =>
        blockNumber === 101n
          ? Promise.resolve(new Map())
          : base.readCustodyStates(tokenIds, blockNumber),
      async readTokenStates(tokenIds, blockNumber) {
        tokenStateReads += 1;
        if (tokenStateReads === 1) {
          return base.readTokenStates(tokenIds, blockNumber);
        }
        return new Map(
          tokenIds.map((tokenId) => [
            tokenId,
            {
              status: "success" as const,
              blockNumber,
              data: {
                tokenId,
                owner: outside,
                marketplaceHeld: false,
                artworkHash: null,
                tokenUri: null,
                artworkError: null,
              },
            },
          ]),
        );
      },
    };

    const result = await discoverGalleryHoldings({
      source: finallyNotHeld,
      marketplace,
      cacheIdentity,
      restoredHints: hintCache([1n], 1),
      persist: async (record) => {
        persistedIds = record.heldTokenIds;
      },
    });

    assert.deepEqual(result.targets, []);
    assert.deepEqual(persistedIds, []);
    assert.equal(result.scanCompleted, true);
  });

  it("revalidates only requested affected IDs without starting a collection scan", async () => {
    const calls: bigint[][] = [];
    const base = source({ held: [2n] });
    const wrapped: GalleryCustodyDiscoverySource = {
      ...base,
      async readTokenStates(tokenIds, blockNumber) {
        calls.push([...tokenIds]);
        return base.readTokenStates(tokenIds, blockNumber);
      },
    };

    const targets = await revalidateGalleryHeldTokenIds(wrapped, [2n, 3n]);

    assert.deepEqual(calls, [[2n, 3n]]);
    assert.deepEqual(targets, [target(2n)]);
  });

  it("reuses one initial automatic attempt across consumers and later triggers", async () => {
    const registry = createInitialGalleryScanRegistry();
    let scans = 0;
    const run = () =>
      registry.run("deployment", async () => {
        scans += 1;
        return scans;
      });

    assert.equal(await run(), 1);
    assert.equal(await run(), 1);
    assert.equal(await run(), 1);
    assert.equal(scans, 1);
  });
});
