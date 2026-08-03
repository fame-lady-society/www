import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { QueryClient } from "@tanstack/react-query";
import type { Address, Hash } from "viem";
import type {
  GalleryArtworkTarget,
  GalleryCheckoutQuote,
  GalleryFrozenBuyerTerms,
  GalleryVerifiedAcquisition,
} from "../types";
import {
  galleryCandidateTokenIdsForArtwork,
  galleryCheckoutSimulationKey,
  galleryCheckoutSubmissionError,
  invalidateOwnedSocietyAfterPurchase,
  isTokenInGalleryArtPool,
  logGalleryPurchaseError,
  refreshGalleryAfterPurchase,
  simulateGalleryCheckoutRequest,
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
  it("keys one diagnostic checkout simulation to quote, account, artwork, and fulfillment", () => {
    const terms: GalleryFrozenBuyerTerms = {
      chainId: 8_453,
      account: acquisition.recipient,
      recipient: acquisition.recipient,
      selectedTarget: { targetId: "pool:mint:7", tokenId: 7n },
      artworkHash: acquisition.artworkHash,
      unit: 1_000n,
      maxPremium: 25n,
      maximumSpend: 12n,
      allowanceTarget: "0x2222222222222222222222222222222222222222",
      checkout: {
        paymentAsset: "USDC" as const,
        inputToken: "0x3333333333333333333333333333333333333333",
        checkout: "0x2222222222222222222222222222222222222222",
        marketplace: "0x4444444444444444444444444444444444444444",
        maximumInput: 12n,
        routeHash: `0x${"5".repeat(64)}` as Hash,
        routeDeadline: 1_900_000_000n,
        quoteBlockNumber: 49_000_000n,
      },
    };
    const held = galleryCheckoutSimulationKey({
      terms,
      route: { kind: "held", shellId: 19n },
    });
    const pool = galleryCheckoutSimulationKey({
      terms,
      route: { kind: "pool", poolKind: "mint", shellId: 19n, sourceId: 7n },
    });

    assert.ok(held);
    assert.ok(pool);
    assert.notEqual(held, pool);
  });

  it("rejects an expired quote or changed account before simulation and write", () => {
    const terms: GalleryFrozenBuyerTerms = {
      chainId: 8_453,
      account: acquisition.recipient,
      recipient: acquisition.recipient,
      selectedTarget: { targetId: "held:19", tokenId: 19n },
      artworkHash: acquisition.artworkHash,
      unit: 1_000n,
      maxPremium: 25n,
      maximumSpend: 12n,
      allowanceTarget: "0x2222222222222222222222222222222222222222",
      checkout: {
        paymentAsset: "ETH",
        inputToken: "0x0000000000000000000000000000000000000000",
        checkout: "0x2222222222222222222222222222222222222222",
        marketplace: "0x4444444444444444444444444444444444444444",
        maximumInput: 12n,
        routeHash: `0x${"5".repeat(64)}` as Hash,
        routeDeadline: 1_900_000_000n,
        quoteBlockNumber: 49_000_000n,
      },
    };
    const quote = {
      expiresAt: new Date(1_000),
    } as GalleryCheckoutQuote;

    assert.match(
      galleryCheckoutSubmissionError({
        terms,
        quote,
        connectedAccount: acquisition.recipient,
        connectedChainId: 8_453,
        networkName: "Base",
        now: 1_001,
      })?.message ?? "",
      /expired/u,
    );
    assert.match(
      galleryCheckoutSubmissionError({
        terms,
        quote: { ...quote, expiresAt: new Date(2_000) },
        connectedAccount: "0x9999999999999999999999999999999999999999",
        connectedChainId: 8_453,
        networkName: "Base",
        now: 1_001,
      })?.message ?? "",
      /account or Base chain changed/u,
    );
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

  it("treats checkout simulation failure as a diagnostic and preserves the wallet request", async () => {
    const request = { functionName: "checkoutHeld", value: 12n } as const;
    const failure = new Error("fork simulation unavailable");
    const diagnostics: unknown[] = [];

    const executable = await simulateGalleryCheckoutRequest({
      request,
      simulate: async () => {
        throw failure;
      },
      onDiagnostic: (cause) => diagnostics.push(cause),
    });

    assert.strictEqual(executable, request);
    assert.deepEqual(diagnostics, [failure]);
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

  it("invalidates only the owned Society query family after purchase", async () => {
    const queryClient = new QueryClient();
    const ownedKey = ["gallery-redemption-owned", 8453, "0x123"];
    const unrelatedKey = ["gallery-redemption-quote", 8453, "0x123"];
    queryClient.setQueryData(ownedKey, [199n]);
    queryClient.setQueryData(unrelatedKey, { output: 1n });

    await invalidateOwnedSocietyAfterPurchase(queryClient);

    assert.equal(queryClient.getQueryState(ownedKey)?.isInvalidated, true);
    assert.equal(queryClient.getQueryState(unrelatedKey)?.isInvalidated, false);
  });
});
