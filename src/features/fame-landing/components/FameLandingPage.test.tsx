import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { FameLandingPage } from "./FameLandingPage";

const capturedAt = "2026-08-03T12:00:00.000Z";
const available = (data: unknown, blockNumber = "100") => ({
  status: "available" as const,
  freshness: "fresh" as const,
  value: { capturedAt, blockNumber, data },
});
const stats = {
  marketplace: available({
    paused: false,
    premium: "1000000000000000000",
    unit: "10000000000000000000",
    totalSupply: "8880000000000000000000",
    decimals: 18,
    totalProviderUnits: "1000000000000000000",
    activeProviderCount: "1",
    inventory: "3",
  }),
  usdcBuy: available({
    currency: "USDC",
    side: "buy",
    amount: "11000000",
    protectedAmount: "1",
    basis: { unit: "1", premium: "1" },
    capturedAt,
  }),
  usdcSell: available({
    currency: "USDC",
    side: "sell",
    amount: "1",
    protectedAmount: "9900000",
    basis: { unit: "1", premium: "1" },
    capturedAt,
  }),
  ethBuy: available({
    currency: "ETH",
    side: "buy",
    amount: "11000000000000000",
    protectedAmount: "1",
    basis: { unit: "1", premium: "1" },
    capturedAt,
  }),
  ethSell: available({
    currency: "ETH",
    side: "sell",
    amount: "1",
    protectedAmount: "9000000000000000",
    basis: { unit: "1", premium: "1" },
    capturedAt,
  }),
  buyDepth: available({
    side: "buy",
    amount: "1000000",
    atLeast: false,
    capturedAt,
  }),
  sellDepth: available({
    side: "sell",
    amount: "1000000000000000000",
    atLeast: false,
    capturedAt,
  }),
};

describe("FAME landing", () => {
  it("renders the compact market board and only the settled lower destinations", () => {
    const markup = renderToStaticMarkup(<FameLandingPage stats={stats} />);
    assert.match(markup, /BUY A FAME SOCIETY NFT FOR/);
    assert.match(markup, /SELL A FAME SOCIETY NFT FOR/);
    assert.match(markup, /Society staked/);
    assert.match(markup, /href="\/fame\/market"/);
    assert.match(markup, /href="\/fame\/gallery"/);
    assert.match(markup, /href="\/fame\/rotate"/);
    assert.doesNotMatch(markup, /token checker|auction|community story/i);
    assert.match(markup, /8835\.60 USDC/);
    assert.match(markup, /totalSupply × validated USDC midpoint/);
    assert.doesNotMatch(markup, /8880 FAME basis/);
  });

  it("suppresses market cap when the USDC midpoint cannot be validated", () => {
    const markup = renderToStaticMarkup(
      <FameLandingPage stats={{ ...stats, usdcSell: { status: "unavailable", reason: "quote unavailable" } }} />,
    );
    assert.match(markup, /Total-supply market cap[\s\S]*?Unavailable/);
    assert.doesNotMatch(markup, /8835\.60 USDC/);
  });
});
