import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { LandingMarketPresentation } from "../pricePresentation";
import { FameMarketBoard } from "./FameMarketBoard";

const market: LandingMarketPresentation = {
  prices: {
    defiBuy: {
      fame: "1M FAME",
      USDC: { value: "12.34 USDC" },
      ETH: { value: "0.005 ETH" },
    },
    defiSell: {
      fame: "1M FAME",
      USDC: { value: "11.90 USDC" },
      ETH: { value: "0.005 ETH" },
    },
    nftBuy: {
      fame: "1.05M FAME",
      USDC: { value: "12.95 USDC" },
      ETH: { value: "0.005 ETH" },
    },
  },
  marketCap: {
    USDC: { value: "10.8K USDC" },
    ETH: { value: "4.4 ETH" },
  },
  marketplaceSupply: "888M FAME",
};

describe("FAME market board", () => {
  it("shows dual-currency market cap above DeFi prices", () => {
    const markup = renderToStaticMarkup(
      <FameMarketBoard initialMarket={market} />,
    );

    assert.match(markup, /DeFi buy/);
    assert.match(markup, /DeFi sell/);
    assert.match(markup, /Marketplace/);
    assert.match(markup, /Any 1 Society NFT/);
    assert.match(markup, /888M FAME/);
    assert.match(
      markup,
      /<div class="fame-display mt-3 text-2xl tabular-nums">888M FAME<\/div>/,
    );
    assert.match(markup, /1.05M FAME/);
    assert.doesNotMatch(markup, /1.1M FAME/);
    assert.doesNotMatch(markup, /NFT sell/);
    assert.match(markup, /Market cap/);
    assert.match(markup, /10.8K USDC/);
    assert.match(markup, /4.4 ETH/);
    assert.ok(markup.indexOf("Market cap") < markup.indexOf("DeFi buy"));
    assert.ok(markup.indexOf("Market cap") < markup.indexOf("888M FAME"));
    assert.ok(markup.indexOf("888M FAME") < markup.indexOf("10.8K USDC"));
    assert.ok(markup.indexOf("DeFi buy") < markup.indexOf("DeFi sell"));
    assert.doesNotMatch(markup, /Liquidity|Buy depth|Sell depth/);
    assert.match(markup, /1M FAME/);
    assert.doesNotMatch(markup, /cache|route|validation|slippage|unavailable/i);
  });

  it("shows activity indicators for missing prices and market cap", () => {
    const empty: LandingMarketPresentation = {
      prices: {
        defiBuy: {
          fame: "1M FAME",
          USDC: { value: null },
          ETH: { value: null },
        },
        defiSell: {
          fame: "1M FAME",
          USDC: { value: null },
          ETH: { value: null },
        },
        nftBuy: {
          fame: null,
          USDC: { value: null },
          ETH: { value: null },
        },
      },
      marketCap: {
        USDC: { value: null },
        ETH: { value: null },
      },
      marketplaceSupply: null,
    };
    const markup = renderToStaticMarkup(
      <FameMarketBoard initialMarket={empty} />,
    );

    assert.equal((markup.match(/aria-label="Loading"/g) ?? []).length, 10);
    assert.doesNotMatch(markup, /Unavailable|error|failed/i);
  });
});
