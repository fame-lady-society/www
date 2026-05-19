import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Address } from "viem";
import { FAME_SWAP_ARTIFACT_MANIFEST } from "../../artifacts/manifest";
import { FAME, WETH } from "../../tokens";
import { famePoolEdgesForPair } from "../poolUniverse";
import type {
  FameEdgeQuoteRequest,
  FameEdgeQuoteResult,
  FameQuoteAdapter,
} from "./adapters";
import type { FameIndexedPoolStateBatchResponse } from "./indexedPoolStateClient";
import { createIndexedReserveQuoteAdapter } from "./indexedReserveAdapter";
import {
  createSnapshotQuoteAdapter,
  type FamePoolStateSnapshotFile,
} from "./snapshotAdapter";

type IndexedReserveEntry = Extract<
  FameIndexedPoolStateBatchResponse["pools"][number],
  { quoteModel: "constant-product-reserves" }
>;

function indexedState(
  overrides: Partial<IndexedReserveEntry> = {},
): FameIndexedPoolStateBatchResponse {
  const pool: IndexedReserveEntry = {
    status: "fresh",
    poolId: "uniswap-v2-fame-direct",
    chainId: 8453,
    poolAddress:
      "0x3e2cab55bebf41719148b4e6b63f6644b18ae49c" as const satisfies Address,
    token0: WETH,
    token1: FAME,
    reserve0: "1000000000000000000",
    reserve1: "100000000000000000000000",
    k: "100000000000000000000000000000000000000000",
    observedThroughBlock: 124,
    lastReserveChangeBlock: 123,
    source: "sync-event",
    quoteModel: "constant-product-reserves",
    maxFreshnessBlocks: 120,
    ...overrides,
  };
  return {
    sourceRegistryId: "unit-registry",
    currentBlock: 125,
    producerMaxFreshnessBlocks: 120,
    effectiveMaxFreshnessBlocks: 120,
    pools: [pool],
  };
}

function snapshot(): FamePoolStateSnapshotFile {
  return {
    schemaVersion: FAME_SWAP_ARTIFACT_MANIFEST.schemaVersion,
    status: "generated-live-liquidity-snapshot",
    snapshotId: "unit-indexed-parity",
    pinnedBaseBlock: FAME_SWAP_ARTIFACT_MANIFEST.pinnedBaseBlock,
    capturedBaseBlock: FAME_SWAP_ARTIFACT_MANIFEST.pinnedBaseBlock,
    generatedAt: "2026-05-17T00:00:00.000Z",
    source: "unit test",
    reserveStates: [
      {
        poolId: "uniswap-v2-fame-direct",
        pool: "0x3e2cab55bebf41719148b4e6b63f6644b18ae49c",
        token0: WETH,
        token1: FAME,
        reserve0: "1000000000000000000",
        reserve1: "100000000000000000000000",
        source: "getReserves",
      },
    ],
    quoteTable: [],
    unsupportedQuotePools: [],
  };
}

function fallbackAdapter(counter: { calls: number }): FameQuoteAdapter {
  return {
    quoteEdge(request: FameEdgeQuoteRequest): FameEdgeQuoteResult {
      counter.calls += 1;
      return {
        status: "quoted",
        amountIn: request.amountIn,
        amountOut: 42n,
        capacityIn: null,
        fee: request.edge.fee,
        evidence: "fallback live quote",
      };
    },
  };
}

function wethFameDirectEdge() {
  const edge = famePoolEdgesForPair(WETH, FAME).find(
    (candidate) => candidate.poolId === "uniswap-v2-fame-direct",
  );
  assert.ok(edge);
  return edge;
}

describe("FAME indexed reserve adapter", () => {
  it("replays fresh indexed V2 reserves with snapshot math parity", async () => {
    const edge = wethFameDirectEdge();
    const amountIn = 100_000_000_000_000n;
    const fallback = { calls: 0 };
    const indexed = createIndexedReserveQuoteAdapter({
      indexedState: indexedState(),
      fallback: fallbackAdapter(fallback),
    });
    const snapshotQuote = createSnapshotQuoteAdapter(snapshot()).quoteEdge({
      edge,
      amountIn,
    });
    const indexedQuote = await indexed.quoteEdge({ edge, amountIn });

    assert.equal(fallback.calls, 0);
    assert.equal(indexedQuote.status, "quoted");
    assert.equal(snapshotQuote.status, "quoted");
    if (indexedQuote.status === "quoted" && snapshotQuote.status === "quoted") {
      assert.equal(indexedQuote.amountOut, snapshotQuote.amountOut);
      assert.equal(
        indexedQuote.priceImpact?.method,
        "constant-product-reserves",
      );
      assert.equal(indexedQuote.context?.source, "indexed");
      assert.equal(indexed.quoteContext, undefined);
    }
  });

  it("delegates stale indexed pools to the fallback adapter", async () => {
    const edge = wethFameDirectEdge();
    const fallback = { calls: 0 };
    const indexed = createIndexedReserveQuoteAdapter({
      indexedState: indexedState({ status: "stale" }),
      fallback: fallbackAdapter(fallback),
    });

    const quote = await indexed.quoteEdge({ edge, amountIn: 1n });

    assert.equal(fallback.calls, 1);
    assert.equal(quote.status, "quoted");
    if (quote.status === "quoted") assert.equal(quote.amountOut, 42n);
  });

  it("delegates malformed indexed token order to the fallback adapter", async () => {
    const edge = wethFameDirectEdge();
    const fallback = { calls: 0 };
    const indexed = createIndexedReserveQuoteAdapter({
      indexedState: indexedState({
        token0: "0x0000000000000000000000000000000000000001",
        token1: "0x0000000000000000000000000000000000000002",
      }),
      fallback: fallbackAdapter(fallback),
    });

    const quote = await indexed.quoteEdge({ edge, amountIn: 1n });

    assert.equal(fallback.calls, 1);
    assert.equal(quote.status, "quoted");
  });

  it("delegates indexed reserves with malformed amounts to the fallback adapter", async () => {
    const edge = wethFameDirectEdge();
    const fallback = { calls: 0 };
    const indexed = createIndexedReserveQuoteAdapter({
      indexedState: indexedState({ reserve0: "not-a-number" }),
      fallback: fallbackAdapter(fallback),
    });

    const quote = await indexed.quoteEdge({ edge, amountIn: 1n });

    assert.equal(fallback.calls, 1);
    assert.equal(quote.status, "quoted");
  });

  it("delegates indexed reserves when only the input token matches", async () => {
    const edge = wethFameDirectEdge();
    const fallback = { calls: 0 };
    const indexed = createIndexedReserveQuoteAdapter({
      indexedState: indexedState({
        token0: WETH,
        token1: "0x0000000000000000000000000000000000000002",
      }),
      fallback: fallbackAdapter(fallback),
    });

    const quote = await indexed.quoteEdge({ edge, amountIn: 1n });

    assert.equal(fallback.calls, 1);
    assert.equal(quote.status, "quoted");
  });

  it("delegates when the helper source registry id does not match the local registry", async () => {
    const edge = wethFameDirectEdge();
    const fallback = { calls: 0 };
    const indexed = createIndexedReserveQuoteAdapter({
      indexedState: indexedState(),
      fallback: fallbackAdapter(fallback),
      expectedSourceRegistryId: "different-registry",
    });

    const quote = await indexed.quoteEdge({ edge, amountIn: 1n });

    assert.equal(fallback.calls, 1);
    assert.equal(quote.status, "quoted");
    if (quote.status === "quoted") assert.equal(quote.amountOut, 42n);
  });

  it("delegates when returned pool address does not match the selected edge", async () => {
    const edge = wethFameDirectEdge();
    const fallback = { calls: 0 };
    const indexed = createIndexedReserveQuoteAdapter({
      indexedState: indexedState({
        poolAddress: "0x0000000000000000000000000000000000000001",
      }),
      fallback: fallbackAdapter(fallback),
    });

    const quote = await indexed.quoteEdge({ edge, amountIn: 1n });

    assert.equal(fallback.calls, 1);
    assert.equal(quote.status, "quoted");
    if (quote.status === "quoted") assert.equal(quote.amountOut, 42n);
  });
});
