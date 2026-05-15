import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FAME, USDC, WETH } from "../../tokens";
import { quoteRouteCandidate } from "../quotes/rankRoutes";
import { spendAmount, normalizedAddress } from "../quotes/routeMath";
import { materializeOptimizerTemplate } from "./materialize";
import { routeOptimizerTemplatesForPair } from "./templates";

describe("FAME optimizer template materialization", () => {
  it("materializes a direct split with Exact then All remainder", () => {
    const template = routeOptimizerTemplatesForPair(WETH, FAME).templates.find(
      (entry) => entry.kind === "direct_split",
    );
    assert.ok(template);

    const candidate = materializeOptimizerTemplate(template, 3_750);
    assert.equal(candidate.kind, "split");
    assert.equal(candidate.legs[0]?.amountMode, "Exact");
    assert.equal(candidate.legs[0]?.allocationBps, 3_750);
    assert.equal(candidate.legs[1]?.amountMode, "All");
    assert.equal(candidate.legs[1]?.allocationBps, 6_250);

    const balances = new Map([[normalizedAddress(WETH), 1_000n]]);
    assert.equal(spendAmount(candidate, 0, 1_000n, balances), 375n);
  });

  it("materializes split-merge suffixes as All from accumulated intermediate balance", () => {
    const template = routeOptimizerTemplatesForPair(USDC, FAME).templates.find(
      (entry) =>
        entry.kind === "split_merge" &&
        entry.branches.some(
          (branch) => branch.edge.poolId === "scale-equalizer-usdc-frxusd",
        ) &&
        entry.branches.some(
          (branch) => branch.edge.poolId === "slipstream-usdc-frxusd",
        ),
    );
    assert.ok(template);

    const candidate = materializeOptimizerTemplate(template, 6_250);
    assert.equal(candidate.kind, "split_merge");
    assert.deepEqual(
      candidate.legs.map((leg) => leg.amountMode),
      ["Exact", "All", "All"],
    );

    const quoted = quoteRouteCandidate(candidate, 800_000n, 2_222n, 100, {
      quoteEdge(request) {
        return {
          status: "quoted",
          amountIn: request.amountIn,
          amountOut: request.amountIn * 2n,
          capacityIn: null,
          fee: request.edge.fee,
          evidence: "unit test proportional quote",
        };
      },
    });
    assert.ok("candidate" in quoted);
    if ("candidate" in quoted) {
      assert.equal(quoted.legQuotes[0]?.amountIn, 500_000n);
      assert.equal(quoted.legQuotes[1]?.amountIn, 300_000n);
      assert.equal(
        quoted.legQuotes[2]?.amountIn,
        (quoted.legQuotes[0]?.amountOut ?? 0n) +
          (quoted.legQuotes[1]?.amountOut ?? 0n),
      );
    }
  });

  it("materializes terminal splits against accumulated prefix output", () => {
    const template = routeOptimizerTemplatesForPair(USDC, FAME).templates.find(
      (entry) =>
        entry.kind === "terminal_split" &&
        entry.prefix?.some(
          (edge) => edge.poolId === "slipstream-usdc-weth-100",
        ) &&
        entry.branches.some(
          (branch) => branch.edge.poolId === "scale-equalizer-weth-fame",
        ) &&
        entry.branches.some(
          (branch) => branch.edge.poolId === "uniswap-v2-fame-direct",
        ),
    );
    assert.ok(template);

    const candidate = materializeOptimizerTemplate(template, 6_250);
    assert.equal(candidate.kind, "split_merge");
    assert.deepEqual(
      candidate.legs.map((leg) => leg.amountMode),
      ["Exact", "Exact", "All"],
    );

    const quoted = quoteRouteCandidate(candidate, 800_000n, 2_222n, 100, {
      quoteEdge(request) {
        return {
          status: "quoted",
          amountIn: request.amountIn,
          amountOut: request.amountIn * 2n,
          capacityIn: null,
          fee: request.edge.fee,
          evidence: "unit test proportional quote",
        };
      },
    });
    assert.ok("candidate" in quoted);
    if ("candidate" in quoted) {
      const prefixOutput = quoted.legQuotes[0]?.amountOut ?? 0n;
      assert.equal(
        quoted.legQuotes[1]?.amountIn,
        (prefixOutput * 6_250n) / 10_000n,
      );
      assert.equal(
        quoted.legQuotes[2]?.amountIn,
        prefixOutput - (quoted.legQuotes[1]?.amountIn ?? 0n),
      );
    }
  });

  it("materializes endpoint allocations without unsafe zero-spend legs", () => {
    const template = routeOptimizerTemplatesForPair(WETH, FAME).templates.find(
      (entry) => entry.kind === "direct_split",
    );
    assert.ok(template);

    const left = materializeOptimizerTemplate(template, 10_000);
    const right = materializeOptimizerTemplate(template, 0);

    assert.equal(left.kind, "single_path");
    assert.equal(right.kind, "single_path");
    assert.equal(left.legs.length, 1);
    assert.equal(right.legs.length, 1);
    assert.equal(left.legs[0]?.amountMode, "Exact");
    assert.equal(right.legs[0]?.amountMode, "Exact");
  });

  it("materializes N-way terminal splits as sequential Exact shares plus final All", () => {
    const template = routeOptimizerTemplatesForPair(FAME, USDC).templates.find(
      (entry) =>
        entry.kind === "terminal_split" &&
        entry.branches.length === 3 &&
        entry.prefix?.some(
          (edge) => edge.poolId === "scale-equalizer-weth-fame",
        ),
    );
    assert.ok(template);

    const candidate = materializeOptimizerTemplate(
      template,
      [5_000, 3_000, 2_000],
    );
    assert.equal(candidate.kind, "split_merge");
    assert.deepEqual(
      candidate.legs.map((leg) => leg.amountMode),
      ["Exact", "Exact", "Exact", "All"],
    );

    const quoted = quoteRouteCandidate(candidate, 9_000n, 2_222n, 100, {
      quoteEdge(request) {
        return {
          status: "quoted",
          amountIn: request.amountIn,
          amountOut: request.amountIn,
          capacityIn: null,
          fee: request.edge.fee,
          evidence: "unit test proportional quote",
        };
      },
    });
    assert.ok("candidate" in quoted);
    if ("candidate" in quoted) {
      assert.deepEqual(
        quoted.legQuotes.slice(1).map((quote) => quote.amountIn),
        [4_500n, 2_700n, 1_800n],
      );
    }
  });
});
