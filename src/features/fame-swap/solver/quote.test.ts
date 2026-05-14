import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FAME_SWAP_ARTIFACT_MANIFEST } from "../artifacts/manifest";
import type { FameSwapConfig } from "../config";
import { FAME, NATIVE_ETH, USDC, WETH, tokenForAddress } from "../tokens";
import { routeArtifactById } from "./artifacts";
import { quoteFameSwap } from "./quote";
import { createDeterministicQuoteAdapter } from "./quotes/deterministicAdapter";
import { DEFAULT_FAME_SWAP_SLIPPAGE_BPS } from "./slippage";
import type { FameSwapQuote } from "./types";

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

function readyQuote(
  tokenInAddress: typeof FAME | typeof USDC | typeof WETH | typeof NATIVE_ETH,
  tokenOutAddress: typeof FAME | typeof USDC | typeof WETH | typeof NATIVE_ETH,
  amountIn: bigint,
): FameSwapQuote {
  const tokenIn = tokenForAddress(tokenInAddress);
  const tokenOut = tokenForAddress(tokenOutAddress);
  assert.ok(tokenIn);
  assert.ok(tokenOut);

  return quoteFameSwap({
    tokenIn,
    tokenOut,
    amountIn,
    recipient,
    config: config(),
    readiness: {
      status: "ready",
      routerAddress,
      feePpm: 2_222n,
    },
    adapter: createDeterministicQuoteAdapter(),
    now: new Date("2026-05-13T00:00:00Z"),
  });
}

function artifactAmount(id: string): bigint {
  const artifact = routeArtifactById(id);
  assert.ok(artifact);
  return BigInt(artifact.route.amountIn);
}

describe("FAME swap quote", () => {
  it("returns executable quote for the fixture amount", () => {
    const amountIn = artifactAmount("solver-fame-basedflick-zora-usdc");
    const quote = readyQuote(FAME, USDC, amountIn);

    assert.equal(quote.status, "ready");
    if (quote.status === "ready") {
      assert.ok(quote.routeArtifactId.includes("single_path"));
      assert.ok(quote.poolIds.includes("slipstream-basedflick-fame"));
      assert.equal(quote.route.amountIn, amountIn);
      assert.equal(quote.callValue, 0n);
      assert.equal(quote.approval?.amount, amountIn);
      assert.equal(quote.approval?.spender, routerAddress);
      assert.ok(quote.routerFeeAmount > 0n);
      assert.equal(quote.feeBreakdown.venueFeesIncluded, true);
    }
  });

  it("fails closed for arbitrary amounts outside deterministic route capacity", () => {
    const amountIn = artifactAmount("solver-fame-basedflick-zora-usdc");
    const requested = amountIn * 1_000n;
    const quote = readyQuote(FAME, USDC, requested);

    assert.equal(quote.status, "no_safe_route");
    if (quote.status === "no_safe_route") {
      assert.ok(
        quote.rejectedCandidates.some(
          (candidate) => candidate.reason === "amount_exceeds_capacity",
        ),
      );
    }
  });

  it("keeps native ETH call value explicit and avoids approval", () => {
    const amountIn = artifactAmount("solver-eth-zora-basedflick-fame");
    const quote = readyQuote(NATIVE_ETH, FAME, amountIn);

    assert.equal(quote.status, "ready");
    if (quote.status === "ready") {
      assert.equal(quote.callValue, amountIn);
      assert.equal(quote.approval, null);
    }
  });

  it("does not use fixture recipient in materialized live route", () => {
    const artifact = routeArtifactById("solver-fame-basedflick-zora-weth");
    assert.ok(artifact);
    const quote = readyQuote(FAME, WETH, BigInt(artifact.route.amountIn));

    assert.equal(quote.status, "ready");
    if (quote.status === "ready") {
      assert.notEqual(quote.route.recipient, artifact.route.recipient);
      assert.equal(quote.route.recipient, recipient);
      assert.ok(quote.route.deadline < BigInt(artifact.route.deadline));
    }
  });

  it("returns not_live_ready when router readiness has not been checked", () => {
    const tokenIn = tokenForAddress(FAME);
    const tokenOut = tokenForAddress(USDC);
    assert.ok(tokenIn);
    assert.ok(tokenOut);
    const amountIn = artifactAmount("solver-fame-basedflick-zora-usdc");
    const quote = quoteFameSwap({
      tokenIn,
      tokenOut,
      amountIn,
      recipient,
      config: config(),
      now: new Date("2026-05-13T00:00:00Z"),
    });

    assert.equal(quote.status, "not_live_ready");
    if (quote.status === "not_live_ready") {
      assert.equal(quote.readiness.reason, "read_error");
    }
  });

  it("returns unsupported with available directions", () => {
    const tokenIn = tokenForAddress(USDC);
    const tokenOut = tokenForAddress(WETH);
    assert.ok(tokenIn);
    assert.ok(tokenOut);

    const quote = quoteFameSwap({
      tokenIn,
      tokenOut,
      amountIn: 1n,
      recipient,
      config: config(),
      now: new Date("2026-05-13T00:00:00Z"),
    });

    assert.equal(quote.status, "unsupported");
    if (quote.status === "unsupported") {
      assert.ok(quote.availableDirections.includes("FAME->USDC"));
    }
  });
});
