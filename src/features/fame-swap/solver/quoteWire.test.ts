import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FAME_SWAP_ARTIFACT_MANIFEST } from "../artifacts/manifest";
import type { FameSwapConfig } from "../config";
import { routeArtifactById } from "./artifacts";
import { quoteWithReadyReadiness } from "./quote";
import { createDeterministicQuoteAdapter } from "./quotes/deterministicAdapter";
import { DEFAULT_FAME_SWAP_SLIPPAGE_BPS } from "./slippage";
import {
  deserializeFameSwapQuoteResponse,
  FAME_SWAP_QUOTE_WIRE_STATUSES,
  type SerializeQuoteResponseOptions,
  serializeFameSwapQuoteResponse,
} from "./quoteWire";
import type { FameOptimizerEvidence } from "./optimizer/types";
import type { FameSwapOptimizerSummary } from "./types";
import { FAME, USDC, tokenForAddress } from "../tokens";

const routerAddress = "0x0000000000000000000000000000000000000009";
const recipient = "0x0000000000000000000000000000000000000abc";

function config(): FameSwapConfig {
  return {
    routerAddress,
    defaultSlippageBps: DEFAULT_FAME_SWAP_SLIPPAGE_BPS,
    expectedSchemaVersion: FAME_SWAP_ARTIFACT_MANIFEST.schemaVersion,
    expectedPinnedBaseBlock: FAME_SWAP_ARTIFACT_MANIFEST.pinnedBaseBlock,
    expectedSolverRoutesHash: FAME_SWAP_ARTIFACT_MANIFEST.solverRoutesJsonHash,
    expectedGapMatrixHash: FAME_SWAP_ARTIFACT_MANIFEST.gapMatrixJsonHash,
    expectedParityVectorsHash:
      FAME_SWAP_ARTIFACT_MANIFEST.parityVectorsJsonHash,
    expectedPoolsHash: FAME_SWAP_ARTIFACT_MANIFEST.poolsJsonHash,
    expectedPoolStateSnapshotHash:
      FAME_SWAP_ARTIFACT_MANIFEST.poolStateSnapshotJsonHash,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function optimizerEvidenceFixture(): FameOptimizerEvidence {
  return {
    mode: "select",
    status: "selected",
    selectedTemplateId: "secret-template",
    selectedAllocationBps: 6_250,
    selectedAllocationVectorBps: null,
    selectedAlgorithm: "grid",
    selectedStopReason: "grid_complete",
    selectedCandidateId: "secret-candidate",
    objective: {
      baselineProtectedAmountOut: 1_000n,
      selectedProtectedAmountOut: 1_012n,
      winningMarginAmount: 12n,
      winningMarginBps: 12,
    },
    trialStatusCounts: {
      selected: 1,
      rejected: 2,
      pruned: 0,
      budget_exhausted: 0,
      quote_failed: 0,
      unsupported_shape: 0,
      ineligible: 0,
    },
    allocationTrials: [
      {
        templateId: "secret-template",
        allocationBps: 6_250,
        algorithm: "grid",
        stopReason: "grid_complete",
        status: "selected",
        reason: "raw optimizer trial",
        candidateId: "secret-candidate",
        poolIds: ["secret-pool"],
      },
    ],
    templateEligibility: [],
    quotePlanStats: {
      logicalQuoteRequests: 1,
      uniqueExactQuoteReads: 1,
      exactQuoteCacheHits: 0,
      inFlightExactQuoteCoalesces: 0,
      stateReadRequests: 0,
      uniqueStateReads: 0,
      stateReadCacheHits: 0,
      inFlightStateReadCoalesces: 0,
      underlyingRpcReads: 0,
      allocationTrials: 1,
      templatesConsidered: 1,
      budgetExhaustions: 0,
      timeout: false,
      fallbackReason: null,
    },
    fallbackReason: null,
  };
}

function readyWireResponse(options: SerializeQuoteResponseOptions = {}) {
  const tokenIn = tokenForAddress(USDC);
  const tokenOut = tokenForAddress(FAME);
  assert.ok(tokenIn);
  assert.ok(tokenOut);
  const artifact = routeArtifactById("solver-usdc-split-frxusd-merge-fame");
  assert.ok(artifact);
  const quote = quoteWithReadyReadiness({
    tokenIn,
    tokenOut,
    amountIn: BigInt(artifact.route.amountIn),
    recipient,
    routerAddress,
    now: new Date("2026-05-13T00:00:00Z"),
    adapter: createDeterministicQuoteAdapter(),
  });
  assert.equal(quote.status, "ready");
  if (quote.status !== "ready") throw new Error("Expected ready quote.");

  return {
    tokenIn,
    tokenOut,
    quote,
    wire: serializeFameSwapQuoteResponse(quote, options),
  };
}

describe("FAME swap quote wire contract", () => {
  it("documents every current quote status at the wire boundary", () => {
    assert.deepEqual(Object.keys(FAME_SWAP_QUOTE_WIRE_STATUSES).sort(), [
      "no_safe_route",
      "not_live_ready",
      "quote_adapter_failure",
      "ready",
      "simulation_failure",
      "stale_artifact",
      "unsupported",
    ]);
  });

  it("serializes and deserializes a ready quote with canonical hash fields", () => {
    const { tokenIn, tokenOut, quote, wire } = readyWireResponse();

    assert.equal(wire.status, "ready");
    assert.equal(wire.fixtureRouteHash, quote.fixtureRouteHash);
    assert.equal(wire.materializedRouteHash, quote.materializedRouteHash);
    assert.equal(wire.routeHash, quote.materializedRouteHash);
    assert.equal(typeof wire.requestedAmountIn, "string");
    assert.equal(typeof wire.routerFeeAmount, "string");
    assert.equal(typeof wire.expiresAt, "string");
    assert.equal("approval" in wire, false);
    assert.equal("swap" in wire, false);
    assert.equal("rejectedCandidates" in wire, false);
    assert.equal("optimizerSummary" in wire, false);
    assert.equal("warnings" in wire, false);
    assert.equal("debug" in wire, false);
    assert.doesNotMatch(
      JSON.stringify(wire),
      /protocolEvidence|activeLiquidity/,
    );

    const parsed = deserializeFameSwapQuoteResponse(wire, {
      tokenIn,
      tokenOut,
      amountIn: quote.requestedAmountIn,
      config: config(),
    });

    assert.equal(parsed.status, "ready");
    if (parsed.status === "ready") {
      assert.equal(parsed.materializedRouteHash, quote.materializedRouteHash);
      assert.equal(parsed.fixtureRouteHash, quote.fixtureRouteHash);
      assert.equal(parsed.feeBreakdown.legs[0]?.amountIn > 0n, true);
      assert.deepEqual(parsed.rejectedCandidates, []);
      assert.equal(parsed.optimizerSummary, undefined);
    }
  });

  it("keeps ready response diagnostics behind explicit debug opt-in", () => {
    const { tokenIn, tokenOut, quote } = readyWireResponse();
    const optimizerSummary: FameSwapOptimizerSummary = {
      mode: "select",
      status: "selected",
      selectedTemplateId: "public-template",
      selectedAllocationBps: 6_250,
      selectedCandidateId: "public-candidate",
      winningMarginBps: 12,
      trialStatusCounts: {
        selected: 1,
        rejected: 2,
        pruned: 0,
        budget_exhausted: 0,
        quote_failed: 0,
        unsupported_shape: 0,
        ineligible: 0,
      },
      fallbackReason: null,
      runStats: {
        logicalQuoteRequests: 5,
        uniqueExactQuoteReads: 3,
        exactQuoteCacheHits: 2,
        trials: 4,
        templatesConsidered: 2,
        budgetExhaustions: 0,
        timeout: false,
      },
    };
    const sourceQuote = {
      ...quote,
      warnings: ["debug quote warning"],
      optimizerSummary,
      optimizerEvidence: optimizerEvidenceFixture(),
    };
    const wire = serializeFameSwapQuoteResponse(sourceQuote);
    const debugWire = serializeFameSwapQuoteResponse(sourceQuote, {
      includeDebug: true,
    });

    assert.doesNotMatch(
      JSON.stringify(wire),
      /optimizerEvidence|optimizerSummary|allocationTrials|quotePlanStats|secret-template|secret-pool|rejectedCandidates/,
    );
    assert.equal("warnings" in wire, false);
    assert.equal("debug" in wire, false);

    const readyDebug = debugWire.debug;
    assert.ok(isRecord(readyDebug));
    assert.ok(isRecord(readyDebug.optimizerSummary));
    assert.ok(isRecord(readyDebug.approval));
    assert.ok(isRecord(readyDebug.swap));
    assert.deepEqual(readyDebug.warnings, ["debug quote warning"]);
    assert.equal(readyDebug.optimizerSummary.selectedAllocationBps, 6_250);
    assert.equal(readyDebug.approval.kind, "approval");
    assert.equal(readyDebug.swap.kind, "swap");
    assert.doesNotMatch(
      JSON.stringify(debugWire),
      /optimizerEvidence|allocationTrials|quotePlanStats|secret-template|secret-pool|protocolEvidence|activeLiquidity/,
    );
    const compactBytes = JSON.stringify(wire).length;
    const debugBytes = JSON.stringify(debugWire).length;
    assert.ok(compactBytes < 10_000);
    assert.ok(debugBytes > compactBytes * 3);

    const parsed = deserializeFameSwapQuoteResponse(debugWire, {
      tokenIn,
      tokenOut,
      amountIn: quote.requestedAmountIn,
      config: config(),
    });
    assert.equal(parsed.status, "ready");
    if (parsed.status === "ready") {
      assert.equal(parsed.optimizerSummary?.status, "selected");
      assert.equal(parsed.optimizerSummary?.selectedAllocationBps, 6_250);
      assert.deepEqual(parsed.warnings, ["debug quote warning"]);
    }
  });

  it("round-trips indexed quote context without protocol evidence", () => {
    const { tokenIn, tokenOut, quote } = readyWireResponse();
    const wire = serializeFameSwapQuoteResponse({
      ...quote,
      quoteContext: {
        source: "indexed",
        chainId: 8453,
        currentBlock: 125,
        sourceRegistryId: "unit-registry",
        effectiveMaxFreshnessBlocks: 120,
        statusCounts: {
          fresh: 1,
          stale: 2,
          unknown: 3,
          unsupported: 4,
        },
      },
    });

    assert.doesNotMatch(JSON.stringify(wire), /protocolEvidence|serviceToken/);

    const parsed = deserializeFameSwapQuoteResponse(wire, {
      tokenIn,
      tokenOut,
      amountIn: quote.requestedAmountIn,
      config: config(),
    });

    assert.equal(parsed.status, "ready");
    if (parsed.status === "ready") {
      assert.deepEqual(parsed.quoteContext, {
        source: "indexed",
        chainId: 8453,
        currentBlock: 125,
        sourceRegistryId: "unit-registry",
        effectiveMaxFreshnessBlocks: 120,
        statusCounts: {
          fresh: 1,
          stale: 2,
          unknown: 3,
          unsupported: 4,
        },
      });
    }
  });

  it("keeps quote API diagnostics debug data compact and sanitized", () => {
    const { quote } = readyWireResponse();
    const wire = serializeFameSwapQuoteResponse(
      {
        ...quote,
        diagnosticsVisibleByDefault: true,
      },
      {
        includeDebug: true,
        debug: {
          quoteApi: {
            configured: true,
            attempted: true,
            currentBlock: 125,
            edgeCount: 2,
            usedCount: 1,
            fallbackCount: 1,
            batchFailureCount: 0,
            timing: {
              batchRequestCount: 1,
              totalBatchDurationMs: 4,
              maxBatchDurationMs: 4,
              lastBatchDurationMs: 4,
            },
            statusCounts: {
              quoted: 1,
              unavailable: 1,
            },
            fallbackReasonCounts: {
              row_metadata_mismatch: 1,
            },
            details: [
              {
                poolId: "uniswap-v4-basedflick-zora",
                tokenIn: "0x1111111111166b7fe7bd91427724b487980afc69",
                tokenOut: "0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926",
                amountIn: "1000000",
                currentBlock: 125,
                outcome: "used",
                quoteKind: "cl-quote-v1",
                rowStatus: "quoted",
                observedThroughBlock: 120,
                evidenceId: "unit-v4-cl-quote",
              },
              {
                poolId: "uniswap-v4-basedflick-zora",
                tokenIn: "0x1111111111166b7fe7bd91427724b487980afc69",
                tokenOut: "0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926",
                amountIn: "1000000",
                currentBlock: 125,
                outcome: "fallback",
                fallbackReason: "row_metadata_mismatch",
                evidenceId: "unit-v4-cl-quote",
              },
            ],
            truncatedDetailCount: 0,
          },
        },
      },
    );

    assert.ok(isRecord(wire.debug));
    assert.ok(isRecord(wire.debug.quoteApi));
    const debug = JSON.stringify(wire.debug);
    assert.match(debug, /unit-v4-cl-quote|row_metadata_mismatch/);
    assert.doesNotMatch(
      debug,
      /bitmapWords|initializedTicks|serviceToken|authorization|helperUrl|rpcUrl|secret/i,
    );
  });

  it("fails closed when a ready response route hash does not match the decoded route", () => {
    const { tokenIn, tokenOut, quote, wire } = readyWireResponse();
    const parsed = deserializeFameSwapQuoteResponse(
      {
        ...wire,
        materializedRouteHash:
          "0x1111111111111111111111111111111111111111111111111111111111111111",
      },
      {
        tokenIn,
        tokenOut,
        amountIn: quote.requestedAmountIn,
        config: config(),
      },
    );

    assert.equal(parsed.status, "quote_adapter_failure");
    assert.match(parsed.message, /malformed/);
    assert.equal("route" in parsed, false);
  });

  it("fails closed when a ready response omits the decoded route", () => {
    const { tokenIn, tokenOut, quote, wire } = readyWireResponse();
    const { route: _route, ...malformedWire } = wire;

    const parsed = deserializeFameSwapQuoteResponse(malformedWire, {
      tokenIn,
      tokenOut,
      amountIn: quote.requestedAmountIn,
      config: config(),
    });

    assert.equal(parsed.status, "quote_adapter_failure");
    assert.match(parsed.message, /malformed/);
  });

  it("preserves status-specific fields for non-ready responses", () => {
    const tokenIn = tokenForAddress(USDC);
    const tokenOut = tokenForAddress(FAME);
    assert.ok(tokenIn);
    assert.ok(tokenOut);
    const wire = serializeFameSwapQuoteResponse({
      status: "not_live_ready",
      tokenIn,
      tokenOut,
      requestedAmountIn: 5_000_000n,
      readiness: {
        status: "not_live_ready",
        reason: "missing_router",
        message: "Router missing.",
        routerAddress: null,
      },
      message: "Router missing.",
      diagnosticsVisibleByDefault: true,
    });

    assert.equal(wire.status, "not_live_ready");
    assert.equal(wire.requestedAmountIn, "5000000");
    assert.equal("debug" in wire, false);
    assert.equal("approval" in wire, false);
    assert.equal("swap" in wire, false);
    assert.equal("route" in wire, false);
    assert.equal(
      (wire.readiness as { reason?: string } | undefined)?.reason,
      "missing_router",
    );
  });

  it("keeps non-ready rejected candidates in debug responses only", () => {
    const tokenIn = tokenForAddress(USDC);
    const tokenOut = tokenForAddress(FAME);
    assert.ok(tokenIn);
    assert.ok(tokenOut);
    const quote = {
      status: "quote_adapter_failure" as const,
      tokenIn,
      tokenOut,
      requestedAmountIn: 5_000_000n,
      rejectedCandidates: [
        {
          candidateId: "api-runner",
          reason: "adapter_failure" as const,
          message: "Base RPC is not configured for live liquidity quotes.",
        },
      ],
      message: "Base RPC is not configured for live liquidity quotes.",
      diagnosticsVisibleByDefault: true,
    };
    const wire = serializeFameSwapQuoteResponse(quote);
    const debugWire = serializeFameSwapQuoteResponse(quote, {
      includeDebug: true,
    });

    assert.equal("rejectedCandidates" in wire, false);
    assert.equal("debug" in wire, false);
    const debug = debugWire.debug;
    assert.ok(isRecord(debug));
    assert.ok(Array.isArray(debug.rejectedCandidates));
    const [firstRejection] = debug.rejectedCandidates;
    assert.ok(isRecord(firstRejection));
    assert.equal(firstRejection.candidateId, "api-runner");

    const parsed = deserializeFameSwapQuoteResponse(debugWire, {
      tokenIn,
      tokenOut,
      amountIn: quote.requestedAmountIn,
      config: config(),
    });
    assert.equal(parsed.status, "quote_adapter_failure");
    if (parsed.status === "quote_adapter_failure") {
      assert.equal(parsed.rejectedCandidates[0]?.candidateId, "api-runner");
    }
  });
});
