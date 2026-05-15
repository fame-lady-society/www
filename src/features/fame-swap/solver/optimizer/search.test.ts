import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FAME, USDC, WETH } from "../../tokens";
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
  it("uses adaptive two-way search on smooth unimodal split samples", async () => {
    const adapter: FameAsyncQuoteAdapter = {
      async quoteEdge(request) {
        const amount = request.amountIn;
        if (request.edge.poolId === "scale-equalizer-weth-fame") {
          return {
            status: "quoted",
            amountIn: amount,
            amountOut: amount * 1_000n - (amount * amount) / 20n,
            capacityIn: null,
            fee: request.edge.fee,
            evidence: "unit test smooth curve A",
          };
        }
        if (request.edge.poolId === "uniswap-v2-fame-direct") {
          return {
            status: "quoted",
            amountIn: amount,
            amountOut: amount * 940n - (amount * amount) / 20n,
            capacityIn: null,
            fee: request.edge.fee,
            evidence: "unit test smooth curve B",
          };
        }
        return {
          status: "failed",
          reason: "no_quote_evidence",
          message: `No unit test quote for ${request.edge.poolId}.`,
        };
      },
    };

    const result = await optimizeRouteAllocations({
      tokenIn: WETH,
      tokenOut: FAME,
      amountIn: 10_000n,
      feePpm,
      slippageBps,
      adapter,
    });

    assert.equal(result.status, "selected");
    if (result.status === "selected") {
      assert.equal(result.evidence.selectedAlgorithm, "adaptive_2way");
      assert.equal(result.evidence.selectedStopReason, "convergence");
      assert.ok(
        result.evidence.allocationTrials.some(
          (trial) => trial.algorithm === "adaptive_2way",
        ),
      );
    }
  });

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
      assert.equal(
        result.evidence.allocationTrials.some(
          (trial) => trial.algorithm === "adaptive_2way",
        ),
        false,
      );
      assert.ok(
        result.evidence.allocationTrials.some(
          (trial) => trial.stopReason === "quote_failure",
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

  it("evaluates 3+ branch coordinate descent within the trial budget", async () => {
    const adapter: FameAsyncQuoteAdapter = {
      async quoteEdge(request) {
        const multipliers: Record<string, bigint> = {
          "scale-equalizer-weth-fame": 1n,
          "uniswap-v2-fame-direct": 1n,
          "aerodrome-v2-usdc-weth": 98n,
          "slipstream-usdc-weth-100": 100n,
          "uniswap-v2-usdc-weth": 96n,
        };
        const multiplier = multipliers[request.edge.poolId];
        if (!multiplier) {
          return {
            status: "failed",
            reason: "no_quote_evidence",
            message: `No unit test quote for ${request.edge.poolId}.`,
          };
        }
        return {
          status: "quoted",
          amountIn: request.amountIn,
          amountOut: request.amountIn * multiplier,
          capacityIn: null,
          fee: request.edge.fee,
          evidence: "unit test coordinate descent quote",
        };
      },
    };

    const result = await optimizeRouteAllocations({
      tokenIn: FAME,
      tokenOut: USDC,
      amountIn: 9_000n,
      feePpm,
      slippageBps,
      adapter,
      budgets: {
        maxTemplates: 2,
        maxTrialsPerTemplate: 4,
        maxLogicalQuoteRequests: 80,
      },
    });

    assert.equal(result.status, "selected");
    assert.ok(
      result.evidence.allocationTrials.some(
        (trial) => trial.algorithm === "coordinate_descent",
      ),
    );
    assert.ok(result.evidence.quotePlanStats.allocationTrials <= 8);
    assert.ok(
      result.evidence.allocationTrials.some(
        (trial) => trial.allocationVectorBps?.length === 3,
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
        maxLogicalQuoteRequests: 35,
        maxUniqueExactQuoteReads: 35,
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
