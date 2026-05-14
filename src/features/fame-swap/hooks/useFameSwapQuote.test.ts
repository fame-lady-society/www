import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FAME_SWAP_ARTIFACT_MANIFEST } from "../artifacts/manifest";
import type { FameSwapConfig } from "../config";
import { routeArtifactById } from "../solver/artifacts";
import { quoteWithReadyReadiness } from "../solver/quote";
import { createDeterministicQuoteAdapter } from "../solver/quotes/deterministicAdapter";
import { DEFAULT_FAME_SWAP_SLIPPAGE_BPS } from "../solver/slippage";
import { FAME, USDC, tokenForAddress } from "../tokens";
import { deserializeFameSwapQuoteResponse } from "./useFameSwapQuote";

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
    expectedParityVectorsHash: FAME_SWAP_ARTIFACT_MANIFEST.parityVectorsJsonHash,
    expectedPoolsHash: FAME_SWAP_ARTIFACT_MANIFEST.poolsJsonHash,
    expectedPoolStateSnapshotHash:
      FAME_SWAP_ARTIFACT_MANIFEST.poolStateSnapshotJsonHash,
  };
}

function jsonRoundTrip(value: unknown): unknown {
  return JSON.parse(
    JSON.stringify(value, (_key, entry) =>
      typeof entry === "bigint" ? entry.toString() : entry,
    ),
  );
}

describe("useFameSwapQuote response deserialization", () => {
  it("rebuilds a ready API quote into the shared executable quote shape", () => {
    const tokenIn = tokenForAddress(USDC);
    const tokenOut = tokenForAddress(FAME);
    assert.ok(tokenIn);
    assert.ok(tokenOut);
    const artifact = routeArtifactById("solver-usdc-split-frxusd-merge-fame");
    assert.ok(artifact);
    const sourceQuote = quoteWithReadyReadiness({
      tokenIn,
      tokenOut,
      amountIn: BigInt(artifact.route.amountIn),
      recipient,
      routerAddress,
      now: new Date("2026-05-13T00:00:00Z"),
      adapter: createDeterministicQuoteAdapter(),
    });
    assert.equal(sourceQuote.status, "ready");
    if (sourceQuote.status !== "ready") return;

    const apiResponse = jsonRoundTrip({
      status: "ready",
      message: sourceQuote.message,
      routeArtifactId: sourceQuote.routeArtifactId,
      routeSource: sourceQuote.routeSource,
      routerAddress: sourceQuote.routerAddress,
      requestedAmountIn: sourceQuote.requestedAmountIn,
      grossEstimatedOutput: sourceQuote.grossEstimatedOutput,
      estimatedOutput: sourceQuote.estimatedOutput,
      routerFeeAmount: sourceQuote.routerFeeAmount,
      minAmountOutAfterFee: sourceQuote.minAmountOutAfterFee,
      feeBreakdown: sourceQuote.feeBreakdown,
      quoteContext: sourceQuote.quoteContext,
      feePpm: sourceQuote.feePpm,
      capabilities: sourceQuote.capabilities,
      callValue: sourceQuote.callValue,
      slippageBps: sourceQuote.slippageBps,
      expiresAt: sourceQuote.expiresAt.toISOString(),
      routeHash: sourceQuote.materializedRouteHash,
      poolIds: sourceQuote.poolIds,
      warnings: sourceQuote.warnings,
      rejectedCandidates: sourceQuote.rejectedCandidates,
      route: sourceQuote.route,
      routeDisplay: sourceQuote.routeDisplay,
    });

    const parsed = deserializeFameSwapQuoteResponse(apiResponse, {
      tokenIn,
      tokenOut,
      amountIn: sourceQuote.requestedAmountIn,
      config: config(),
    });

    assert.equal(parsed.status, "ready");
    if (parsed.status === "ready") {
      assert.equal(parsed.route.amountIn, sourceQuote.route.amountIn);
      assert.equal(parsed.approval?.amount, sourceQuote.route.amountIn);
      assert.equal(parsed.materializedRouteHash, sourceQuote.materializedRouteHash);
      assert.equal(parsed.feePpm, sourceQuote.feePpm);
      assert.equal(parsed.capabilities.splitThenMerge, true);
      assert.equal(parsed.feeBreakdown.legs[0]?.amountIn > 0n, true);
    }
  });

  it("keeps non-ready API responses structurally non-executable", () => {
    const tokenIn = tokenForAddress(USDC);
    const tokenOut = tokenForAddress(FAME);
    assert.ok(tokenIn);
    assert.ok(tokenOut);

    const parsed = deserializeFameSwapQuoteResponse(
      {
        status: "quote_adapter_failure",
        message: "Base RPC is not configured for live liquidity quotes.",
        rejectedCandidates: [
          {
            candidateId: "api-runner",
            reason: "adapter_failure",
            message: "Base RPC is not configured for live liquidity quotes.",
          },
        ],
      },
      {
        tokenIn,
        tokenOut,
        amountIn: 5_000_000n,
        config: config(),
      },
    );

    assert.equal(parsed.status, "quote_adapter_failure");
    assert.equal("route" in parsed, false);
    assert.equal("approval" in parsed, false);
  });
});
