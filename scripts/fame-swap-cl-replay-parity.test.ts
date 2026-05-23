import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Address } from "viem";
import { USDC, WETH } from "../src/features/fame-swap/tokens";
import { famePoolEdgesForPair } from "../src/features/fame-swap/solver/poolUniverse";
import type {
  FameAsyncQuoteAdapter,
  FameEdgeQuoteRequest,
  FameEdgeQuoteResult,
} from "../src/features/fame-swap/solver/quotes/adapters";
import type { FameIndexedPoolStateBatchResponse } from "../src/features/fame-swap/solver/quotes/indexedPoolStateClient";
import { quoteFromIndexedSlipstreamReplay } from "../src/features/fame-swap/solver/quotes/indexedClReplayAdapter";
import {
  displaySafeErrorMessage,
  runClReplayParity,
} from "./fame-swap-cl-replay-parity";

type IndexedClReplayEntry = Extract<
  FameIndexedPoolStateBatchResponse["pools"][number],
  { stateKind: "cl-replay-v1"; status: "fresh" }
>;

const Q96 = 79_228_162_514_264_337_593_543_950_336n;

function slipstreamEdge(tokenIn: Address = WETH, tokenOut: Address = USDC) {
  const edge = famePoolEdgesForPair(tokenIn, tokenOut).find(
    (candidate) => candidate.poolId === "slipstream-usdc-weth-100",
  );
  assert.ok(edge);
  return edge;
}

function replayEntry(): IndexedClReplayEntry {
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
  };
}

function indexedState(): FameIndexedPoolStateBatchResponse {
  return {
    sourceRegistryId: "unit-registry",
    currentBlock: 125,
    producerMaxFreshnessBlocks: 120,
    effectiveMaxFreshnessBlocks: 120,
    pools: [replayEntry()],
  };
}

function liveAdapter(
  state: FameIndexedPoolStateBatchResponse,
  delta: bigint,
): FameAsyncQuoteAdapter {
  return {
    async quoteEdge(
      request: FameEdgeQuoteRequest,
    ): Promise<FameEdgeQuoteResult> {
      const quote = quoteFromIndexedSlipstreamReplay({
        indexedState: state.pools[0],
        request,
        context: {
          source: "indexed",
          chainId: 8453,
          currentBlock: 125,
          sourceRegistryId: state.sourceRegistryId,
          effectiveMaxFreshnessBlocks: state.effectiveMaxFreshnessBlocks,
          statusCounts: {
            fresh: 1,
            stale: 0,
            unknown: 0,
            unsupported: 0,
          },
        },
        expectedSourceRegistryId: state.sourceRegistryId,
      });
      if (quote.status !== "quoted") return quote;
      return {
        ...quote,
        amountOut: quote.amountOut + delta,
        evidence: "live quoter double",
      };
    },
  };
}

describe("FAME Slipstream CL replay parity harness", () => {
  it("reports exact local/live parity for fixture-backed quotes", async () => {
    const state = indexedState();
    const report = await runClReplayParity({
      indexedState: state,
      liveAdapter: liveAdapter(state, 0n),
      currentBlock: 125,
      cases: [
        {
          label: "WETH->USDC",
          request: { edge: slipstreamEdge(), amountIn: 1_000_000n },
        },
        {
          label: "USDC->WETH",
          request: {
            edge: slipstreamEdge(USDC, WETH),
            amountIn: 1_000_000n,
          },
        },
      ],
    });

    assert.equal(report.snapshotId, "unit-cl-replay");
    assert.equal(report.results.length, 2);
    assert.ok(report.results.every((result) => result.driftBps === 0n));
  });

  it("rejects any amount-out mismatch even when integer bps drift rounds to zero", async () => {
    const state = indexedState();

    await assert.rejects(
      () =>
        runClReplayParity({
          indexedState: state,
          liveAdapter: liveAdapter(state, 1n),
          currentBlock: 125,
          cases: [
            {
              label: "WETH->USDC",
              request: { edge: slipstreamEdge(), amountIn: 1_000_000n },
            },
          ],
        }),
      /failed exact parity/,
    );
  });

  it("rejects CL replay rows from a mismatched source registry", async () => {
    const state = indexedState();
    state.pools = [{ ...replayEntry(), sourceRegistryId: "other-registry" }];

    await assert.rejects(
      () =>
        runClReplayParity({
          indexedState: state,
          liveAdapter: liveAdapter(state, 0n),
          currentBlock: 125,
        }),
      /expected unit-registry/,
    );
  });

  it("redacts secret-bearing diagnostics from parity errors", () => {
    const message = displaySafeErrorMessage(
      new Error(
        [
          "request body calldata should not be printed",
          "RPC failed https://unit.example/base?token=secret bearer abc.def",
          "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        ].join("\n"),
      ),
    );

    assert.doesNotMatch(message, /unit\.example|abc\.def|1234567890abcdef/);
    assert.match(message, /\[redacted-url\]/);
  });
});
