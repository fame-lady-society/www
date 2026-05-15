import type { FameAsyncQuoteAdapter } from "../quotes/adapters";
import { quoteRouteCandidateAsync } from "../quotes/asyncRankRoutes";
import type { FameQuotedRoutePlan } from "../quotes/rankRoutes";
import { materializeOptimizerTemplate } from "./materialize";
import {
  consumeOptimizerTrial,
  FameOptimizerBudgetExceededError,
  optimizerTimedOut,
} from "./runContext";
import { templatePoolIds } from "./templates";
import type {
  FameAllocationTrialEvidence,
  FameOptimizerRunContext,
  FameOptimizerRouteTemplate,
} from "./types";

export interface FameEvaluatedAllocationTrial {
  evidence: FameAllocationTrialEvidence;
  plan: FameQuotedRoutePlan | null;
}

function marginBps(
  output: bigint,
  baseline: bigint | null,
): number | null {
  if (baseline === null || baseline <= 0n || output <= baseline) return null;
  return Number(((output - baseline) * 10_000n) / baseline);
}

function branchQuotes(
  template: FameOptimizerRouteTemplate,
  plan: FameQuotedRoutePlan,
) {
  const start = template.prefix?.length ?? 0;
  return plan.legQuotes.slice(start, start + 2);
}

function branchInputs(
  template: FameOptimizerRouteTemplate,
  plan: FameQuotedRoutePlan,
): string[] {
  return branchQuotes(template, plan).map((quote) => quote.amountIn.toString());
}

function branchOutputs(
  template: FameOptimizerRouteTemplate,
  plan: FameQuotedRoutePlan,
): string[] {
  return branchQuotes(template, plan).map((quote) =>
    quote.amountOut.toString(),
  );
}

export async function evaluateAllocationTrial(options: {
  template: FameOptimizerRouteTemplate;
  allocationBps: number | null;
  amountIn: bigint;
  feePpm: bigint;
  slippageBps: number;
  adapter: FameAsyncQuoteAdapter;
  run: FameOptimizerRunContext;
  baselineProtectedAmountOut: bigint | null;
}): Promise<FameEvaluatedAllocationTrial> {
  if (optimizerTimedOut(options.run)) {
    options.run.stats.timeout = true;
    options.run.stats.fallbackReason = "timeout";
    return {
      plan: null,
      evidence: {
        templateId: options.template.id,
        allocationBps: options.allocationBps,
        status: "budget_exhausted",
        reason: "Optimizer timeout elapsed before this trial could run.",
        poolIds: templatePoolIds(options.template),
      },
    };
  }

  try {
    consumeOptimizerTrial(options.run);
    const candidate = materializeOptimizerTemplate(
      options.template,
      options.allocationBps,
    );
    const result = await quoteRouteCandidateAsync(
      candidate,
      options.amountIn,
      options.feePpm,
      options.slippageBps,
      options.adapter,
      options.adapter.quoteContext ?? options.run.quoteContext,
    );

    if (!("candidate" in result)) {
      const budgetExhausted =
        result.message.includes("budget") ||
        result.message.includes("Budget");
      return {
        plan: null,
        evidence: {
          templateId: options.template.id,
          allocationBps: options.allocationBps,
          status: budgetExhausted ? "budget_exhausted" : "quote_failed",
          reason: result.message,
          candidateId: candidate.id,
          poolIds: candidate.legs.map((leg) => leg.edge.poolId),
        },
      };
    }

    return {
      plan: result,
      evidence: {
        templateId: options.template.id,
        allocationBps: options.allocationBps,
        status: "rejected",
        reason: "Quoted successfully but did not win the optimizer objective.",
        candidateId: candidate.id,
        poolIds: candidate.legs.map((leg) => leg.edge.poolId),
        grossAmountOut: result.grossAmountOut,
        netAmountOut: result.netAmountOut,
        protectedAmountOut: result.protectedAmountOut,
        routerFeeAmount: result.routerFeeAmount,
        maxLegMarketImpactBps: result.marketImpact.maxLegMarketImpactBps,
        branchInputs: branchInputs(options.template, result),
        branchOutputs: branchOutputs(options.template, result),
        winningMarginBps: marginBps(
          result.protectedAmountOut,
          options.baselineProtectedAmountOut,
        ),
      },
    };
  } catch (error) {
    const budgetExhausted = error instanceof FameOptimizerBudgetExceededError;
    return {
      plan: null,
      evidence: {
        templateId: options.template.id,
        allocationBps: options.allocationBps,
        status: budgetExhausted ? "budget_exhausted" : "unsupported_shape",
        reason:
          error instanceof Error
            ? error.message
            : "Optimizer trial could not be materialized.",
        poolIds: templatePoolIds(options.template),
      },
    };
  }
}
