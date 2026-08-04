import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFI_FAME_AMOUNT,
  composeMarketProjections,
  landingExactTargetSearch,
  landingQuoteDefinition,
} from "./cachedMarketStats";

describe("FAME landing projection composition", () => {
  it("keeps sources independent when one cold source fails", async () => {
    const states = await composeMarketProjections(
      {
        market: async () => ({
          capturedAt: "2026-08-03T12:29:00.000Z",
          data: { unit: "1" },
        }),
        usdcBuy: async () => {
          throw new Error("offline");
        },
      },
      Date.parse("2026-08-03T12:30:00.000Z"),
    );
    assert.equal(states.market.status, "available");
    assert.deepEqual(states.usdcBuy, {
      status: "unavailable",
      reason: "Market prices are loading.",
    });
  });

  it("keeps completed prices when another source misses the deadline", async () => {
    const states = await composeMarketProjections(
      {
        market: async () => ({
          capturedAt: "2026-08-03T12:29:00.000Z",
          data: { unit: "1" },
        }),
        pending: () => new Promise<never>(() => undefined),
      },
      Date.parse("2026-08-03T12:30:00.000Z"),
      5,
    );

    assert.equal(states.market.status, "available");
    assert.deepEqual(states.pending, {
      status: "unavailable",
      reason: "Market prices are loading.",
    });
  });

  it("defines exact one-million DeFi quotes at zero slippage", () => {
    const buy = landingQuoteDefinition("defiBuy", "USDC");
    const sell = landingQuoteDefinition("defiSell", "ETH");

    assert.equal(DEFI_FAME_AMOUNT, 1_000_000n * 10n ** 18n);
    assert.deepEqual(buy, {
      kind: "defiBuy",
      currency: "USDC",
      mode: "exactTarget",
      fameAmount: DEFI_FAME_AMOUNT,
      slippageBps: 0,
    });
    assert.deepEqual(sell, {
      kind: "defiSell",
      currency: "ETH",
      mode: "exactInput",
      fameAmount: DEFI_FAME_AMOUNT,
      slippageBps: 0,
    });
  });

  it("uses unit plus premium only for NFT buy", () => {
    assert.deepEqual(
      landingQuoteDefinition(
        "nftBuy",
        "USDC",
        1_000_000n * 10n ** 18n,
        50_000n * 10n ** 18n,
      ),
      {
        kind: "nftBuy",
        currency: "USDC",
        mode: "exactTarget",
        fameAmount: 1_050_000n * 10n ** 18n,
        slippageBps: 0,
      },
    );
  });

  it("refines buy prices beyond the coarse first quote", () => {
    assert.deepEqual(landingExactTargetSearch("USDC"), {
      minimumInput: 1n,
      maximumInput: 100_000n * 10n ** 6n,
      precision: 100n,
      maxEvaluations: 48,
      maxRpcReads: 192,
    });
    assert.deepEqual(landingExactTargetSearch("ETH"), {
      minimumInput: 1n,
      maximumInput: 100n * 10n ** 18n,
      precision: 10n ** 10n,
      maxEvaluations: 48,
      maxRpcReads: 192,
    });
  });
});
