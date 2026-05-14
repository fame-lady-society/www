import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FAME, USDC, WETH } from "../../tokens";
import { famePoolEdges, type FamePoolEdge } from "../poolUniverse";
import { routeCandidatesForPair } from "./candidates";
import {
  buildFameRouteEdgeMatrix,
  buildFameRouteProtocolCoverage,
} from "./edgeMatrix";
import { emptyCapabilities } from "./routePlan";

function cloneWethUsdcEdge(overrides: Partial<FamePoolEdge> = {}): FamePoolEdge {
  const source = famePoolEdges().find(
    (edge) => edge.poolId === "scale-equalizer-weth-fame",
  );
  assert.ok(source);
  return {
    ...source,
    id: "test-weth-usdc-edge",
    poolId: "test-weth-usdc",
    tokenIn: WETH,
    tokenOut: USDC,
    manifestReady: true,
    ...overrides,
  };
}

describe("FAME route edge matrix", () => {
  it("marks selected, missing WETH/USDC, and disabled Slipstream2 edges", () => {
    const candidateSet = routeCandidatesForPair(USDC, FAME);
    const selectedCandidate = candidateSet.candidates[0];
    assert.ok(selectedCandidate);

    const rows = buildFameRouteEdgeMatrix({
      candidateSet,
      selectedCandidateId: selectedCandidate.id,
    });

    assert.ok(
      rows.some(
        (row) =>
          row.status === "selected" &&
          row.poolId === selectedCandidate.legs[0]?.edge.poolId,
      ),
    );
    assert.ok(
      rows.some(
        (row) =>
          row.status === "missing" &&
          row.tokenIn.toLowerCase() === WETH.toLowerCase() &&
          row.tokenOut.toLowerCase() === USDC.toLowerCase(),
      ),
    );
    assert.ok(
      rows.some(
        (row) =>
          row.status === "disabled" &&
          row.poolId?.startsWith("slipstream2-") &&
          /Slipstream2 quote support has not been validated/.test(row.reason),
      ),
    );
  });

  it("resolves a reviewed WETH/USDC connector as a normal edge instead of missing", () => {
    const reviewedWethUsdc = cloneWethUsdcEdge({
      id: "test-usdc-weth-edge",
      tokenIn: USDC,
      tokenOut: WETH,
    });
    const wethToFame = famePoolEdges().find(
      (edge) => edge.poolId === "scale-equalizer-weth-fame",
    );
    assert.ok(wethToFame);

    const rows = buildFameRouteEdgeMatrix({
      candidateSet: {
        candidates: [
          {
            id: "solver-single_path-test-usdc-weth--scale-equalizer-weth-fame",
            kind: "single_path",
            tokenIn: USDC,
            tokenOut: FAME,
            legs: [
              {
                edge: reviewedWethUsdc,
                amountMode: "Exact",
                allocationBps: null,
              },
              {
                edge: wethToFame,
                amountMode: "All",
                allocationBps: null,
              },
            ],
            capabilities: emptyCapabilities({ weth: true }),
            summary: "test-usdc-weth -> scale-equalizer-weth-fame",
          },
        ],
        rejected: [],
      },
      diagnosticEdges: [...famePoolEdges(), reviewedWethUsdc],
    });

    assert.equal(
      rows.some(
        (row) =>
          row.status === "missing" &&
          row.venue === "Solidly" &&
          row.tokenIn.toLowerCase() === USDC.toLowerCase() &&
          row.tokenOut.toLowerCase() === WETH.toLowerCase(),
      ),
      false,
    );
    assert.ok(
      rows.some(
        (row) =>
          row.status === "considered" &&
          row.poolId === reviewedWethUsdc.poolId,
      ),
    );
  });

  it("uses status precedence when a selected edge also has a rejection", () => {
    const candidateSet = routeCandidatesForPair(USDC, FAME);
    const selectedCandidate = candidateSet.candidates[0];
    assert.ok(selectedCandidate);

    const rows = buildFameRouteEdgeMatrix({
      candidateSet,
      selectedCandidateId: selectedCandidate.id,
      rejectedCandidates: [
        {
          candidateId: selectedCandidate.id,
          reason: "no_quote_evidence",
          message: "Raw RPC URL https://example.invalid should not leak.",
        },
      ],
    });

    const selectedRows = rows.filter((row) =>
      selectedCandidate.legs.some((leg) => leg.edge.poolId === row.poolId),
    );
    assert.ok(selectedRows.length > 0);
    assert.ok(selectedRows.every((row) => row.status === "selected"));
  });

  it("keeps quote adapter failures distinct from unsafe output rejections", () => {
    const candidateSet = routeCandidatesForPair(USDC, FAME);
    const [adapterFailure, unsafeOutput] = candidateSet.candidates;
    assert.ok(adapterFailure);
    assert.ok(unsafeOutput);

    const rows = buildFameRouteEdgeMatrix({
      candidateSet: {
        candidates: [adapterFailure, unsafeOutput],
        rejected: [],
      },
      rejectedCandidates: [
        {
          candidateId: adapterFailure.id,
          reason: "no_quote_evidence",
          message: "No quote evidence.",
        },
        {
          candidateId: unsafeOutput.id,
          reason: "amount_exceeds_capacity",
          message: "Amount exceeds capacity.",
        },
      ],
    });

    assert.ok(
      rows.some((row) => row.reasonCategory === "quote_adapter_failure"),
    );
    assert.ok(rows.some((row) => row.reasonCategory === "unsafe_output"));
  });

  it("sanitizes rejected edge reasons before JSON emission", () => {
    const candidateSet = routeCandidatesForPair(USDC, FAME);
    const [candidate] = candidateSet.candidates;
    assert.ok(candidate);

    const rows = buildFameRouteEdgeMatrix({
      candidateSet: {
        candidates: [candidate],
        rejected: [],
      },
      rejectedCandidates: [
        {
          candidateId: candidate.id,
          reason: "adapter_failure",
          message: [
            "Request body: { secret: 'abc' }",
            "calldata 0x" + "a".repeat(128),
            "wss://example.invalid/private",
          ].join("\n"),
        },
      ],
    });
    const json = JSON.stringify(rows);

    assert.doesNotMatch(json, /Request body|calldata|secret|wss:\/\//i);
    assert.doesNotMatch(json, /0x[a-fA-F0-9]{64,}/);
  });

  it("keeps parallel same-pair pools as separate rows", () => {
    const candidateSet = routeCandidatesForPair(USDC, FAME);
    const first = cloneWethUsdcEdge({
      id: "parallel-a",
      poolId: "parallel-a",
      manifestReady: false,
    });
    const second = cloneWethUsdcEdge({
      id: "parallel-b",
      poolId: "parallel-b",
      manifestReady: false,
    });

    const rows = buildFameRouteEdgeMatrix({
      candidateSet,
      diagnosticEdges: [...famePoolEdges(), first, second],
    });

    assert.ok(rows.some((row) => row.poolId === "parallel-a"));
    assert.ok(rows.some((row) => row.poolId === "parallel-b"));
  });

  it("builds protocol coverage for every edge matrix status", () => {
    const selectedEdge = cloneWethUsdcEdge({
      id: "coverage-selected",
      poolId: "coverage-selected",
      tokenIn: USDC,
      tokenOut: WETH,
    });
    const rejectedEdge = cloneWethUsdcEdge({
      id: "coverage-rejected",
      poolId: "coverage-rejected",
      tokenIn: USDC,
      tokenOut: WETH,
    });
    const consideredEdge = cloneWethUsdcEdge({
      id: "coverage-considered",
      poolId: "coverage-considered",
      tokenIn: USDC,
      tokenOut: WETH,
    });
    const selectedCandidate = {
      id: "coverage-selected-candidate",
      kind: "single_path" as const,
      tokenIn: USDC,
      tokenOut: WETH,
      legs: [{ edge: selectedEdge, amountMode: "Exact" as const, allocationBps: null }],
      capabilities: emptyCapabilities({ weth: true }),
      summary: "coverage-selected",
    };
    const rejectedCandidate = {
      id: "coverage-rejected-candidate",
      kind: "single_path" as const,
      tokenIn: USDC,
      tokenOut: WETH,
      legs: [{ edge: rejectedEdge, amountMode: "Exact" as const, allocationBps: null }],
      capabilities: emptyCapabilities({ weth: true }),
      summary: "coverage-rejected",
    };
    const consideredCandidate = {
      id: "coverage-considered-candidate",
      kind: "single_path" as const,
      tokenIn: USDC,
      tokenOut: WETH,
      legs: [{ edge: consideredEdge, amountMode: "Exact" as const, allocationBps: null }],
      capabilities: emptyCapabilities({ weth: true }),
      summary: "coverage-considered",
    };

    const rows = buildFameRouteEdgeMatrix({
      candidateSet: {
        candidates: [selectedCandidate, rejectedCandidate, consideredCandidate],
        rejected: [],
      },
      selectedCandidateId: selectedCandidate.id,
      rejectedCandidates: [
        {
          candidateId: rejectedCandidate.id,
          reason: "no_quote_evidence",
          message: "No quote evidence.",
          failedLegIndex: 0,
          failedPoolId: rejectedEdge.poolId,
          failedAmountIn: 123n,
        },
      ],
      diagnosticEdges: [
        ...famePoolEdges(),
        selectedEdge,
        rejectedEdge,
        consideredEdge,
      ],
    });
    const coverage = buildFameRouteProtocolCoverage({
      edgeMatrix: rows,
      selectedLegQuotes: [
        {
          poolId: selectedEdge.poolId,
          tokenIn: selectedEdge.tokenIn,
          tokenOut: selectedEdge.tokenOut,
          venue: selectedEdge.venue,
          amountIn: 123n,
          amountOut: 456n,
          minAmountOut: 400n,
          fee: selectedEdge.fee,
          feeAmount: null,
          feeIncludedInQuote: true,
          evidence: "unit quote evidence",
          protocolEvidence: {
            quote: { status: "available", source: "unit", value: "456" },
            prePrice: { status: "available", source: "unit", value: "1" },
            postPrice: {
              status: "unavailable",
              source: "unit",
              reason: "no post price",
            },
            marketImpact: { status: "available", source: "unit", value: "2" },
            activeLiquidity: {
              status: "available",
              source: "StateView.getLiquidity",
              value: "789",
            },
          },
        },
      ],
      rejectedCandidates: [
        {
          candidateId: rejectedCandidate.id,
          reason: "no_quote_evidence",
          message: "No quote evidence.",
          failedLegIndex: 0,
          failedPoolId: rejectedEdge.poolId,
          failedAmountIn: 123n,
        },
      ],
      simulation: {
        status: "not_requested",
        message: "Simulation not requested.",
      },
    });

    assert.equal(coverage.length, rows.length);
    assert.ok(
      coverage.some(
        (row) =>
          row.edgeStatus === "selected" &&
          row.attribution === "selected_leg" &&
          row.quote.status === "available" &&
          row.activeLiquidity.status === "available",
      ),
    );
    assert.ok(
      coverage.some(
        (row) =>
          row.edgeStatus === "rejected" &&
          row.attribution === "candidate_rejection",
      ),
    );
    assert.ok(
      coverage.some(
        (row) =>
          row.edgeStatus === "considered" &&
          row.attribution === "considered_candidate",
      ),
    );
    assert.ok(
      coverage.some(
        (row) =>
          row.edgeStatus === "disabled" && row.quote.status === "disabled",
      ),
    );
    assert.ok(
      coverage.some(
        (row) =>
          row.edgeStatus === "missing" && row.quote.status === "unavailable",
      ),
    );
  });
});
