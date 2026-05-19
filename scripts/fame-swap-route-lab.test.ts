import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatRouteLabMarkdown,
  runIndexedRouteLab,
  runRouteLab,
  runSnapshotRouteLab,
  type FameRouteLabRow,
} from "./fame-swap-route-lab";
import { famePoolStateRegistrySourceId } from "../src/features/fame-swap/solver/poolStateRegistry";
import { FAME_ROUTE_CORPUS } from "../src/features/fame-swap/solver/routeCorpus";
import { FAME, USDC, WETH } from "../src/features/fame-swap/tokens";

describe("FAME route lab", () => {
  it("replays the full recorded-state corpus with executable quote evidence", async () => {
    const rows = await runSnapshotRouteLab();

    assert.equal(rows.length, FAME_ROUTE_CORPUS.length);
    for (const row of rows) {
      assert.equal(row.mode, "recorded");
      assert.equal(row.status, row.expectedStatus, row.id);
      assert.equal(row.simulation.status, "not_requested", row.id);
      assert.match(
        row.quoteContext ?? "",
        /^recorded:base-v1-live-\d+:45884844$/,
      );
      assert.ok(row.selectedPools.length > 0, row.id);
      assert.ok(row.feeBreakdown.routerFeeAmount !== null, row.id);
      assert.equal(row.feeBreakdown.venueFeesIncluded, true, row.id);
      assert.ok((row.feeBreakdown.computablePriceImpactLegs ?? 0) > 0, row.id);
      assert.ok(row.suggestedContractTodo?.includes(row.id), row.id);
      assert.ok(row.optimizer, row.id);
      assert.ok(
        (row.optimizer?.quotePlanStats.logicalQuoteRequests as number) > 0,
        row.id,
      );
      assert.ok(
        row.optimizer?.allocationTrials.every(
          (trial) => typeof trial.algorithm === "string",
        ),
        row.id,
      );
      assert.ok(
        row.optimizer?.allocationTrials.some((trial) => trial.stopReason),
        row.id,
      );
      assert.ok(row.edgeMatrix.length > 0, row.id);
      assert.ok(
        row.edgeMatrix.some((edge) => edge.status === "selected"),
        row.id,
      );
      assert.equal(row.protocolCoverage.length, row.edgeMatrix.length, row.id);
      assert.ok(
        row.protocolCoverage.some(
          (coverage) =>
            coverage.edgeStatus === "selected" &&
            coverage.quote.status === "available",
        ),
        row.id,
      );
    }
  });

  it("includes reviewed connector statuses in route-lab JSON rows", async () => {
    const rows = await runSnapshotRouteLab();

    for (const row of rows) {
      assert.ok(
        row.edgeMatrix.some(
          (edge) =>
            edge.status !== "missing" &&
            edge.tokenIn.toLowerCase() === WETH.toLowerCase() &&
            edge.tokenOut.toLowerCase() === USDC.toLowerCase(),
        ),
        row.id,
      );
      assert.ok(
        !row.edgeMatrix.some(
          (edge) =>
            edge.status === "disabled" &&
            edge.poolId?.startsWith("slipstream2-"),
        ),
        row.id,
      );
      for (const edge of row.edgeMatrix) {
        assert.match(
          edge.reasonCategory,
          /_edge|quote_adapter_failure|unsafe_output/,
        );
        assert.doesNotMatch(edge.reason, /https?:\/\//);
        assert.doesNotMatch(edge.reason, /0x[a-fA-F0-9]{96,}/);
      }
      assert.ok(
        row.protocolCoverage.some(
          (coverage) =>
            coverage.edgeStatus === "disabled" &&
            coverage.quote.status === "disabled",
        ),
        row.id,
      );
    }
    assert.ok(
      rows.some((row) =>
        row.protocolCoverage.some(
          (coverage) => coverage.edgeStatus === "considered",
        ),
      ),
    );
  });

  it("surfaces candidate generation budget diagnostics in JSON and markdown", async () => {
    const [entry] = FAME_ROUTE_CORPUS;
    assert.ok(entry);
    const rows = await runSnapshotRouteLab([entry], {
      candidateBudgets: {
        maxCandidates: 1,
        maxSplitCandidates: 0,
        maxWorkUnits: 2,
      },
    });
    const row = rows[0];
    assert.ok(row);
    assert.ok(row.candidateGenerationDiagnostics.length > 0);
    assert.ok(
      row.candidateGenerationDiagnostics.some((diagnostic) =>
        diagnostic.reason.includes("budget"),
      ),
    );

    const markdown = formatRouteLabMarkdown(rows);
    assert.match(markdown, /Candidate Generation Diagnostics/);
    assert.match(markdown, /budget/);
  });

  it("keeps deterministic cap-profile failures explicit and non-executable", async () => {
    const rows = await runRouteLab();
    const rowsById = new Map(rows.map((row) => [row.id, row]));

    for (const entry of FAME_ROUTE_CORPUS) {
      const row = rowsById.get(entry.id);
      assert.ok(row, entry.id);
      assert.equal(
        row.status,
        entry.expectedDeterministicStatus ?? entry.expectedStatus,
        entry.id,
      );
      if (row.status !== "ready") {
        assert.equal(row.selectedPools.length, 0, entry.id);
        assert.equal(row.feeBreakdown.routerFeeAmount, null, entry.id);
      }
    }
  });

  it("shows indexed pool-state counts and context in indexed mode", async () => {
    const entry = FAME_ROUTE_CORPUS.find(
      (candidate) => candidate.id === "weth-fame-small-direct",
    );
    assert.ok(entry);
    const rows = await runIndexedRouteLab([entry], {
      currentBlock: 125,
      poolStateClient: {
        async fetchPoolStates(request) {
          return {
            sourceRegistryId: famePoolStateRegistrySourceId(),
            currentBlock: request.currentBlock,
            producerMaxFreshnessBlocks: 120,
            effectiveMaxFreshnessBlocks: 120,
            pools: request.poolIds.map((poolId) =>
              poolId === "scale-equalizer-weth-fame" ||
              poolId === "uniswap-v2-fame-direct"
                ? {
                    status: "fresh" as const,
                    poolId,
                    chainId: 8453,
                    poolAddress:
                      poolId === "scale-equalizer-weth-fame"
                        ? "0x0db3a3228520fc31162c24f1b47177255cc1b82e"
                        : "0x3e2cab55bebf41719148b4e6b63f6644b18ae49c",
                    token0: WETH,
                    token1: FAME,
                    reserve0: "1000000000000000000",
                    reserve1: "1000000000000000000000000000000000000",
                    k: "1000000000000000000000000000000000000000000000000000000",
                    observedThroughBlock: 124,
                    lastReserveChangeBlock: 123,
                    source: "sync-event" as const,
                    quoteModel: "constant-product-reserves" as const,
                    maxFreshnessBlocks: 120,
                  }
                : {
                    status: "unknown" as const,
                    requested: { poolId },
                    reason: "unit-test",
                  },
            ),
          };
        },
      },
    });
    const row = rows[0];
    assert.ok(row);

    assert.equal(row.mode, "indexed");
    assert.ok((row.indexedPoolState?.statusCounts.fresh ?? 0) > 0);
    assert.match(row.quoteContext ?? "", /^indexed:8453:125:/);
  });

  it("fails indexed mode clearly without a current block source", async () => {
    const entry = FAME_ROUTE_CORPUS.find(
      (candidate) => candidate.id === "weth-fame-small-direct",
    );
    assert.ok(entry);

    await assert.rejects(
      runIndexedRouteLab([entry], {
        poolStateClient: {
          async fetchPoolStates() {
            throw new Error("should not fetch without current block");
          },
        },
      }),
      /currentBlock|FAME_POOL_STATE_CURRENT_BLOCK|BASE_RPC_URL/,
    );
  });

  it("renders route-lab markdown without executable payloads", async () => {
    const markdown = formatRouteLabMarkdown(await runSnapshotRouteLab());

    assert.match(markdown, /# FAME Swap Route Lab/);
    assert.match(markdown, /### Optimizer/);
    assert.match(markdown, /Selected algorithm/);
    assert.match(markdown, /Algorithm/);
    assert.match(markdown, /### Edge Matrix/);
    assert.match(markdown, /### Protocol Coverage/);
    assert.match(markdown, /WETH->USDC/);
    assert.doesNotMatch(markdown, /calldata/i);
    assert.doesNotMatch(markdown, /private/i);
    assert.doesNotMatch(markdown, /0x[a-fA-F0-9]{96,}/);
  });

  it("renders route-lab markdown without provider URLs from diagnostics", () => {
    const rows: FameRouteLabRow[] = [
      {
        mode: "live",
        id: "redaction-check",
        pair: "USDC->FAME",
        amountIn: "1000000",
        expectedStatus: "ready",
        status: "quote_adapter_failure",
        message: "HTTP request failed.\nURL: https://example.invalid/secret",
        selectedPools: [],
        quoteContext: null,
        feeBreakdown: {
          routerFeeAmount: null,
          routerFeePpm: null,
          venueFeesIncluded: null,
          maxLegMarketImpactBps: null,
          computablePriceImpactLegs: null,
        },
        rejectedCandidates: [
          {
            candidateId: "candidate",
            reason: "adapter_failure",
            message:
              'HTTP request failed.\nURL: https://example.invalid/secret\nRequest body: {"method":"eth_blockNumber"}',
          },
        ],
        candidateGenerationDiagnostics: [
          {
            reason: "candidate_work_budget_exceeded",
            detail: "Request body: secret\nhttps://example.invalid/secret",
          },
        ],
        optimizer: null,
        indexedPoolState: null,
        edgeMatrix: [
          {
            chainId: 8453,
            tokenIn: USDC,
            tokenOut: FAME,
            tokenInSymbol: "USDC",
            tokenOutSymbol: "FAME",
            venue: "Any",
            protocolVariant: "test",
            poolId: null,
            target: null,
            status: "missing",
            reasonCategory: "missing_edge",
            reason:
              "HTTP request failed.\nURL: https://example.invalid/secret\n0x" +
              "a".repeat(192),
            candidateIds: [],
          },
        ],
        protocolCoverage: [
          {
            chainId: 8453,
            tokenIn: USDC,
            tokenOut: FAME,
            tokenInSymbol: "USDC",
            tokenOutSymbol: "FAME",
            venue: "Any",
            protocolVariant: "test",
            poolId: null,
            target: null,
            edgeStatus: "missing",
            reasonCategory: "missing_edge",
            attribution: "missing_edge",
            quote: {
              status: "unavailable",
              source: "https://example.invalid/secret",
              reason: "Request body: secret\nhttps://example.invalid/secret",
            },
            prePrice: {
              status: "unavailable",
              source: "test",
              reason: "0x" + "a".repeat(192),
            },
            postPrice: {
              status: "unavailable",
              source: "test",
              reason: "private key hidden",
            },
            marketImpact: {
              status: "available",
              source: "test",
              value: "0x" + "a".repeat(192),
            },
            activeLiquidity: {
              status: "unavailable",
              source: "test",
              reason: "URL: https://example.invalid/secret",
            },
            routeSimulation: {
              status: "unavailable",
              source: "test",
              reason: "signer secret",
            },
            reason:
              "HTTP request failed.\nURL: https://example.invalid/secret\n0x" +
              "a".repeat(192),
            candidateIds: [],
          },
        ],
        simulation: {
          status: "failed",
          account: "0x0000...0abc",
          message:
            "Execution reverted.\nURL: https://example.invalid/secret\n0x" +
            "a".repeat(192),
        },
        suggestedContractTodo:
          "URL: https://example.invalid/secret\nhex 0x" + "a".repeat(192),
      },
    ];

    const markdown = formatRouteLabMarkdown(rows);

    assert.doesNotMatch(markdown, /https?:\/\//);
    assert.doesNotMatch(markdown, /secret|Request body/);
    assert.doesNotMatch(markdown, /0x[a-fA-F0-9]{96,}/);
  });
});
