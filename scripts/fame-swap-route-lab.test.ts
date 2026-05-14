import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatRouteLabMarkdown,
  runRouteLab,
  runSnapshotRouteLab,
  type FameRouteLabRow,
} from "./fame-swap-route-lab";
import { FAME_ROUTE_CORPUS } from "../src/features/fame-swap/solver/routeCorpus";
import { FAME, USDC, WETH } from "../src/features/fame-swap/tokens";

describe("FAME route lab", () => {
  it("replays the full recorded-state corpus with executable quote evidence", () => {
    const rows = runSnapshotRouteLab();

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

  it("includes reviewed connector statuses in route-lab JSON rows", () => {
    const rows = runSnapshotRouteLab();

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

  it("surfaces candidate generation budget diagnostics in JSON and markdown", () => {
    const [entry] = FAME_ROUTE_CORPUS;
    assert.ok(entry);
    const rows = runSnapshotRouteLab([entry], {
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

  it("keeps deterministic cap-profile failures explicit and non-executable", () => {
    const rows = runRouteLab();
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

  it("renders route-lab markdown without executable payloads", () => {
    const markdown = formatRouteLabMarkdown(runSnapshotRouteLab());

    assert.match(markdown, /# FAME Swap Route Lab/);
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
