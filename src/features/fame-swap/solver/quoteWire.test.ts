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
  serializeFameSwapQuoteResponse,
} from "./quoteWire";
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

function readyWireResponse() {
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
    wire: serializeFameSwapQuoteResponse(quote),
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
    }
  });

  it("does not serialize raw optimizer evidence on ready public responses", () => {
    const { tokenIn, tokenOut, quote } = readyWireResponse();
    const wire = serializeFameSwapQuoteResponse({
      ...quote,
      optimizerSummary: {
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
      },
      optimizerEvidence: {
        allocationTrials: [
          {
            templateId: "secret-template",
            allocationBps: 6_250,
            status: "selected",
            reason: "raw optimizer trial",
            poolIds: ["secret-pool"],
          },
        ],
        quotePlanStats: {
          logicalQuoteRequests: 1,
        },
      } as never,
    });

    assert.doesNotMatch(
      JSON.stringify(wire),
      /optimizerEvidence|allocationTrials|quotePlanStats|secret-template|secret-pool/,
    );

    assert.equal(
      (wire.optimizerSummary as { selectedAllocationBps?: number })
        .selectedAllocationBps,
      6_250,
    );

    const parsed = deserializeFameSwapQuoteResponse(wire, {
      tokenIn,
      tokenOut,
      amountIn: quote.requestedAmountIn,
      config: config(),
    });
    assert.equal(parsed.status, "ready");
    if (parsed.status === "ready") {
      assert.equal(parsed.optimizerSummary?.status, "selected");
      assert.equal(parsed.optimizerSummary?.selectedAllocationBps, 6_250);
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
    assert.equal("approval" in wire, false);
    assert.equal("swap" in wire, false);
    assert.equal("route" in wire, false);
    assert.equal(
      (wire.readiness as { reason?: string } | undefined)?.reason,
      "missing_router",
    );
  });
});
