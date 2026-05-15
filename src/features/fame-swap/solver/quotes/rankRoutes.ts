import type { FameRouteCandidate } from "../graph/routePlan";
import type {
  FameCandidateRejection,
  FameLegQuote,
  FameQuoteAdapter,
} from "./adapters";
import type { FameQuoteContext } from "./quoteContext";
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

export interface FameRouteMarketImpactSummary {
  routeExecutionPriceX18: bigint | null;
  maxLegMarketImpactBps: number | null;
  computableLegs: number;
}

export interface FameRouteFeeBreakdown {
  routerFeePpm: bigint;
  routerFeeAmount: bigint;
  venueFeesIncluded: boolean;
  legs: FameLegQuote[];
  marketImpact: FameRouteMarketImpactSummary;
}

export interface FameQuotedRoutePlan {
  candidate: FameRouteCandidate;
  quoteContext?: FameQuoteContext;
  legQuotes: FameLegQuote[];
  grossAmountOut: bigint;
  routerFeeAmount: bigint;
  netAmountOut: bigint;
  protectedAmountOut: bigint;
  feeBreakdown: FameRouteFeeBreakdown;
  marketImpact: FameRouteMarketImpactSummary;
  warnings: string[];
}

export type FameRouteRankingResult =
  | {
      status: "selected";
      plan: FameQuotedRoutePlan;
      rejectedCandidates: FameCandidateRejection[];
    }
  | {
      status: "no_safe_route" | "quote_adapter_failure";
      rejectedCandidates: FameCandidateRejection[];
    };

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

export function quoteRouteCandidate(
  candidate: FameRouteCandidate,
  amountIn: bigint,
  feePpm: bigint,
  slippageBps: number,
  adapter: FameQuoteAdapter,
  quoteContext?: FameQuoteContext,
): FameQuotedRoutePlan | FameCandidateRejection {
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

    const quote = adapter.quoteEdge({
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

  return {
    candidate,
    quoteContext,
    legQuotes,
    grossAmountOut,
    routerFeeAmount,
    netAmountOut,
    protectedAmountOut,
    feeBreakdown: {
      routerFeePpm: feePpm,
      routerFeeAmount,
      venueFeesIncluded: true,
      legs: legQuotes,
      marketImpact,
    },
    marketImpact,
    warnings: [],
  };
}

export function rankRouteCandidates(options: {
  candidates: readonly FameRouteCandidate[];
  amountIn: bigint;
  feePpm: bigint;
  slippageBps: number;
  adapter: FameQuoteAdapter;
  quoteContext?: FameQuoteContext;
}): FameRouteRankingResult {
  const plans: FameQuotedRoutePlan[] = [];
  const rejectedCandidates: FameCandidateRejection[] = [];

  for (const candidate of options.candidates) {
    const result = quoteRouteCandidate(
      candidate,
      options.amountIn,
      options.feePpm,
      options.slippageBps,
      options.adapter,
      options.quoteContext ?? options.adapter.quoteContext,
    );
    if ("candidate" in result) {
      plans.push(result);
    } else {
      rejectedCandidates.push(result);
    }
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
  const warningCandidates = rejectedCandidates.filter(
    (rejection) =>
      rejection.reason === "adapter_failure" ||
      rejection.reason === "no_quote_evidence",
  );

  return {
    status: "selected",
    plan: {
      ...selected,
      warnings: warningCandidates
        .slice(0, 3)
        .map((rejection) => rejection.message),
    },
    rejectedCandidates,
  };
}
