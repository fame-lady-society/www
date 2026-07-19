import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Address, Hash } from "viem";
import type { GalleryArtworkTarget } from "../types";
import { createGalleryCustodyHintCache } from "./cache";
import {
  createInitialGalleryScanRegistry,
  discoverGalleryHoldings,
  revalidateGalleryHeldTokenIds,
  type GalleryCustodyDiscoverySource,
} from "./discovery";

const marketplace =
  "0x1111111111111111111111111111111111111111" as Address;
const outside = "0x2222222222222222222222222222222222222222" as Address;
const hash =
  "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as Hash;

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
}): GalleryCustodyDiscoverySource {
  const held = new Set(options?.held ?? []);
  return {
    getBlockNumber: async () => 100n,
    async readCustodyStates(tokenIds, blockNumber) {
      if (options?.failScan && tokenIds.length > 2) {
        throw new Error("rpc unavailable");
      }
      return new Map(
        tokenIds.map((tokenId) => [
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
      restoredHints: createGalleryCustodyHintCache([1n, 2n], 1),
      persist: async () => undefined,
      onTargets: (kind, targets) => {
        stages.push({ kind, tokenIds: targets.map(({ tokenId }) => tokenId) });
      },
    });

    assert.deepEqual(stages, [
      { kind: "hints", tokenIds: [1n] },
      { kind: "scan", tokenIds: [1n, 3n] },
    ]);
    assert.deepEqual(result.targets.map(({ tokenId }) => tokenId), [1n, 3n]);
  });

  it("keeps discovery silent when the full scan cannot produce holdings", async () => {
    const result = await discoverGalleryHoldings({
      source: source({ held: [1n], failScan: true }),
      marketplace,
      restoredHints: null,
      persist: async () => undefined,
    });

    assert.deepEqual(result.targets, []);
    assert.equal(result.scanCompleted, false);
    assert.equal("error" in result, false);
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
