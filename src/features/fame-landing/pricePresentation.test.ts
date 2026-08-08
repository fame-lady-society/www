import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
  LandingMarketStats,
  MarketProjectionState,
} from "./cachedMarketStats";
import {
  formatPrice,
  presentLandingMetrics,
  presentLandingPrices,
} from "./pricePresentation";

describe("FAME landing price formatting", () => {
  it("keeps normal prices compact", () => {
    assert.equal(
      formatPrice(108_821_009_700_020_240n, 18, "ETH"),
      "0.108821 ETH",
    );
    assert.equal(formatPrice(202_946_333n, 6, "USDC"), "202.946333 USDC");
  });

  it("abbreviates thousands and millions to at most one decimal", () => {
    assert.equal(
      formatPrice(218_655_239_996n, 6, "USDC"),
      "218.7K USDC",
    );
    assert.equal(formatPrice(1_000_000_000n, 6, "USDC"), "1K USDC");
    assert.equal(
      formatPrice(1_050_000n * 10n ** 18n, 18, "FAME"),
      "1.1M FAME",
    );
  });

  it("never turns a small nonzero price into zero or scientific notation", () => {
    const value = formatPrice(20_411n, 18, "ETH");
    assert.equal(value, "0.00000000000002041 ETH");
    assert.doesNotMatch(value, /e[+-]/i);
  });

  it("formats market cap, liquidity, and both depth sides", () => {
    const capturedAt = "2026-08-03T12:00:00.000Z";
    const available = <T>(data: T): MarketProjectionState<T> => ({
      status: "available",
      freshness: "fresh",
      value: { capturedAt, data },
    });
    const quote = (amount: string) => available({ amount });
    const stats = {
      marketplace: available({
        premium: (50_000n * 10n ** 18n).toString(),
        unit: (1_000_000n * 10n ** 18n).toString(),
        totalSupply: (888_000_000n * 10n ** 18n).toString(),
        totalProviderUnits: "2",
        decimals: 18,
      }),
      defiBuyUsdc: quote("12340000"),
      defiBuyEth: quote("5000000000000000"),
      defiSellUsdc: quote("11900000"),
      defiSellEth: quote("4800000000000000"),
      nftBuyUsdc: quote("12950000"),
      nftBuyEth: quote("5200000000000000"),
      buyDepth: available({ amount: "1000000000", atLeast: true }),
      sellDepth: available({
        amount: "5000000000",
        atLeast: false,
      }),
    } satisfies LandingMarketStats;

    assert.deepEqual(presentLandingMetrics(stats), {
      marketCap: { value: "10.8K USDC" },
      liquidity: { value: "2M FAME" },
      buyDepth: { value: "1K USDC+" },
      sellDepth: { value: "5K USDC" },
    });
    assert.equal(presentLandingPrices(stats).defiBuy.fame, "1M FAME");
    assert.equal(presentLandingPrices(stats).nftBuy.fame, "1.1M FAME");
  });
});
