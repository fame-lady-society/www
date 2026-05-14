import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatRouteLabMarkdown,
  runRouteLab,
  runSnapshotRouteLab,
  type FameRouteLabRow,
} from "./fame-swap-route-lab";
import { FAME_ROUTE_CORPUS } from "../src/features/fame-swap/solver/routeCorpus";

describe("FAME route lab", () => {
  it("replays the full recorded-state corpus with executable quote evidence", () => {
    const rows = runSnapshotRouteLab();

    assert.equal(rows.length, FAME_ROUTE_CORPUS.length);
    for (const row of rows) {
      assert.equal(row.mode, "recorded");
      assert.equal(row.status, row.expectedStatus, row.id);
      assert.equal(row.simulation.status, "not_requested", row.id);
      assert.match(row.quoteContext ?? "", /^recorded:base-v1-live-\d+:45884844$/);
      assert.ok(row.selectedPools.length > 0, row.id);
      assert.ok(row.feeBreakdown.routerFeeAmount !== null, row.id);
      assert.equal(row.feeBreakdown.venueFeesIncluded, true, row.id);
      assert.ok(
        (row.feeBreakdown.computablePriceImpactLegs ?? 0) > 0,
        row.id,
      );
      assert.ok(row.suggestedContractTodo?.includes(row.id), row.id);
    }
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
              "HTTP request failed.\nURL: https://example.invalid/secret\nRequest body: {\"method\":\"eth_blockNumber\"}",
          },
        ],
        simulation: {
          status: "failed",
          account: "0x0000000000000000000000000000000000000abc",
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
