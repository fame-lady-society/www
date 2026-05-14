import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Address } from "viem";
import { FAME, NATIVE_ETH, USDC, WETH, tokenForAddress } from "../tokens";
import { quoteWithReadyReadiness } from "./quote";
import { createDeterministicQuoteAdapter } from "./quotes/deterministicAdapter";
import { FAME_ROUTE_CORPUS } from "./routeCorpus";

const routerAddress = "0x0000000000000000000000000000000000000009";
const recipient = "0x0000000000000000000000000000000000000abc";

function token(address: Address) {
  const result = tokenForAddress(address);
  assert.ok(result);
  return result;
}

function directionKey(tokenIn: string, tokenOut: string): string {
  return `${tokenIn.toLowerCase()}-${tokenOut.toLowerCase()}`;
}

describe("FAME route corpus", () => {
  it("covers every supported FAME-facing direction", () => {
    const directions = new Set(
      FAME_ROUTE_CORPUS.map((entry) => directionKey(entry.tokenIn, entry.tokenOut)),
    );

    for (const [tokenIn, tokenOut] of [
      [FAME, USDC],
      [USDC, FAME],
      [FAME, WETH],
      [WETH, FAME],
      [FAME, NATIVE_ETH],
      [NATIVE_ETH, FAME],
    ] as const) {
      assert.ok(directions.has(directionKey(tokenIn, tokenOut)));
    }
  });

  it("matches expected solver statuses for deterministic amount buckets", () => {
    for (const entry of FAME_ROUTE_CORPUS) {
      const quote = quoteWithReadyReadiness({
        tokenIn: token(entry.tokenIn),
        tokenOut: token(entry.tokenOut),
        amountIn: entry.amountIn,
        recipient,
        routerAddress,
        now: new Date("2026-05-13T00:00:00Z"),
        adapter: createDeterministicQuoteAdapter(),
      });

      assert.equal(
        quote.status,
        entry.expectedDeterministicStatus ?? entry.expectedStatus,
        entry.id,
      );
      if (quote.status !== "ready") {
        assert.equal("route" in quote, false, entry.id);
      }
    }
  });
});
