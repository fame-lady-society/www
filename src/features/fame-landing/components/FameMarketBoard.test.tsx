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
      ETH: { value: "0.0048 ETH" },
    },
    nftBuy: {
      fame: "1.1M FAME",
      USDC: { value: "12.95 USDC" },
      ETH: { value: "0.0052 ETH" },
    },
  },
  marketCap: {
    USDC: { value: "10.8K USDC" },
    ETH: { value: "4.3512 ETH" },
  },
};

describe("FAME market board", () => {
  it("shows dual-currency market cap above DeFi prices", () => {
    const markup = renderToStaticMarkup(
      <FameMarketBoard initialMarket={market} />,
    );

    assert.match(markup, /DeFi buy/);
    assert.match(markup, /DeFi sell/);
    assert.match(markup, /Marketplace/);
    assert.doesNotMatch(markup, /NFT sell/);
    assert.match(markup, /Market cap/);
    assert.match(markup, /10.8K USDC/);
    assert.match(markup, /4.3512 ETH/);
    assert.ok(markup.indexOf("Market cap") < markup.indexOf("DeFi buy"));
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
    };
    const markup = renderToStaticMarkup(
      <FameMarketBoard initialMarket={empty} />,
    );

    assert.equal((markup.match(/aria-label="Loading"/g) ?? []).length, 9);
    assert.doesNotMatch(markup, /Unavailable|error|failed/i);
  });

  it("keeps loaded values while retries fill gaps", () => {
    assert.equal(mergeLandingMarket(market, market), market);
    const current: LandingMarketPresentation = {
      ...market,
      marketCap: { ...market.marketCap, ETH: { value: null } },
    };
    const merged = mergeLandingMarket(current, market);
    assert.notEqual(merged, current);
    assert.equal(merged.marketCap.ETH.value, "4.3512 ETH");
  });

  it("retries missing market data and stops cleanly", async () => {
    const jobs: Array<{ run: () => Promise<void>; delayMs: number }> = [];
    const canceled: unknown[] = [];
    const signals: AbortSignal[] = [];
    let requests = 0;
    let loaded: LandingMarketPresentation | null = null;

    const stop = startMarketRefresh({
      request: async (signal) => {
        signals.push(signal);
        requests += 1;
        return requests === 1 ? null : market;
      },
      onMarket: (next) => {
        loaded = next;
      },
      schedule: (run, delayMs) => {
        jobs.push({ run, delayMs });
        return jobs.length as unknown as ReturnType<typeof setTimeout>;
      },
      cancel: (timer) => canceled.push(timer),
    });

    assert.equal(jobs[0]?.delayMs, 500);
    await jobs[0]!.run();
    assert.equal(jobs[1]?.delayMs, 5_000);
    await jobs[1]!.run();
    assert.equal(loaded, market);

    stop();
    assert.equal(signals[0]?.aborted, true);
    assert.equal(canceled.length, 1);
    await jobs[2]!.run();
    assert.equal(requests, 2);
  });
});
