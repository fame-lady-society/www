import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type {
  LandingMarketStats,
  MarketProjectionState,
} from "../cachedMarketStats";
import { FameLandingPage } from "./FameLandingPage";

const capturedAt = "2026-08-03T12:00:00.000Z";
const available = <T,>(data: T): MarketProjectionState<T> => ({
  status: "available" as const,
  freshness: "fresh" as const,
  value: { capturedAt, data },
});
const quote = (amount: string) => available({ amount });

const stats = {
  marketplace: available({
    premium: "50000000000000000000000",
    unit: "1000000000000000000000000",
    decimals: 18,
  }),
  defiBuyUsdc: quote("12340000"),
  defiBuyEth: quote("5000000000000000"),
  defiSellUsdc: quote("11900000"),
  defiSellEth: quote("4800000000000000"),
  nftBuyUsdc: quote("12950000"),
  nftBuyEth: quote("5200000000000000"),
} satisfies LandingMarketStats;

describe("FAME landing", () => {
  it("renders the three prices and the FAME destinations", () => {
    const markup = renderToStaticMarkup(<FameLandingPage stats={stats} />);

    assert.match(markup, /DeFi buy/);
    assert.match(markup, /DeFi sell/);
    assert.match(markup, /NFT buy/);
    assert.doesNotMatch(markup, /NFT sell/);
    assert.match(markup, /12\.34 USDC/);
    assert.match(markup, /0\.005 ETH/);
    assert.match(markup, /href="\/fame\/market"/);
    assert.match(markup, /href="\/fame\/gallery"/);
    assert.match(markup, /href="\/fame\/rotate"/);
    assert.doesNotMatch(markup, /cache|timestamp|market cap|depth|staked/i);
  });

  it("keeps missing values loading without technical copy", () => {
    const markup = renderToStaticMarkup(
      <FameLandingPage
        stats={{
          ...stats,
          defiSellUsdc: {
            status: "unavailable",
            reason: "internal quote failure",
          },
        }}
      />,
    );

    assert.match(markup, /aria-label="Loading"/);
    assert.doesNotMatch(markup, /internal quote failure|Unavailable|failed/i);
  });
});
