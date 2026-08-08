import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { LandingMarketPresentation } from "../pricePresentation";
import {
  FameMarketBoard,
  mergeLandingMarket,
  startMarketRefresh,
} from "./FameMarketBoard";

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

  it("keeps loaded values while retries fill every remaining gap", () => {
    assert.equal(mergeLandingMarket(market, market), market);
    const current: LandingMarketPresentation = {
      ...market,
      prices: {
        ...market.prices,
        defiBuy: {
          ...market.prices.defiBuy,
          USDC: { value: null },
        },
      },
      marketCap: { ...market.marketCap, ETH: { value: null } },
      marketplaceSupply: null,
    };
    const merged = mergeLandingMarket(current, market);
    assert.notEqual(merged, current);
    assert.equal(merged.prices.defiBuy.USDC.value, "12.34 USDC");
    assert.equal(merged.marketCap.ETH.value, "4.4 ETH");
    assert.equal(merged.marketplaceSupply, "888M FAME");
  });

  it("polls with bounded backoff until every market value is available", async () => {
    const jobs: Array<{ run: () => Promise<void>; delayMs: number }> = [];
    const canceled: unknown[] = [];
    const signals: AbortSignal[] = [];
    let requests = 0;
    const loaded: LandingMarketPresentation[] = [];

    const stop = startMarketRefresh({
      request: async (signal) => {
        signals.push(signal);
        requests += 1;
        if (requests === 1) throw new Error("timeout");
        return requests < 5
          ? {
              ...market,
              marketCap: { ...market.marketCap, ETH: { value: null } },
            }
          : market;
      },
      onMarket: (next) => {
        loaded.push(next);
        return next === market;
      },
      schedule: (run, delayMs) => {
        jobs.push({ run, delayMs });
        return jobs.length as unknown as ReturnType<typeof setTimeout>;
      },
      cancel: (timer) => canceled.push(timer),
    });

    assert.equal(jobs[0]?.delayMs, 5_000);
    await jobs[0]!.run();
    assert.equal(jobs[1]?.delayMs, 10_000);
    await jobs[1]!.run();
    assert.equal(jobs[2]?.delayMs, 20_000);
    await jobs[2]!.run();
    assert.equal(jobs[3]?.delayMs, 30_000);
    await jobs[3]!.run();
    assert.equal(jobs[4]?.delayMs, 30_000);
    await jobs[4]!.run();
    assert.equal(loaded.length, 4);
    assert.equal(loaded.at(-1), market);
    assert.equal(jobs.length, 5);

    stop();
    assert.equal(signals[0]?.aborted, true);
    assert.equal(canceled.length, 1);
  });
});
