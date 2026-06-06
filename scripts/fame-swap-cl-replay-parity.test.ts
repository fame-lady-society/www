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
  FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE,
  FAME_V4_ZORA_REVIEWED_POOL_SHAPE,
} from "../src/features/fame-swap/solver/poolStateRegistry";
import {
  buildClReplayParityCases,
  displaySafeErrorMessage,
  poolQuoteEndpointUrlFromEnv,
  poolStateEndpointUrlFromEnv,
  runCompactQuoteParity,
  runClReplayParity,
} from "./fame-swap-cl-replay-parity";
import type {
  FamePoolQuoteBatchResponse,
  FameV4ClPoolQuoteQuotedEntry,
} from "../src/features/fame-swap/solver/quotes/indexedQuoteApiClient";

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

function v4ReviewedEdge(
  reviewed:
    | typeof FAME_V4_ZORA_REVIEWED_POOL_SHAPE
    | typeof FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE = FAME_V4_ZORA_REVIEWED_POOL_SHAPE,
  tokenIn: Address = reviewed.currency1,
  tokenOut: Address = reviewed.currency0,
) {
  const edge = famePoolEdgesForPair(tokenIn, tokenOut).find(
    (candidate) => candidate.poolId === reviewed.poolId,
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

function compactQuoteRow(
  amountIn: bigint,
  amountOut: bigint,
  reviewed:
    | typeof FAME_V4_ZORA_REVIEWED_POOL_SHAPE
    | typeof FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE = FAME_V4_ZORA_REVIEWED_POOL_SHAPE,
  tokenIn: Address = reviewed.currency1,
  tokenOut: Address = reviewed.currency0,
): FameV4ClPoolQuoteQuotedEntry {
  const provenanceRequired =
    reviewed.poolId === FAME_V4_ZORA_REVIEWED_POOL_SHAPE.poolId;
  return {
    status: "quoted",
    quoteKind: "cl-quote-v1",
    poolId: reviewed.poolId,
    chainId: 8453,
    poolAddress: null,
    poolKey: reviewed.poolKey,
    poolManager: reviewed.poolManager,
    stateViewAddress: reviewed.stateViewAddress,
    token0: reviewed.currency0,
    token1: reviewed.currency1,
    tokenIn,
    tokenOut,
    venueFamily: "UniswapV4",
    tickSpacing: reviewed.tickSpacing,
    amountIn: amountIn.toString(),
    amountOut: amountOut.toString(),
    sqrtPriceX96: Q96.toString(),
    sqrtPriceX96After: (Q96 - 1n).toString(),
    tick: 0,
    liquidity: "1000000000000000000",
    fee: reviewed.fee.toString(),
    lpFee: reviewed.fee.toString(),
    protocolFee: "0",
    protocolFeeStatus: "zero",
    staticFee: reviewed.fee.toString(),
    feeSource: "v4-slot0",
    observedThroughBlock: 124,
    blockHash:
      "0x4444444444444444444444444444444444444444444444444444444444444444",
    parentHash:
      "0x5555555555555555555555555555555555555555555555555555555555555555",
    snapshotId: "unit-v4-compact-quote",
    stateHash:
      "0x6666666666666666666666666666666666666666666666666666666666666666",
    source: "uniswap-v4-state-view",
    sourceRegistryId: "unit-registry",
    maxFreshnessBlocks: 120,
    hookAddress: reviewed.hooks,
    hookData: reviewed.hookData,
    hookDataStatus: "empty",
    reviewedPoolEvidence: {
      status: "verified",
      source: "reviewed-v4-manifest",
      kind: provenanceRequired ? "zora-protocol-pool" : "zero-hook-static-fee",
      manifestVersion: 1,
      poolId: reviewed.poolId,
      poolKey: reviewed.poolKey,
      staticFee: reviewed.fee.toString(),
      hookAddress: reviewed.hooks,
      hookData: reviewed.hookData,
      protocolFeeStatus: "zero",
    },
    ...(provenanceRequired
      ? {
          zoraProvenance: {
            status: "verified" as const,
            source: "zora-factory-event" as const,
            chainId: 8453 as const,
            factoryAddress:
              "0x0000000000000000000000000000000000000003" as const,
            coinAddress: reviewed.currency1,
            poolKey: reviewed.poolKey,
            poolId: reviewed.poolKey,
            transactionHash:
              "0x7777777777777777777777777777777777777777777777777777777777777777" as const,
            eventName: "CoinCreatedV4",
          },
        }
      : {}),
  };
}

function compactQuoteResponse(
  amountIn: bigint,
  amountOut: bigint,
  tokenIn?: Address,
  tokenOut?: Address,
  reviewed:
    | typeof FAME_V4_ZORA_REVIEWED_POOL_SHAPE
    | typeof FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE = FAME_V4_ZORA_REVIEWED_POOL_SHAPE,
): FamePoolQuoteBatchResponse {
  return {
    sourceRegistryId: "unit-registry",
    currentBlock: 125,
    producerMaxFreshnessBlocks: 120,
    effectiveMaxFreshnessBlocks: 120,
    quotes: [
      compactQuoteRow(
        amountIn,
        amountOut,
        reviewed,
        tokenIn ?? reviewed.currency1,
        tokenOut ?? reviewed.currency0,
      ),
    ],
  };
}

function compactLiveAdapter(amountOut: bigint): FameAsyncQuoteAdapter {
  return {
    async quoteEdge(request) {
      return {
        status: "quoted",
        amountIn: request.amountIn,
        amountOut,
        capacityIn: null,
        fee: request.edge.fee,
        evidence: "unit live v4 quoter",
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
      assert.equal(
        poolQuoteEndpointUrlFromEnv(),
        "https://api.fame.support/base/fame/pool-quotes",
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
    assert.equal(report.surface, "cl-replay-v1");
    assert.equal(report.sourceRegistryId, "unit-registry");
    assert.equal(report.currentBlock, 125);
    assert.equal(
      report.blockHash,
      "0x1111111111111111111111111111111111111111111111111111111111111111",
    );
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

  it("reports exact compact quote/live parity for the V4 Zora target", async () => {
    const amountIn = 980_100_000_232_613_992n;
    const amountOut = 950_696_999_225_635_572n;
    const cases = [
      {
        label: "BASED->ZORA",
        request: {
          edge: v4ReviewedEdge(
            FAME_V4_ZORA_REVIEWED_POOL_SHAPE,
            FAME_V4_ZORA_REVIEWED_POOL_SHAPE.currency1,
            FAME_V4_ZORA_REVIEWED_POOL_SHAPE.currency0,
          ),
          amountIn,
        },
      },
    ];

    const report = await runCompactQuoteParity({
      quoteResponse: compactQuoteResponse(amountIn, amountOut),
      liveAdapter: compactLiveAdapter(amountOut),
      currentBlock: 125,
      cases,
      expectedSourceRegistryId: "unit-registry",
    });

    assert.equal(report.surface, "compact-quote-v1");
    assert.equal(report.snapshotId, "unit-v4-compact-quote");
    assert.equal(report.evidenceId, "unit-v4-compact-quote");
    assert.equal(report.observedThroughBlock, 124);
    assert.equal(report.results.length, 1);
    assert.equal(report.results[0]?.localAmountOut, amountOut);
    assert.equal(report.results[0]?.driftBps, 0n);
  });

  it("reports exact compact quote/live parity for the no-hook V4 ZORA/ETH target", async () => {
    const amountIn = 1_000_000_000_000_000n;
    const ethToZoraOut = 170_174_733_551_265_108_370n;
    const zoraToEthOut = 5_876_315_014_197n;
    const cases = [
      {
        label: "ETH->ZORA",
        request: {
          edge: v4ReviewedEdge(
            FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE,
            FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE.currency0,
            FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE.currency1,
          ),
          amountIn,
        },
      },
      {
        label: "ZORA->ETH",
        request: {
          edge: v4ReviewedEdge(
            FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE,
            FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE.currency1,
            FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE.currency0,
          ),
          amountIn,
        },
      },
    ];

    const report = await runCompactQuoteParity({
      quoteResponse: {
        ...compactQuoteResponse(
          amountIn,
          ethToZoraOut,
          FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE.currency0,
          FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE.currency1,
          FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE,
        ),
        quotes: [
          compactQuoteRow(
            amountIn,
            ethToZoraOut,
            FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE,
            FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE.currency0,
            FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE.currency1,
          ),
          compactQuoteRow(
            amountIn,
            zoraToEthOut,
            FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE,
            FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE.currency1,
            FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE.currency0,
          ),
        ],
      },
      liveAdapter: {
        async quoteEdge(request) {
          return {
            status: "quoted",
            amountIn: request.amountIn,
            amountOut:
              request.edge.tokenIn ===
              FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE.currency0
                ? ethToZoraOut
                : zoraToEthOut,
            capacityIn: null,
            fee: request.edge.fee,
            evidence: "unit live v4 zora-eth quoter",
          };
        },
      },
      currentBlock: 125,
      cases,
      expectedSourceRegistryId: "unit-registry",
    });

    assert.equal(report.poolId, FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE.poolId);
    assert.equal(report.surface, "compact-quote-v1");
    assert.equal(report.results.length, 2);
    assert.deepEqual(
      report.results.map((result) => result.driftBps),
      [0n, 0n],
    );
  });

  it("keeps V4 targets out of the Slipstream replay runner", async () => {
    const state = indexedState();
    const cases = buildClReplayParityCases([
      {
        poolId: FAME_V4_ZORA_REVIEWED_POOL_SHAPE.poolId,
        tokenIn: FAME_V4_ZORA_REVIEWED_POOL_SHAPE.currency1,
        tokenOut: FAME_V4_ZORA_REVIEWED_POOL_SHAPE.currency0,
        amounts: [1_000_000n],
      },
    ]);

    await assert.rejects(
      () =>
        runClReplayParity({
          indexedState: state,
          liveAdapter: liveAdapter(state, 0n),
          currentBlock: 125,
          cases,
        }),
      /use compact quote parity for V4 targets/,
    );
  });

  it("builds targeted parity cases for a requested pool direction", () => {
    const cases = buildClReplayParityCases([
      {
        poolId: "slipstream-usdc-weth-100",
        tokenIn: WETH,
        tokenOut: USDC,
        amounts: [1_000_000n, 2_000_000n],
      },
    ]);

    assert.deepEqual(
      cases.map((item) => item.request.amountIn),
      [1_000_000n, 2_000_000n],
    );
    assert.ok(
      cases.every(
        (item) => item.request.edge.poolId === "slipstream-usdc-weth-100",
      ),
    );
    assert.match(cases[0]?.label ?? "", /slipstream-usdc-weth-100/);
  });

  it("rejects mixed-pool parity cases before comparing live quotes", async () => {
    const state = indexedState();
    const first = buildClReplayParityCases([
      {
        poolId: "slipstream-usdc-weth-100",
        tokenIn: WETH,
        tokenOut: USDC,
        amounts: [1_000_000n],
      },
    ])[0];
    assert.ok(first);
    await assert.rejects(
      () =>
        runClReplayParity({
          indexedState: state,
          liveAdapter: liveAdapter(state, 0n),
          currentBlock: 125,
          cases: [
            first,
            {
              ...first,
              request: {
                ...first.request,
                edge: {
                  ...first.request.edge,
                  poolId: "other-pool",
                },
              },
            },
          ],
        }),
      /must target one pool id/,
    );
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
