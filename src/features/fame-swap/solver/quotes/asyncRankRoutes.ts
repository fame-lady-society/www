import type { FameRouteCandidate } from "../graph/routePlan";
import { DEFAULT_FAME_ROUTE_CANDIDATE_BUDGETS } from "../graph/candidates";
import type {
  FameAsyncQuoteAdapter,
  FameCandidateRejection,
  FameLegQuote,
} from "./adapters";
import type { FameQuoteContext } from "./quoteContext";
import type {
  FameQuotedRoutePlan,
  FameRouteFeeBreakdown,
  FameRouteMarketImpactSummary,
  FameRouteRankingResult,
} from "./rankRoutes";
import {
  addBalance,
  balanceOf,
  legMinAmountOut,
  maxLegMarketImpactBps,
  normalizedAddress,
  quoteFailureOnly,
  routeExecutionPriceX18,
  routerFee,
  spendAmount,
  subtractBalance,
} from "./routeMath";

const DEFAULT_MAX_CONCURRENT_CANDIDATE_QUOTES = 4;
export const DEFAULT_MAX_ASYNC_ROUTE_QUOTE_CALLS =
  DEFAULT_FAME_ROUTE_CANDIDATE_BUDGETS.maxCandidates *
  DEFAULT_FAME_ROUTE_CANDIDATE_BUDGETS.maxSimplePathLegs;

interface QuoteCallBudget {
  used: number;
  max: number;
  exhausted: boolean;
}

function warningPriority(rejection: FameCandidateRejection): number {
  return rejection.reason === "adapter_failure" ? 0 : 1;
}

function warningMessages(
  rejectedCandidates: readonly FameCandidateRejection[],
): string[] {
  return rejectedCandidates
    .filter(
      (rejection) =>
        rejection.reason === "adapter_failure" ||
        rejection.reason === "no_quote_evidence",
    )
    .slice()
    .sort(
      (left, right) =>
        warningPriority(left) - warningPriority(right) ||
        left.candidateId.localeCompare(right.candidateId),
    )
    .slice(0, 3)
    .map((rejection) => rejection.message);
}

function marketImpactSummary(
  amountIn: bigint,
  grossAmountOut: bigint,
  legQuotes: readonly FameLegQuote[],
): FameRouteMarketImpactSummary {
  return {
    routeExecutionPriceX18: routeExecutionPriceX18(grossAmountOut, amountIn),
    maxLegMarketImpactBps: maxLegMarketImpactBps(legQuotes),
    computableLegs: legQuotes.filter((quote) => quote.priceImpact).length,
  };
}

export async function quoteRouteCandidateAsync(
  candidate: FameRouteCandidate,
  amountIn: bigint,
  feePpm: bigint,
  slippageBps: number,
  adapter: FameAsyncQuoteAdapter,
  quoteContext?: FameQuoteContext,
  quoteCallBudget?: QuoteCallBudget,
): Promise<FameQuotedRoutePlan | FameCandidateRejection> {
  const balances = new Map<string, bigint>([
    [normalizedAddress(candidate.tokenIn), amountIn],
  ]);
  const legQuotes: FameLegQuote[] = [];

  for (let index = 0; index < candidate.legs.length; index += 1) {
    const leg = candidate.legs[index];
    const spend = spendAmount(candidate, index, amountIn, balances);
    if (spend <= 0n) {
      return {
        candidateId: candidate.id,
        reason: "unsafe_output",
        message: `${leg.edge.poolId} has no route-local input to spend.`,
        failedLegIndex: index,
        failedPoolId: leg.edge.poolId,
        failedAmountIn: spend,
      };
    }

    if (!subtractBalance(balances, leg.edge.tokenIn, spend)) {
      return {
        candidateId: candidate.id,
        reason: "unsafe_output",
        message: `${leg.edge.poolId} attempted to spend more input than the route holds.`,
        failedLegIndex: index,
        failedPoolId: leg.edge.poolId,
        failedAmountIn: spend,
      };
    }

    if (quoteCallBudget && quoteCallBudget.used >= quoteCallBudget.max) {
      quoteCallBudget.exhausted = true;
      return {
        candidateId: candidate.id,
        reason: "no_quote_evidence",
        message: `FAME route quote-call budget ${quoteCallBudget.max.toString()} was exhausted before ${leg.edge.poolId}.`,
        failedLegIndex: index,
        failedPoolId: leg.edge.poolId,
        failedAmountIn: spend,
      };
    }
    if (quoteCallBudget) quoteCallBudget.used += 1;

    const quote = await adapter.quoteEdge({
      edge: leg.edge,
      amountIn: spend,
      context: quoteContext,
    });
    if (quote.status === "failed") {
      return {
        candidateId: candidate.id,
        reason: quote.reason,
        message: quote.message,
        failedLegIndex: index,
        failedPoolId: leg.edge.poolId,
        failedAmountIn: spend,
      };
    }

    addBalance(balances, leg.edge.tokenOut, quote.amountOut);
    legQuotes.push({
      poolId: leg.edge.poolId,
      tokenIn: leg.edge.tokenIn,
      tokenOut: leg.edge.tokenOut,
      venue: leg.edge.venue,
      amountIn: spend,
      amountOut: quote.amountOut,
      minAmountOut: legMinAmountOut(quote.amountOut, slippageBps),
      fee: quote.fee,
      feeAmount: null,
      feeIncludedInQuote: true,
      evidence: quote.evidence,
      quoteContext: quote.context ?? quoteContext,
      priceImpact: quote.priceImpact,
      protocolEvidence: quote.protocolEvidence,
    });
  }

  const grossAmountOut = balanceOf(balances, candidate.tokenOut);
  if (grossAmountOut <= 0n) {
    return {
      candidateId: candidate.id,
      reason: "unsafe_output",
      message: "Candidate produced no output token.",
    };
  }

  const routerFeeAmount = routerFee(grossAmountOut, feePpm);
  const netAmountOut = grossAmountOut - routerFeeAmount;
  const protectedAmountOut = legMinAmountOut(netAmountOut, slippageBps);
  if (protectedAmountOut <= 0n) {
    return {
      candidateId: candidate.id,
      reason: "unsafe_output",
      message: "Candidate protected output rounds to zero.",
    };
  }

  const marketImpact = marketImpactSummary(amountIn, grossAmountOut, legQuotes);
  const feeBreakdown: FameRouteFeeBreakdown = {
    routerFeePpm: feePpm,
    routerFeeAmount,
    venueFeesIncluded: true,
    legs: legQuotes,
    marketImpact,
  };

  return {
    candidate,
    quoteContext,
    legQuotes,
    grossAmountOut,
    routerFeeAmount,
    netAmountOut,
    protectedAmountOut,
    feeBreakdown,
    marketImpact,
    warnings: [],
  };
}

export async function rankRouteCandidatesAsync(options: {
  candidates: readonly FameRouteCandidate[];
  amountIn: bigint;
  feePpm: bigint;
  slippageBps: number;
  adapter: FameAsyncQuoteAdapter;
  quoteContext?: FameQuoteContext;
  maxConcurrentCandidates?: number;
  maxQuoteCalls?: number;
}): Promise<FameRouteRankingResult> {
  const plans: FameQuotedRoutePlan[] = [];
  const rejectedCandidates: FameCandidateRejection[] = [];
  const quoteContext = options.quoteContext ?? options.adapter.quoteContext;
  const maxConcurrentCandidates = Math.max(
    1,
    Math.min(
      options.maxConcurrentCandidates ??
        DEFAULT_MAX_CONCURRENT_CANDIDATE_QUOTES,
      options.candidates.length || 1,
    ),
  );
  const quoteCallBudget: QuoteCallBudget = {
    used: 0,
    max: Math.max(
      1,
      Math.min(
        options.maxQuoteCalls ?? DEFAULT_MAX_ASYNC_ROUTE_QUOTE_CALLS,
        DEFAULT_MAX_ASYNC_ROUTE_QUOTE_CALLS,
      ),
    ),
    exhausted: false,
  };
  const results = new Array<FameQuotedRoutePlan | FameCandidateRejection>(
    options.candidates.length,
  );
  let nextIndex = 0;

  async function worker() {
    for (;;) {
      const index = nextIndex;
      nextIndex += 1;
      const candidate = options.candidates[index];
      if (!candidate) return;

      results[index] = await quoteRouteCandidateAsync(
        candidate,
        options.amountIn,
        options.feePpm,
        options.slippageBps,
        options.adapter,
        quoteContext,
        quoteCallBudget,
      );
    }
  }

  await Promise.all(
    Array.from({ length: maxConcurrentCandidates }, () => worker()),
  );

  for (const result of results) {
    if (!result) continue;
    if ("candidate" in result) {
      plans.push(result);
    } else {
      rejectedCandidates.push(result);
    }
  }

  if (quoteCallBudget.exhausted) {
    return {
      status: "quote_adapter_failure",
      rejectedCandidates,
    };
  }

  if (plans.length === 0) {
    return {
      status: quoteFailureOnly(rejectedCandidates)
        ? "quote_adapter_failure"
        : "no_safe_route",
      rejectedCandidates,
    };
  }

  plans.sort((left, right) => {
    if (left.protectedAmountOut !== right.protectedAmountOut) {
      return left.protectedAmountOut > right.protectedAmountOut ? -1 : 1;
    }
    if (left.candidate.legs.length !== right.candidate.legs.length) {
      return left.candidate.legs.length - right.candidate.legs.length;
    }
    return left.candidate.id.localeCompare(right.candidate.id);
  });

  const selected = plans[0];
  return {
    status: "selected",
    plan: {
      ...selected,
      warnings: warningMessages(rejectedCandidates),
    },
    rejectedCandidates,
  };
}
