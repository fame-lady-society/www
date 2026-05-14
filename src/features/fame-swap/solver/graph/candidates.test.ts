import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FAME, NATIVE_ETH, USDC, WETH } from "../../tokens";
import { famePoolEdges } from "../poolUniverse";
import { buildFamePoolGraph } from "./buildGraph";
import { routeCandidatesForPair } from "./candidates";

function poolPath(candidate: { legs: Array<{ edge: { poolId: string } }> }) {
  return candidate.legs.map((leg) => leg.edge.poolId);
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
    const direct = candidates.filter((candidate) => candidate.kind === "single_path");
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
