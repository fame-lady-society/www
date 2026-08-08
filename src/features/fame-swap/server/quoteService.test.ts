import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { base } from "viem/chains";
import { getFameSwapConfig } from "../config";
import type { FamePoolEdge } from "../solver/poolUniverse";
import type { FameAsyncQuoteAdapter } from "../solver/quotes/adapters";
import { quoteFameSwap } from "../solver/quote";
import { FAME, NATIVE_ETH, USDC, tokenForAddress } from "../tokens";
import {
  createProductionFameQuoteDependencies,
  quoteFameExactInput,
  quoteFameExactTarget,
} from "./quoteService";

const context = {
  source: "fork",
  chainId: base.id,
  blockNumber: 49_000_000n,
  forkUrlLabel: "test",
} as const;

function token(address: typeof FAME | typeof NATIVE_ETH | typeof USDC) {
  const value = tokenForAddress(address);
  assert.ok(value);
  return value;
}

function multiplier(edge: FamePoolEdge) {
  if (edge.poolId === "native-wrap-weth") return 1n;
  if (edge.poolId === "aerodrome-v2-usdc-weth") return 1_000_000_000_000n;
  return 1_000_000n;
}

function adapter(): FameAsyncQuoteAdapter {
  return {
    quoteContext: context,
    async quoteEdge({ edge, amountIn }) {
      return {
        status: "quoted",
        amountIn,
        amountOut: amountIn * multiplier(edge),
        capacityIn: null,
        fee: edge.fee,
        evidence: "pinned test quote",
        context,
      };
    },
  };
}

const ready = {
  status: "ready" as const,
  routerAddress: "0x0000000000000000000000000000000000000009" as const,
  feePpm: 0n,
};

describe("server FAME quote service", () => {
  it("keeps the production dependency seam server-side and reusable", async () => {
    const dependencies = createProductionFameQuoteDependencies({
      readinessForQuote: () => ready,
      createAdapter: () => adapter(),
    });
    assert.equal(await dependencies.readinessForQuote(null), ready);
    assert.equal(
      (await dependencies.createAdapter!({
        tokenIn: token(USDC),
        tokenOut: token(FAME),
        amountIn: 1n,
        recipient: null,
        config: getFameSwapConfig(),
        readiness: ready,
      })).quoteContext?.source,
      "fork",
    );
  });

  it("preserves the existing exact-input domain result", async () => {
    const result = await quoteFameExactInput(
      {
        tokenIn: token(USDC),
        tokenOut: token(FAME),
        amountIn: 1_000_000n,
        recipient: null,
        config: getFameSwapConfig(),
      },
      {
        readinessForQuote: () => ready,
        quoteForRequest: (request) =>
          quoteFameSwap({ ...request, adapter: undefined }),
      },
    );
    assert.equal(result.tokenIn.address, USDC);
    assert.equal(result.tokenOut.address, FAME);
    assert.equal(result.requestedAmountIn, 1_000_000n);
  });

  it("returns an ETH-identified bounded target quote for a nullable recipient", async () => {
    const result = await quoteFameExactTarget(
      {
        tokenIn: token(NATIVE_ETH),
        tokenOut: token(FAME),
        targetOutput: 1_000_000n,
        recipient: null,
        range: { minimumInput: 1n, maximumInput: 100n, precision: 1n },
        signal: new AbortController().signal,
        timeoutMs: 10_000,
      },
      {
        readinessForQuote: () => ready,
        createAdapter: () => adapter(),
        config: getFameSwapConfig(),
        now: () => 1_700_000_000_000,
      },
    );
    assert.equal(result.status, "ready");
    if (result.status === "ready") {
      assert.equal(
        result.quote.route.recipient,
        "0x0000000000000000000000000000000000000001",
      );
      assert.equal(result.quote.route.amountIn, result.amountIn);
      assert.ok(result.protectedOutput >= 1_000_000n);
    }
  });
});
