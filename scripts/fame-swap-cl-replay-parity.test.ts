import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Address } from "viem";
import { FAME, USDC, WETH } from "../src/features/fame-swap/tokens";
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
  poolStateEndpointUrlFromEnv,
  runClReplayParity,
} from "./fame-swap-cl-replay-parity";

type IndexedClReplayEntry = Extract<
  FameIndexedPoolStateBatchResponse["pools"][number],
  { stateKind: "cl-replay-v1"; status: "fresh" }
>;

const Q96 = 79_228_162_514_264_337_593_543_950_336n;
const BASEDFLICK = "0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926" as const;

function slipstreamEdge(
  poolId = "slipstream-usdc-weth-100",
  tokenIn: Address = WETH,
  tokenOut: Address = USDC,
) {
  const edge = famePoolEdgesForPair(tokenIn, tokenOut).find(
    (candidate) => candidate.poolId === poolId,
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

function selectedReplayEntry(): IndexedClReplayEntry {
  return {
    ...replayEntry(),
    poolId: "slipstream-basedflick-fame",
    poolAddress: "0xbd7e5bb5a6251f6dde2cf56afa50ed0c8b4c2cdb",
    token0: BASEDFLICK,
    token1: FAME,
    tickSpacing: 2000,
    sqrtPriceX96: "14225627699858779769529171968",
    tick: -34350,
    liquidity: "1000000000000000000000000000000",
    fee: "10000",
    snapshotId: "unit-selected-candidate",
    minWordPosition: -10,
    maxWordPosition: 0,
    minTick: -40000,
    maxTick: 0,
    bitmapWords: [
      {
        wordPosition: -10,
        bitmap:
          "0x0000000000000000000000000000000000000000000000000000000000000010",
      },
      {
        wordPosition: 0,
        bitmap:
          "0x0000000000000000000000000000000000000000000000000000000000000001",
      },
    ],
    initializedTicks: [
      { tick: -40000, liquidityGross: "1000", liquidityNet: "-1000" },
      { tick: 0, liquidityGross: "1000", liquidityNet: "1000" },
    ],
  };
}

function indexedState(
  pools: FameIndexedPoolStateBatchResponse["pools"] = [replayEntry()],
): FameIndexedPoolStateBatchResponse {
  return {
    sourceRegistryId: "unit-registry",
    currentBlock: 125,
    producerMaxFreshnessBlocks: 120,
    effectiveMaxFreshnessBlocks: 120,
    pools,
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
  it("derives the raw pool-state proof endpoint from FAME_POOL_API_URL", () => {
    const previousBase = process.env.FAME_POOL_API_URL;
    const previousEndpoint = process.env.FAME_POOL_STATE_API_URL;
    process.env.FAME_POOL_API_URL = "https://api.fame.support/base";
    delete process.env.FAME_POOL_STATE_API_URL;

    try {
      assert.equal(
        poolStateEndpointUrlFromEnv(),
        "https://api.fame.support/base/fame/pool-state",
      );
    } finally {
      if (previousBase === undefined) delete process.env.FAME_POOL_API_URL;
      else process.env.FAME_POOL_API_URL = previousBase;
      if (previousEndpoint === undefined)
        delete process.env.FAME_POOL_STATE_API_URL;
      else process.env.FAME_POOL_STATE_API_URL = previousEndpoint;
    }
  });

  it("rejects legacy pool-state endpoint env before proof auth is used", () => {
    const previousBase = process.env.FAME_POOL_API_URL;
    const previousEndpoint = process.env.FAME_POOL_STATE_API_URL;
    process.env.FAME_POOL_API_URL = "https://api.fame.support/base";
    process.env.FAME_POOL_STATE_API_URL =
      "https://api.fame.support/base/fame/pool-state";

    try {
      assert.throws(() => poolStateEndpointUrlFromEnv(), /no longer supported/);
    } finally {
      if (previousBase === undefined) delete process.env.FAME_POOL_API_URL;
      else process.env.FAME_POOL_API_URL = previousBase;
      if (previousEndpoint === undefined)
        delete process.env.FAME_POOL_STATE_API_URL;
      else process.env.FAME_POOL_STATE_API_URL = previousEndpoint;
    }
  });

  it("rejects unsafe pool API bases before deriving proof endpoints", () => {
    const previousBase = process.env.FAME_POOL_API_URL;
    const previousEndpoint = process.env.FAME_POOL_STATE_API_URL;
    process.env.FAME_POOL_API_URL =
      "https://unit:secret@api.fame.support/base/fame/pool-quotes?debug=1";
    delete process.env.FAME_POOL_STATE_API_URL;

    try {
      assert.throws(
        () => poolStateEndpointUrlFromEnv(),
        /credentials, query, or hash/,
      );
    } finally {
      if (previousBase === undefined) delete process.env.FAME_POOL_API_URL;
      else process.env.FAME_POOL_API_URL = previousBase;
      if (previousEndpoint === undefined)
        delete process.env.FAME_POOL_STATE_API_URL;
      else process.env.FAME_POOL_STATE_API_URL = previousEndpoint;
    }
  });

  it("reports exact local/live parity for fixture-backed quotes", async () => {
    const state = indexedState();
    const report = await runClReplayParity({
      indexedState: state,
      liveAdapter: liveAdapter(state, 0n),
      currentBlock: 125,
      cases: [
        {
          label: "WETH->USDC",
          request: {
            edge: slipstreamEdge("slipstream-usdc-weth-100", WETH, USDC),
            amountIn: 1_000_000n,
          },
        },
        {
          label: "USDC->WETH",
          request: {
            edge: slipstreamEdge("slipstream-usdc-weth-100", USDC, WETH),
            amountIn: 1_000_000n,
          },
        },
      ],
    });

    assert.equal(report.poolId, "slipstream-usdc-weth-100");
    assert.equal(report.snapshotId, "unit-cl-replay");
    assert.equal(report.results.length, 2);
    assert.ok(report.results.every((result) => result.driftBps === 0n));
  });

  it("reports selected-pool parity cases in both directions", async () => {
    const state = indexedState([selectedReplayEntry()]);
    const report = await runClReplayParity({
      indexedState: state,
      liveAdapter: liveAdapter(state, 0n),
      currentBlock: 125,
      poolId: "slipstream-basedflick-fame",
      cases: [
        {
          label: "FAME->basedflick",
          request: {
            edge: slipstreamEdge(
              "slipstream-basedflick-fame",
              FAME,
              BASEDFLICK,
            ),
            amountIn: 1_000_000n,
          },
        },
        {
          label: "basedflick->FAME",
          request: {
            edge: slipstreamEdge(
              "slipstream-basedflick-fame",
              BASEDFLICK,
              FAME,
            ),
            amountIn: 1_000_000n,
          },
        },
      ],
    });

    assert.equal(report.poolId, "slipstream-basedflick-fame");
    assert.equal(report.snapshotId, "unit-selected-candidate");
    assert.deepEqual(
      report.results.map((result) => result.label),
      ["FAME->basedflick", "basedflick->FAME"],
    );
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
              request: {
                edge: slipstreamEdge("slipstream-usdc-weth-100", WETH, USDC),
                amountIn: 1_000_000n,
              },
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
