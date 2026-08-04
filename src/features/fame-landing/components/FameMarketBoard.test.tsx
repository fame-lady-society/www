import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  FameMarketBoard,
  mergeLandingPrices,
  startPriceRefresh,
} from "./FameMarketBoard";

describe("FAME market board", () => {
  it("shows the three unique prices without repeating NFT sell", () => {
    const markup = renderToStaticMarkup(
      <FameMarketBoard
        initialPrices={{
          defiBuy: {
            fame: "1,000,000 FAME",
            USDC: { value: "12.34 USDC" },
            ETH: { value: "0.005 ETH" },
          },
          defiSell: {
            fame: "1,000,000 FAME",
            USDC: { value: "11.90 USDC" },
            ETH: { value: "0.0048 ETH" },
          },
          nftBuy: {
            fame: "1,050,000 FAME",
            USDC: { value: "12.95 USDC" },
            ETH: { value: "0.0052 ETH" },
          },
        }}
      />,
    );

    assert.match(markup, /DeFi buy/);
    assert.match(markup, /DeFi sell/);
    assert.match(markup, /NFT buy/);
    assert.doesNotMatch(markup, /NFT sell/);
    assert.equal((markup.match(/1,000,000 FAME/g) ?? []).length, 2);
    assert.equal((markup.match(/1,050,000 FAME/g) ?? []).length, 1);
    assert.doesNotMatch(markup, /cache|route|validation|slippage|unavailable/i);
  });

  it("shows an activity indicator for each missing price", () => {
    const markup = renderToStaticMarkup(
      <FameMarketBoard
        initialPrices={{
          defiBuy: {
            fame: "1,000,000 FAME",
            USDC: { value: null },
            ETH: { value: null },
          },
          defiSell: {
            fame: "1,000,000 FAME",
            USDC: { value: null },
            ETH: { value: null },
          },
          nftBuy: {
            fame: null,
            USDC: { value: null },
            ETH: { value: null },
          },
        }}
      />,
    );

    assert.equal((markup.match(/aria-label="Loading"/g) ?? []).length, 7);
    assert.doesNotMatch(markup, /Unavailable|error|failed/i);
  });

  it("does not rerender when a retry adds no price", () => {
    const current = {
      defiBuy: {
        fame: "1,000,000 FAME",
        USDC: { value: "12 USDC" },
        ETH: { value: null },
      },
      defiSell: {
        fame: "1,000,000 FAME",
        USDC: { value: "11 USDC" },
        ETH: { value: "0.004 ETH" },
      },
      nftBuy: {
        fame: "1,050,000 FAME",
        USDC: { value: "13 USDC" },
        ETH: { value: "0.005 ETH" },
      },
    } as const;

    assert.equal(mergeLandingPrices(current, current), current);
    const merged = mergeLandingPrices(current, {
      ...current,
      defiBuy: { ...current.defiBuy, ETH: { value: "0.0045 ETH" } },
    });
    assert.notEqual(merged, current);
    assert.equal(merged.defiBuy.ETH.value, "0.0045 ETH");
  });

  it("retries missing prices and stops cleanly", async () => {
    const current = {
      defiBuy: {
        fame: "1,000,000 FAME",
        USDC: { value: null },
        ETH: { value: null },
      },
      defiSell: {
        fame: "1,000,000 FAME",
        USDC: { value: null },
        ETH: { value: null },
      },
      nftBuy: { fame: null, USDC: { value: null }, ETH: { value: null } },
    } as const;
    const next = {
      ...current,
      defiBuy: { ...current.defiBuy, USDC: { value: "12 USDC" } },
    };
    const jobs: Array<{ run: () => Promise<void>; delayMs: number }> = [];
    const canceled: unknown[] = [];
    const signals: AbortSignal[] = [];
    let requests = 0;
    let prices = current;

    const stop = startPriceRefresh({
      request: async (signal) => {
        signals.push(signal);
        requests += 1;
        return requests === 1 ? null : next;
      },
      onPrices: (loaded) => {
        prices = mergeLandingPrices(prices, loaded) as typeof current;
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
    assert.equal(prices.defiBuy.USDC.value, "12 USDC");

    stop();
    assert.equal(signals[0]?.aborted, true);
    assert.equal(canceled.length, 1);
    await jobs[2]!.run();
    assert.equal(requests, 2);
  });
});
