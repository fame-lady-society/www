import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { keccak256, toHex, type Address } from "viem";
import { FAME_SWAP_ARTIFACT_MANIFEST } from "../../artifacts/manifest";
import type { FameSwapConfig } from "../../config";
import { FAME, USDC, WETH, tokenForAddress } from "../../tokens";
import { quoteFameSwap } from "../quote";
import { DEFAULT_FAME_SWAP_SLIPPAGE_BPS } from "../slippage";
import { famePoolEdges, famePoolEdgesForPair } from "../poolUniverse";
import {
  createSnapshotQuoteAdapter,
  poolStateSnapshotFile,
  snapshotIntegrityIssue,
  type FamePoolStateSnapshotFile,
} from "./snapshotAdapter";

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

function token(address: Address) {
  const result = tokenForAddress(address);
  assert.ok(result);
  return result;
}

describe("FAME snapshot quote adapter", () => {
  it("matches the pinned pool-state snapshot artifact manifest", () => {
    const bytes = readFileSync(
      "src/features/fame-swap/artifacts/base-v1-pool-state-snapshot.json",
    );

    assert.equal(
      keccak256(toHex(bytes)),
      FAME_SWAP_ARTIFACT_MANIFEST.poolStateSnapshotJsonHash,
    );
    assert.equal(snapshotIntegrityIssue(), null);
  });

  it("quotes a $5 USDC route from recorded-state quote evidence", () => {
    const quote = quoteFameSwap({
      tokenIn: token(USDC),
      tokenOut: token(FAME),
      amountIn: 5_000_000n,
      recipient,
      config: config(),
      readiness: {
        status: "ready",
        routerAddress,
        feePpm: 2_222n,
      },
      now: new Date("2026-05-13T00:00:00Z"),
      adapter: createSnapshotQuoteAdapter(),
    });

    assert.equal(quote.status, "ready");
    if (quote.status === "ready") {
      assert.equal(quote.quoteContext?.source, "snapshot");
      assert.equal(
        quote.quoteContext?.snapshotId,
        poolStateSnapshotFile.snapshotId,
      );
      assert.ok(
        quote.poolIds.includes("uniswap-v3-zora-usdc") ||
          quote.poolIds.includes("slipstream-zora-usdc"),
      );
      assert.ok(quote.poolIds.includes("slipstream-zora-weth"));
      assert.ok(quote.poolIds.includes("uniswap-v2-fame-direct"));
      assert.ok(quote.feeBreakdown.marketImpact.computableLegs > 0);
      assert.ok(
        !quote.rejectedCandidates.some(
          (candidate) => candidate.reason === "amount_exceeds_capacity",
        ),
      );
    }
  });

  it("replays constant-product reserves with price-impact evidence", () => {
    const edge = famePoolEdgesForPair(WETH, FAME).find(
      (candidate) => candidate.poolId === "uniswap-v2-fame-direct",
    );
    assert.ok(edge);

    const quote = createSnapshotQuoteAdapter().quoteEdge({
      edge,
      amountIn: 100_000_000_000_000n,
    });

    assert.equal(quote.status, "quoted");
    if (quote.status === "quoted") {
      assert.equal(quote.context?.source, "snapshot");
      assert.ok(quote.priceImpact);
      assert.equal(quote.priceImpact.method, "constant-product-reserves");
      assert.ok(quote.priceImpact.marketImpactBps !== null);
      assert.equal(quote.protocolEvidence?.quote.status, "available");
      assert.equal(quote.protocolEvidence?.postPrice.status, "available");
    }
  });

  it("replays volatile Solidly reserves as constant-product evidence", () => {
    const edge = famePoolEdgesForPair(WETH, FAME).find(
      (candidate) => candidate.poolId === "scale-equalizer-weth-fame",
    );
    assert.ok(edge);
    const recorded: FamePoolStateSnapshotFile = {
      schemaVersion: FAME_SWAP_ARTIFACT_MANIFEST.schemaVersion,
      status: "generated-live-liquidity-snapshot",
      snapshotId: "unit-solidly-volatile",
      pinnedBaseBlock: FAME_SWAP_ARTIFACT_MANIFEST.pinnedBaseBlock,
      capturedBaseBlock: FAME_SWAP_ARTIFACT_MANIFEST.pinnedBaseBlock,
      generatedAt: "2026-05-13T00:00:00.000Z",
      source: "unit test",
      reserveStates: [
        {
          poolId: "scale-equalizer-weth-fame",
          pool: "0x0db3a3228520fc31162c24f1b47177255cc1b82e",
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

    const quote = createSnapshotQuoteAdapter(recorded).quoteEdge({
      edge,
      amountIn: 100_000_000_000_000n,
    });

    assert.equal(quote.status, "quoted");
    if (quote.status === "quoted") {
      assert.match(quote.evidence, /recorded reserves/);
      assert.equal(quote.priceImpact?.method, "constant-product-reserves");
      assert.equal(quote.protocolEvidence?.activeLiquidity.status, "not_applicable");
    }
  });

  it("marks recorded V4 active liquidity unavailable when snapshot entries lack StateView liquidity", () => {
    const edge = famePoolEdges().find(
      (candidate) => candidate.poolId === "uniswap-v4-basedflick-zora",
    );
    assert.ok(edge);
    const recorded: FamePoolStateSnapshotFile = {
      schemaVersion: FAME_SWAP_ARTIFACT_MANIFEST.schemaVersion,
      status: "generated-live-liquidity-snapshot",
      snapshotId: "unit-v4-no-liquidity",
      pinnedBaseBlock: FAME_SWAP_ARTIFACT_MANIFEST.pinnedBaseBlock,
      capturedBaseBlock: FAME_SWAP_ARTIFACT_MANIFEST.pinnedBaseBlock,
      generatedAt: "2026-05-13T00:00:00.000Z",
      source: "unit test",
      reserveStates: [],
      quoteTable: [
        {
          poolId: edge.poolId,
          tokenIn: edge.tokenIn,
          tokenOut: edge.tokenOut,
          amountIn: "12345",
          amountOut: "67890",
          evidence: "recorded-state quote evidence",
          priceImpact: {
            preSwapPriceX18: "10",
            postSwapPriceX18: null,
            executionPriceX18: "9",
            marketImpactBps: 1000,
            method: "concentrated-liquidity-slot0",
          },
        },
      ],
      unsupportedQuotePools: [],
    };
    const quote = createSnapshotQuoteAdapter(recorded).quoteEdge({
      edge,
      amountIn: 12_345n,
    });

    if (quote.status === "quoted") {
      assert.equal(quote.protocolEvidence?.activeLiquidity.status, "unavailable");
      assert.match(
        quote.protocolEvidence?.activeLiquidity.reason ?? "",
        /does not include V4 StateView\.getLiquidity/,
      );
    }
  });

  it("fails closed for missing snapshot evidence without synthetic capacity reasons", () => {
    const edge = famePoolEdgesForPair(WETH, FAME).find(
      (candidate) => candidate.poolId === "scale-equalizer-weth-fame",
    );
    assert.ok(edge);
    const emptySnapshot: FamePoolStateSnapshotFile = {
      schemaVersion: FAME_SWAP_ARTIFACT_MANIFEST.schemaVersion,
      status: "generated-live-liquidity-snapshot",
      snapshotId: "unit-empty",
      pinnedBaseBlock: FAME_SWAP_ARTIFACT_MANIFEST.pinnedBaseBlock,
      capturedBaseBlock: FAME_SWAP_ARTIFACT_MANIFEST.pinnedBaseBlock,
      generatedAt: "2026-05-13T00:00:00.000Z",
      source: "unit test",
      reserveStates: [],
      quoteTable: [],
      unsupportedQuotePools: [],
    };

    const quote = createSnapshotQuoteAdapter(emptySnapshot).quoteEdge({
      edge,
      amountIn: 100_000_000_000_000n,
    });

    assert.equal(quote.status, "failed");
    if (quote.status === "failed") {
      assert.equal(quote.reason, "no_quote_evidence");
      assert.notEqual(quote.reason, "amount_exceeds_capacity");
    }
  });
});
