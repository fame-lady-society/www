import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { LandingMarketPresentation } from "../pricePresentation";
import { FameMarketBoard } from "./FameMarketBoard";

const market: LandingMarketPresentation = {
  prices: {
    defiBuy: {
      fame: "1M FAME",
      USDC: { value: "250 USDC" },
      ETH: { value: "0.42 ETH" },
    },
    defiSell: {
      fame: "1M FAME",
      USDC: { value: "240 USDC" },
      ETH: { value: "0.41 ETH" },
    },
    nftBuy: {
      fame: "1.05M FAME",
      USDC: { value: "262.5 USDC" },
      ETH: { value: "0.44 ETH" },
    },
  },
  marketCap: {
    USDC: { value: "242K USDC" },
    ETH: { value: "409.9 ETH" },
  },
  marketplaceSupply: "987.7M FAME",
  liquidity: {
    fame: { value: "25M FAME" },
    counterAssets: [
      {
        address: "0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926",
        label: "basedflick",
        value: "100 basedflick",
      },
      {
        address: "0x4200000000000000000000000000000000000006",
        label: "WETH",
        value: "3 WETH",
      },
      {
        address: "0x54016a4848a38f257b6e96331f7404073fd9c32c",
        label: "SCALE",
        value: "400 SCALE",
      },
      {
        address: "0xe5020a6d073a794b6e7f05678707de47986fb0b6",
        label: "frxUSD",
        value: "500 frxUSD",
      },
    ],
  },
};

describe("FAME market board", () => {
  it("preserves the market labels and direct-pool liquidity presentation", () => {
    const markup = renderToStaticMarkup(<FameMarketBoard market={market} />);

    assert.match(markup, /Market on Base/);
    assert.match(markup, /At a glance/);
    assert.match(markup, /Marketplace/);
    assert.match(markup, /Any 1 Society NFT/);
    assert.match(markup, /Market cap/);
    assert.match(markup, /DeFi buy/);
    assert.match(markup, /DeFi sell/);
    assert.match(markup, /Liquidity/);
    assert.match(markup, /25M FAME/);
    assert.match(markup, /100 basedflick/);
    assert.match(markup, /3 WETH/);
    assert.match(markup, /400 SCALE/);
    assert.match(markup, /500 frxUSD/);
    assert.ok(markup.indexOf("Market cap") < markup.indexOf("DeFi buy"));
    assert.ok(markup.indexOf("DeFi buy") < markup.indexOf("DeFi sell"));
    assert.doesNotMatch(markup, /cache|route|validation|slippage|unavailable/i);
  });

  it("renders a single unavailable leaf without removing same-snapshot values", () => {
    const partial = {
      ...market,
      prices: {
        ...market.prices,
        defiBuy: { ...market.prices.defiBuy, USDC: { value: null } },
      },
      marketCap: { ...market.marketCap, USDC: { value: null } },
    };
    const markup = renderToStaticMarkup(<FameMarketBoard market={partial} />);

    assert.equal((markup.match(/aria-label="Loading"/g) ?? []).length, 2);
    assert.match(markup, /0.42 ETH/);
    assert.match(markup, /240 USDC/);
    assert.match(markup, /25M FAME/);
  });

  it("has no browser fetch, merge, timer, or retry polling path", () => {
    const source = readFileSync(
      "src/features/fame-landing/components/FameMarketBoard.tsx",
      "utf8",
    );

    assert.doesNotMatch(source, /useEffect|useState/);
    assert.doesNotMatch(source, /fetch\s*\(|setTimeout|startMarketRefresh/);
    assert.doesNotMatch(source, /mergeLandingMarket|api\/fame\/market-prices/);
  });
});
