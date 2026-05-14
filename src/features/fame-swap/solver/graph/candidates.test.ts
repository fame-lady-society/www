import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FAME_SWAP_ARTIFACT_MANIFEST } from "../../artifacts/manifest";
import { FAME, NATIVE_ETH, USDC, WETH } from "../../tokens";
import { famePoolEdges, type FamePoolEdge } from "../poolUniverse";
import { buildFamePoolGraph } from "./buildGraph";
import { routeCandidatesForPair } from "./candidates";

function poolPath(candidate: { legs: Array<{ edge: { poolId: string } }> }) {
  return candidate.legs.map((leg) => leg.edge.poolId);
}

function connectorEdge(
  tokenIn: typeof USDC | typeof WETH,
  tokenOut: typeof USDC | typeof WETH,
): FamePoolEdge {
  return clonedEdge({
    id: `test-${tokenIn.toLowerCase()}-${tokenOut.toLowerCase()}`,
    poolId: "test-usdc-weth",
    tokenIn,
    tokenOut,
    manifestReady: true,
  });
}

function clonedEdge(overrides: Partial<FamePoolEdge>): FamePoolEdge {
  const source = famePoolEdges().find(
    (edge) => edge.poolId === "scale-equalizer-weth-fame",
  );
  assert.ok(source);
  return {
    ...source,
    ...overrides,
  };
}

describe("FAME route candidate graph", () => {
  it("includes the existing FAME to USDC basedflick/ZORA family", () => {
    const { candidates } = routeCandidatesForPair(FAME, USDC);
    const paths = candidates.map(poolPath);

    assert.ok(
      paths.some(
        (path) =>
          path.join(">") ===
          [
            "slipstream-basedflick-fame",
            "uniswap-v4-basedflick-zora",
            "uniswap-v3-zora-usdc",
          ].join(">"),
      ),
    );
  });

  it("includes direct and split WETH to FAME candidates", () => {
    const { candidates } = routeCandidatesForPair(WETH, FAME);
    const direct = candidates.filter(
      (candidate) => candidate.kind === "single_path",
    );
    const split = candidates.filter((candidate) => candidate.kind === "split");

    assert.ok(
      direct.some((candidate) =>
        poolPath(candidate).includes("scale-equalizer-weth-fame"),
      ),
    );
    assert.ok(
      direct.some((candidate) =>
        poolPath(candidate).includes("uniswap-v2-fame-direct"),
      ),
    );
    assert.ok(
      split.some(
        (candidate) =>
          poolPath(candidate).includes("scale-equalizer-weth-fame") &&
          poolPath(candidate).includes("uniswap-v2-fame-direct"),
      ),
    );
  });

  it("includes connector routes that were absent from original pinned artifacts", () => {
    const { candidates } = routeCandidatesForPair(USDC, FAME);
    const originalArtifactIds = new Set<string>(
      FAME_SWAP_ARTIFACT_MANIFEST.routeArtifactIds,
    );

    assert.ok(
      candidates.some(
        (candidate) =>
          !originalArtifactIds.has(candidate.id) &&
          poolPath(candidate).join(">") ===
            [
              "uniswap-v3-zora-usdc",
              "uniswap-v3-zora-weth",
              "scale-equalizer-weth-fame",
            ].join(">"),
      ),
    );
  });

  it("can traverse an injected reviewed WETH/USDC connector internally", () => {
    const graph = buildFamePoolGraph([
      ...famePoolEdges(),
      connectorEdge(USDC, WETH),
      connectorEdge(WETH, USDC),
    ]);
    const { candidates } = routeCandidatesForPair(USDC, FAME, graph);
    const unsupported = routeCandidatesForPair(USDC, WETH, graph);

    assert.ok(
      candidates.some(
        (candidate) =>
          poolPath(candidate).includes("test-usdc-weth") &&
          poolPath(candidate).some((poolId) => poolId.endsWith("weth-fame")),
      ),
    );
    assert.equal(unsupported.candidates.length, 0);
    assert.equal(unsupported.rejected[0]?.reason, "unsupported_pair");
  });

  it("includes manifest-ready Slipstream2 edges in the executable graph", () => {
    const executableGraph = buildFamePoolGraph();
    const diagnosticGraph = buildFamePoolGraph(famePoolEdges(), {
      includeManifestDisabled: true,
    });

    assert.ok(
      executableGraph.edges.some((edge) =>
        edge.poolId.startsWith("slipstream2-"),
      ),
    );
    assert.ok(
      diagnosticGraph.edges.some((edge) =>
        edge.poolId.startsWith("slipstream2-"),
      ),
    );
  });

  it("refuses disabled edges even when given a diagnostic graph", () => {
    const graph = buildFamePoolGraph(
      [
        ...famePoolEdges(),
        clonedEdge({
          id: "disabled-direct-usdc-fame",
          poolId: "disabled-direct-usdc-fame",
          tokenIn: USDC,
          tokenOut: FAME,
          manifestReady: false,
        }),
      ],
      { includeManifestDisabled: true },
    );
    const { candidates } = routeCandidatesForPair(USDC, FAME, graph);

    assert.equal(
      candidates.some((candidate) =>
        poolPath(candidate).includes("disabled-direct-usdc-fame"),
      ),
      false,
    );
    assert.ok(
      candidates.every((candidate) =>
        candidate.legs.every((leg) => leg.edge.manifestReady),
      ),
    );
  });

  it("keeps simple paths within the default depth budget", () => {
    const tokenA = "0x00000000000000000000000000000000000000a1";
    const tokenB = "0x00000000000000000000000000000000000000b2";
    const tokenC = "0x00000000000000000000000000000000000000c3";
    const graph = buildFamePoolGraph([
      ...famePoolEdges(),
      clonedEdge({
        id: "depth-usdc-a",
        poolId: "depth-usdc-a",
        tokenIn: USDC,
        tokenOut: tokenA,
        manifestReady: true,
      }),
      clonedEdge({
        id: "depth-a-b",
        poolId: "depth-a-b",
        tokenIn: tokenA,
        tokenOut: tokenB,
        manifestReady: true,
      }),
      clonedEdge({
        id: "depth-b-c",
        poolId: "depth-b-c",
        tokenIn: tokenB,
        tokenOut: tokenC,
        manifestReady: true,
      }),
      clonedEdge({
        id: "depth-c-fame",
        poolId: "depth-c-fame",
        tokenIn: tokenC,
        tokenOut: FAME,
        manifestReady: true,
      }),
    ]);
    const { candidates } = routeCandidatesForPair(USDC, FAME, graph);

    assert.equal(
      candidates.some((candidate) =>
        poolPath(candidate).includes("depth-c-fame"),
      ),
      false,
    );
  });

  it("prevents repeated-token cycles in connector paths", () => {
    const graph = buildFamePoolGraph([
      ...famePoolEdges(),
      connectorEdge(USDC, WETH),
      connectorEdge(WETH, USDC),
    ]);
    const { candidates } = routeCandidatesForPair(USDC, FAME, graph);

    assert.equal(
      candidates.some((candidate) => {
        const path = poolPath(candidate);
        return (
          path.includes("test-usdc-weth") &&
          path.filter((poolId) => poolId === "test-usdc-weth").length > 1
        );
      }),
      false,
    );
  });

  it("includes USDC split-then-merge candidates through frxUSD", () => {
    const { candidates } = routeCandidatesForPair(USDC, FAME);
    const splitMerge = candidates.filter(
      (candidate) => candidate.kind === "split_merge",
    );

    assert.ok(
      splitMerge.some((candidate) => {
        const path = poolPath(candidate);
        return (
          path.includes("scale-equalizer-usdc-frxusd") &&
          path.includes("slipstream-usdc-frxusd") &&
          path.includes("scale-equalizer-frxusd-fame")
        );
      }),
    );
  });

  it("keeps native ETH routes distinct from WETH routes", () => {
    const { candidates } = routeCandidatesForPair(NATIVE_ETH, FAME);

    assert.ok(
      candidates.some((candidate) =>
        poolPath(candidate).includes("uniswap-v4-zora-eth"),
      ),
    );
    assert.ok(
      candidates.every((candidate) =>
        candidate.legs.every(
          (leg) =>
            leg.edge.tokenIn.toLowerCase() !== WETH.toLowerCase() &&
            leg.edge.tokenOut.toLowerCase() !== WETH.toLowerCase(),
        ),
      ),
    );
  });

  it("keeps FAME to native ETH routes distinct from WETH connector routes", () => {
    const { candidates } = routeCandidatesForPair(FAME, NATIVE_ETH);

    assert.ok(
      candidates.every((candidate) =>
        candidate.legs.every(
          (leg) =>
            leg.edge.tokenIn.toLowerCase() !== WETH.toLowerCase() &&
            leg.edge.tokenOut.toLowerCase() !== WETH.toLowerCase(),
        ),
      ),
    );
  });

  it("respects the candidate count budget exactly", () => {
    const result = routeCandidatesForPair(USDC, FAME, buildFamePoolGraph(), {
      budgets: {
        maxCandidates: 2,
        maxSplitCandidates: 40,
        maxWorkUnits: 1_000,
      },
    });

    assert.equal(result.candidates.length, 2);
    assert.ok(
      result.rejected.some(
        (rejection) => rejection.reason === "candidate_count_budget_exceeded",
      ),
    );
  });

  it("respects the split candidate budget exactly", () => {
    const result = routeCandidatesForPair(WETH, FAME, buildFamePoolGraph(), {
      budgets: {
        maxCandidates: 96,
        maxSplitCandidates: 2,
        maxWorkUnits: 1_000,
      },
    });

    assert.equal(
      result.candidates.filter((candidate) => candidate.kind === "split")
        .length,
      2,
    );
    assert.ok(
      result.rejected.some(
        (rejection) => rejection.reason === "split_candidate_budget_exceeded",
      ),
    );
  });

  it("emits a work-budget diagnostic when graph search is stopped early", () => {
    const result = routeCandidatesForPair(USDC, FAME, buildFamePoolGraph(), {
      budgets: {
        maxCandidates: 96,
        maxSplitCandidates: 40,
        maxWorkUnits: 1,
      },
    });

    assert.ok(
      result.rejected.some(
        (rejection) => rejection.reason === "candidate_work_budget_exceeded",
      ),
    );
  });

  it("rejects unsupported non-FAME pairs", () => {
    const result = routeCandidatesForPair(USDC, WETH);

    assert.equal(result.candidates.length, 0);
    assert.equal(result.rejected[0]?.reason, "unsupported_pair");
  });

  it("does not generate split-then-merge without the merge pool", () => {
    const graph = buildFamePoolGraph(
      famePoolEdges().filter(
        (edge) => edge.poolId !== "scale-equalizer-frxusd-fame",
      ),
    );
    const { candidates } = routeCandidatesForPair(USDC, FAME, graph);

    assert.equal(
      candidates.some((candidate) => candidate.kind === "split_merge"),
      false,
    );
  });
});
