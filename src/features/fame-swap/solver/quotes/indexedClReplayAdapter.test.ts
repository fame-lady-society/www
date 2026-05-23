import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { USDC, WETH } from "../../tokens";
import { famePoolEdgesForPair } from "../poolUniverse";
import type {
  FameEdgeQuoteRequest,
  FameEdgeQuoteResult,
  FameQuoteAdapter,
} from "./adapters";
import type { FameIndexedPoolStateBatchResponse } from "./indexedPoolStateClient";
import {
  createIndexedClReplayQuoteAdapter,
  quoteFromIndexedSlipstreamReplay,
  replaySlipstreamExactInput,
} from "./indexedClReplayAdapter";

type IndexedClReplayEntry = Extract<
  FameIndexedPoolStateBatchResponse["pools"][number],
  { stateKind: "cl-replay-v1"; status: "fresh" }
>;
type IndexedClReplayState = FameIndexedPoolStateBatchResponse["pools"][number];

const Q96 = 79_228_162_514_264_337_593_543_950_336n;

function slipstreamEdge() {
  const edge = famePoolEdgesForPair(WETH, USDC).find(
    (candidate) => candidate.poolId === "slipstream-usdc-weth-100",
  );
  assert.ok(edge);
  return edge;
}

function replayEntry(
  overrides: Partial<IndexedClReplayEntry> = {},
): IndexedClReplayEntry {
  return {
    status: "fresh",
    stateKind: "cl-replay-v1",
    poolId: "slipstream-usdc-weth-100",
    chainId: 8453,
    poolAddress: "0xb2cc224c1c9fee385f8ad6a55b4d94e92359dc59",
    token0: WETH,
    token1: USDC,
    venueFamily: "Slipstream",
    tickSpacing: 100,
    sqrtPriceX96: Q96.toString(),
    tick: 0,
    liquidity: "1000000000000000000",
    fee: "100",
    feeSource: "pool-fee",
    observedThroughBlock: 120,
    blockHash:
      "0x1111111111111111111111111111111111111111111111111111111111111111",
    parentHash:
      "0x2222222222222222222222222222222222222222222222222222222222222222",
    snapshotId: "unit-cl-replay",
    stateHash:
      "0x3333333333333333333333333333333333333333333333333333333333333333",
    source: "slipstream-pool-state",
    sourceRegistryId: "unit-registry",
    maxFreshnessBlocks: 120,
    bitmapWordCount: 2,
    initializedTickCount: 2,
    bitmapChunkCount: 1,
    tickChunkCount: 1,
    minWordPosition: -1,
    maxWordPosition: 0,
    minTick: -100,
    maxTick: 100,
    bitmapWords: [
      {
        wordPosition: -1,
        bitmap:
          "0x8000000000000000000000000000000000000000000000000000000000000000",
      },
      {
        wordPosition: 0,
        bitmap:
          "0x0000000000000000000000000000000000000000000000000000000000000002",
      },
    ],
    initializedTicks: [
      { tick: -100, liquidityGross: "1000", liquidityNet: "-1000" },
      { tick: 100, liquidityGross: "1000", liquidityNet: "1000" },
    ],
    ...overrides,
  };
}

function indexedState(
  pool: IndexedClReplayState = replayEntry(),
): FameIndexedPoolStateBatchResponse {
  return {
    sourceRegistryId: "unit-registry",
    currentBlock: 125,
    producerMaxFreshnessBlocks: 120,
    effectiveMaxFreshnessBlocks: 120,
    pools: [pool],
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

describe("FAME indexed CL replay adapter", () => {
  it("locally replays exact-input Slipstream quotes from indexed state", async () => {
    const edge = slipstreamEdge();
    const fallback = { calls: 0 };
    const adapter = createIndexedClReplayQuoteAdapter({
      indexedState: indexedState(),
      fallback: fallbackAdapter(fallback),
      mode: "local",
    });

    const quote = await adapter.quoteEdge({ edge, amountIn: 1_000_000n });

    assert.equal(fallback.calls, 0);
    assert.equal(quote.status, "quoted");
    if (quote.status === "quoted") {
      assert.ok(quote.amountOut > 0n);
      assert.ok(quote.amountOut < quote.amountIn);
      assert.match(quote.evidence, /indexed Slipstream CL replay/);
      assert.equal(quote.context?.source, "indexed");
      assert.equal(quote.priceImpact?.method, "quoter-price-after");
    }
  });

  it("keeps shadow mode on the fallback quote while exercising local replay", async () => {
    const edge = slipstreamEdge();
    const fallback = { calls: 0 };
    const adapter = createIndexedClReplayQuoteAdapter({
      indexedState: indexedState(),
      fallback: fallbackAdapter(fallback),
    });

    const quote = await adapter.quoteEdge({ edge, amountIn: 1_000_000n });

    assert.equal(fallback.calls, 1);
    assert.equal(quote.status, "quoted");
    if (quote.status === "quoted") {
      assert.equal(quote.amountOut, 42n);
      assert.equal(quote.evidence, "fallback live quote");
    }
  });

  it("falls back when replay state is stale or malformed", async () => {
    const edge = slipstreamEdge();
    const fallback = { calls: 0 };
    const adapter = createIndexedClReplayQuoteAdapter({
      indexedState: indexedState({
        ...replayEntry(),
        status: "stale",
      }),
      fallback: fallbackAdapter(fallback),
      mode: "local",
    });

    const quote = await adapter.quoteEdge({ edge, amountIn: 1_000_000n });

    assert.equal(fallback.calls, 1);
    assert.equal(quote.status, "quoted");
  });

  it("keeps shadow mode on live fallback when replay math throws", async () => {
    const edge = slipstreamEdge();
    const fallback = { calls: 0 };
    const adapter = createIndexedClReplayQuoteAdapter({
      indexedState: indexedState(
        replayEntry({
          initializedTicks: [
            {
              tick: 1_000_000,
              liquidityGross: "1000",
              liquidityNet: "1000",
            },
          ],
        }),
      ),
      fallback: fallbackAdapter(fallback),
    });

    const quote = await adapter.quoteEdge({ edge, amountIn: 1_000_000n });

    assert.equal(fallback.calls, 1);
    assert.equal(quote.status, "quoted");
    if (quote.status === "quoted") {
      assert.equal(quote.evidence, "fallback live quote");
    }
  });

  it("rejects CL replay rows from a mismatched source registry", async () => {
    const edge = slipstreamEdge();
    const fallback = { calls: 0 };
    const adapter = createIndexedClReplayQuoteAdapter({
      indexedState: indexedState(
        replayEntry({
          sourceRegistryId: "other-registry",
        }),
      ),
      fallback: fallbackAdapter(fallback),
      expectedSourceRegistryId: "unit-registry",
      mode: "local",
    });

    const quote = await adapter.quoteEdge({ edge, amountIn: 1_000_000n });

    assert.equal(fallback.calls, 1);
    assert.equal(quote.status, "quoted");
  });

  it("reports outside-range replay attempts as no quote evidence", () => {
    const replay = replaySlipstreamExactInput({
      state: replayEntry({ liquidity: "0" }),
      zeroForOne: true,
      amountIn: 1_000_000n,
    });

    assert.equal(replay, "outside-indexed-tick-range");
  });

  it("crosses initialized ticks at the current zero-for-one boundary", () => {
    const boundary = replayEntry({
      tick: 0,
      sqrtPriceX96: Q96.toString(),
      liquidity: "1000000000000000000",
      bitmapWords: [
        {
          wordPosition: -1,
          bitmap:
            "0x8000000000000000000000000000000000000000000000000000000000000000",
        },
        {
          wordPosition: 0,
          bitmap:
            "0x0000000000000000000000000000000000000000000000000000000000000001",
        },
      ],
      initializedTicks: [
        { tick: -100, liquidityGross: "1000", liquidityNet: "1000" },
        { tick: 0, liquidityGross: "500", liquidityNet: "-500" },
      ],
    });
    const preCrossed = replayEntry({
      tick: -1,
      sqrtPriceX96: Q96.toString(),
      liquidity: "1000000000000000500",
      bitmapWords: boundary.bitmapWords,
      initializedTicks: boundary.initializedTicks,
    });

    const boundaryReplay = replaySlipstreamExactInput({
      state: boundary,
      zeroForOne: true,
      amountIn: 1_000_000n,
    });
    const preCrossedReplay = replaySlipstreamExactInput({
      state: preCrossed,
      zeroForOne: true,
      amountIn: 1_000_000n,
    });

    assert.notEqual(boundaryReplay, "replay-failed");
    assert.deepEqual(boundaryReplay, preCrossedReplay);
  });

  it("returns an explicit failure for token-direction mismatches", () => {
    const edge = slipstreamEdge();
    const quote = quoteFromIndexedSlipstreamReplay({
      indexedState: replayEntry({
        token0: "0x0000000000000000000000000000000000000001",
      }),
      request: { edge, amountIn: 1_000_000n },
      context: {
        source: "indexed",
        chainId: 8453,
        currentBlock: 125,
        sourceRegistryId: "unit-registry",
        effectiveMaxFreshnessBlocks: 120,
        statusCounts: { fresh: 1, stale: 0, unknown: 0, unsupported: 0 },
      },
    });

    assert.equal(quote.status, "failed");
    if (quote.status === "failed") {
      assert.match(quote.message, /token-direction-mismatch/);
    }
  });
});
