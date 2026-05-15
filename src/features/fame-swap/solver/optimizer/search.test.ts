import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FAME, WETH } from "../../tokens";
import { createDeterministicQuoteAdapter } from "../quotes/deterministicAdapter";
import type { FameAsyncQuoteAdapter } from "../quotes/adapters";
import {
  FAME_OPTIMIZER_EXPECTED_NON_STATIC_SPLIT_BPS,
  FAME_OPTIMIZER_NON_STATIC_WETH_SPLIT_AMOUNT_IN,
} from "./fixtures";
import { optimizeRouteAllocations } from "./search";

const feePpm = 2_222n;
const slippageBps = 100;

describe("FAME route allocation optimizer", () => {
  it("selects a non-static WETH/FAME split allocation from refinement", async () => {
    const result = await optimizeRouteAllocations({
      tokenIn: WETH,
      tokenOut: FAME,
      amountIn: FAME_OPTIMIZER_NON_STATIC_WETH_SPLIT_AMOUNT_IN,
      feePpm,
      slippageBps,
      adapter: createDeterministicQuoteAdapter(),
    });

    assert.equal(result.status, "selected");
    if (result.status === "selected") {
      assert.equal(result.plan.candidate.kind, "split");
      assert.equal(
        result.evidence.selectedAllocationBps,
        FAME_OPTIMIZER_EXPECTED_NON_STATIC_SPLIT_BPS,
      );
      assert.ok(
        ![1_000, 2_500, 5_000, 7_500, 9_000].includes(
          result.evidence.selectedAllocationBps ?? -1,
        ),
      );
      assert.ok(
        result.evidence.allocationTrials.some(
          (trial) => trial.allocationBps === 6_500,
        ),
      );
      assert.ok(
        result.evidence.allocationTrials.some(
          (trial) => trial.allocationBps === 6_250,
        ),
      );
    }
  });

  it("keeps the simpler route when a split does not clear the win threshold", async () => {
    const adapter: FameAsyncQuoteAdapter = {
      async quoteEdge(request) {
        return {
          status: "quoted",
          amountIn: request.amountIn,
          amountOut: request.amountIn * 50n,
          capacityIn: null,
          fee: request.edge.fee,
          evidence: "unit test flat curve",
        };
      },
    };

    const result = await optimizeRouteAllocations({
      tokenIn: WETH,
      tokenOut: FAME,
      amountIn: 100_000_000_000_000n,
      feePpm,
      slippageBps,
      adapter,
    });

    assert.equal(result.status, "selected");
    if (result.status === "selected") {
      assert.equal(result.plan.candidate.kind, "single_path");
      assert.equal(result.evidence.selectedAllocationBps, null);
      assert.equal(result.evidence.objective.winningMarginBps, 0);
    }
  });

  it("records quote failures without suppressing other allocation trials", async () => {
    const base = createDeterministicQuoteAdapter();
    const adapter: FameAsyncQuoteAdapter = {
      async quoteEdge(request) {
        if (
          request.edge.poolId === "uniswap-v2-fame-direct" &&
          request.amountIn === 360_000_000_000_000n
        ) {
          return {
            status: "failed",
            reason: "adapter_failure",
            message: "Unit test quote failure.",
          };
        }
        return base.quoteEdge(request);
      },
    };

    const result = await optimizeRouteAllocations({
      tokenIn: WETH,
      tokenOut: FAME,
      amountIn: FAME_OPTIMIZER_NON_STATIC_WETH_SPLIT_AMOUNT_IN,
      feePpm,
      slippageBps,
      adapter,
    });

    assert.equal(result.status, "selected");
    assert.ok(
      result.evidence.allocationTrials.some(
        (trial) => trial.status === "quote_failed",
      ),
    );
    assert.ok(
      result.evidence.allocationTrials.some(
        (trial) => trial.status === "selected",
      ),
    );
  });

  it("falls back with budget evidence when the quote budget is exhausted", async () => {
    const result = await optimizeRouteAllocations({
      tokenIn: WETH,
      tokenOut: FAME,
      amountIn: FAME_OPTIMIZER_NON_STATIC_WETH_SPLIT_AMOUNT_IN,
      feePpm,
      slippageBps,
      adapter: createDeterministicQuoteAdapter(),
      budgets: {
        maxLogicalQuoteRequests: 1,
      },
    });

    assert.equal(result.status, "fallback_required");
    assert.equal(result.reason, "budget_exhausted");
    assert.ok(result.evidence.quotePlanStats.budgetExhaustions > 0);
    assert.ok(
      result.evidence.allocationTrials.some(
        (trial) => trial.status === "budget_exhausted",
      ),
    );
  });

  it("keeps an already quoted best plan when later validation exhausts budget", async () => {
    const result = await optimizeRouteAllocations({
      tokenIn: WETH,
      tokenOut: FAME,
      amountIn: FAME_OPTIMIZER_NON_STATIC_WETH_SPLIT_AMOUNT_IN,
      feePpm,
      slippageBps,
      adapter: createDeterministicQuoteAdapter(),
      budgets: {
        maxLogicalQuoteRequests: 20,
        maxUniqueExactQuoteReads: 20,
      },
    });

    assert.equal(result.status, "selected");
    assert.equal(result.evidence.fallbackReason, null);
    assert.equal(
      result.evidence.quotePlanStats.fallbackReason,
      "budget_exhausted",
    );
    assert.ok(result.evidence.quotePlanStats.budgetExhaustions > 0);
  });

});
