import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Hash } from "viem";
import type { GalleryArtworkTarget } from "../types";
import {
  appendGalleryCatalogTargets,
  createGalleryCatalog,
  reconcileGalleryCatalogTargets,
} from "./catalogAssembler";

const sharedHash =
  "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as Hash;

function target(
  targetId: string,
  tokenId: bigint,
  kind: GalleryArtworkTarget["kind"],
): GalleryArtworkTarget {
  return {
    targetId,
    tokenId,
    kind,
    artworkHash: sharedHash,
    tokenUri: "data:application/json,{}",
    artworkError: null,
  };
}

describe("gallery catalog assembly", () => {
  it("commits the pool batch first and appends held targets deterministically", () => {
    const pool = [
      target("pool:mint:8", 8n, "mint"),
      target("pool:burn:3", 3n, "burn"),
    ];
    const initial = createGalleryCatalog(pool);
    const appended = appendGalleryCatalogTargets(initial, [
      target("held:10", 10n, "held"),
      target("held:2", 2n, "held"),
    ]);

    assert.deepEqual(
      initial.map(({ targetId }) => targetId),
      ["pool:mint:8", "pool:burn:3"],
    );
    assert.deepEqual(
      appended.map(({ targetId }) => targetId),
      ["pool:mint:8", "pool:burn:3", "held:2", "held:10"],
    );
  });

  it("deduplicates only target IDs and keeps distinct routes with one artwork hash", () => {
    const first = target("held:1", 1n, "held");
    const sameTarget = { ...first };
    const sameArtworkDifferentTarget = target("pool:mint:2", 2n, "mint");

    assert.deepEqual(
      appendGalleryCatalogTargets([first], [
        sameTarget,
        sameArtworkDifferentTarget,
      ]).map(({ targetId }) => targetId),
      ["held:1", "pool:mint:2"],
    );
  });

  it("keeps surviving card order while removing stale targets and appending new ones", () => {
    const current = [
      target("held:10", 10n, "held"),
      target("held:5", 5n, "held"),
    ];
    const canonical = [
      target("held:2", 2n, "held"),
      target("held:10", 10n, "held"),
    ];

    assert.deepEqual(
      reconcileGalleryCatalogTargets(current, canonical).map(
        ({ targetId }) => targetId,
      ),
      ["held:10", "held:2"],
    );
  });
});
