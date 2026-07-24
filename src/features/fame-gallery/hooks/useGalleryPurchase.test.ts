import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Address, Hash } from "viem";
import type {
  GalleryArtworkTarget,
  GalleryVerifiedAcquisition,
} from "../types";
import {
  galleryCandidateTokenIdsForArtwork,
  isTokenInGalleryArtPool,
  logGalleryPurchaseError,
  refreshGalleryAfterPurchase,
  shouldAutoCloseGalleryPurchaseModal,
} from "./useGalleryPurchase";

const acquisition: GalleryVerifiedAcquisition = {
  transactionHash: `0x${"a".repeat(64)}` as Hash,
  receiptBlockNumber: 500n,
  deliveredShellId: 19n,
  artworkHash: `0x${"b".repeat(64)}` as Hash,
  unit: 1_000n,
  premium: 25n,
  total: 1_025n,
  recipient: "0x1111111111111111111111111111111111111111" as Address,
  affectedTokenIds: [19n, 7n],
};

describe("gallery purchase hook adapter", () => {
  it("auto-closes only after a verified purchase", () => {
    assert.equal(shouldAutoCloseGalleryPurchaseModal("refreshing"), true);
    assert.equal(shouldAutoCloseGalleryPurchaseModal("verified"), true);
    assert.equal(
      shouldAutoCloseGalleryPurchaseModal("confirmed_unverified"),
      false,
    );
    assert.equal(shouldAutoCloseGalleryPurchaseModal("error"), false);
  });

  it("logs the original purchase error object with its queue stage", () => {
    const cause = new Error("RPC request failed");
    const calls: unknown[][] = [];
    const originalConsoleError = console.error;
    console.error = (...values: unknown[]) => {
      calls.push(values);
    };

    try {
      logGalleryPurchaseError("verification", cause);
    } finally {
      console.error = originalConsoleError;
    }

    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], "[gallery purchase:verification]");
    assert.strictEqual(calls[0][1], cause);
  });

  it("resolves only same-artwork candidates while retaining duplicate valid routes", () => {
    const selectedHash = acquisition.artworkHash;
    const otherHash = `0x${"c".repeat(64)}` as Hash;
    const target = (
      targetId: string,
      tokenId: bigint,
      artworkHash: Hash | null,
    ): GalleryArtworkTarget => ({
      targetId,
      kind: targetId.startsWith("held") ? "held" : "mint",
      tokenId,
      artworkHash,
      tokenUri: null,
      artworkError: null,
    });

    assert.deepEqual(
      galleryCandidateTokenIdsForArtwork(
        [
          target("pool:mint:7", 7n, selectedHash),
          target("held:19", 19n, selectedHash),
          target("pool:mint:8", 8n, otherHash),
          target("held:20", 20n, null),
        ],
        selectedHash,
      ),
      [7n, 19n],
    );
  });

  it("treats both canonical Art Pool boundaries as inclusive", () => {
    assert.equal(isTokenInGalleryArtPool(100n, 100n, 199n), true);
    assert.equal(isTokenInGalleryArtPool(199n, 100n, 199n), true);
    assert.equal(isTokenInGalleryArtPool(99n, 100n, 199n), false);
    assert.equal(isTokenInGalleryArtPool(200n, 100n, 199n), false);
  });

  it("advances global, complete pool, and only receipt IDs even when they finish out of order", async () => {
    const calls: string[] = [];
    let releaseGlobal!: () => void;
    const global = new Promise<void>((resolve) => {
      releaseGlobal = resolve;
    });
    const pending = refreshGalleryAfterPurchase(acquisition, {
      async refreshGlobal() {
        calls.push("global");
        await global;
      },
      async refreshPool() {
        calls.push("pool");
      },
      async revalidateAffectedTokenIds(tokenIds) {
        calls.push(`tokens:${tokenIds.join(",")}`);
        return [];
      },
    });

    await Promise.resolve();
    assert.deepEqual(calls, ["global", "pool", "tokens:19,7"]);
    releaseGlobal();
    await pending;
    assert.deepEqual(calls, ["global", "pool", "tokens:19,7"]);
  });
});
