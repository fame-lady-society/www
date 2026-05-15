import type { Address, Hex } from "viem";
import { buildFameRouteLeg } from "../router/buildLegPayload";
import { encodeFameRoute, hashFameRoute } from "../router/encodeRoute";
import {
  FAME_SWAP_SCHEMA_VERSION,
  type FameRoute,
  type FameRouteCapabilities,
} from "../router/types";
import { tokenForAddress, type FameSwapToken } from "../tokens";
import { routeCandidatesForPair } from "./graph/candidates";
import type { FameSwapOptimizerSummary, FameSwapRouteDisplayLeg } from "./types";
import type {
  FameAsyncQuoteAdapter,
  FameCandidateRejection,
  FameQuoteAdapter,
} from "./quotes/adapters";
import { optimizeRouteAllocations } from "./optimizer/search";
import { optimizerSummaryFromEvidence } from "./optimizer/summary";
import type {
  FameOptimizerBudgets,
  FameOptimizerEvidence,
  FameOptimizerMode,
} from "./optimizer/types";
import { rankRouteCandidatesAsync } from "./quotes/asyncRankRoutes";
import {
  rankRouteCandidates,
  type FameQuotedRoutePlan,
} from "./quotes/rankRoutes";

export type FameAmountSolverResult =
  | {
      status: "ready";
      routeArtifactId: string;
      route: FameRoute;
      abiEncodedRoute: Hex;
      routeHash: Hex;
      poolIds: string[];
      capabilities: FameRouteCapabilities;
      routeDisplay: FameSwapRouteDisplayLeg[];
      plan: FameQuotedRoutePlan;
      optimizerSummary?: FameSwapOptimizerSummary;
      optimizerEvidence?: FameOptimizerEvidence;
      warnings: string[];
      rejectedCandidates: FameCandidateRejection[];
    }
  | {
      status: "unsupported" | "no_safe_route" | "quote_adapter_failure";
      rejectedCandidates: FameCandidateRejection[];
      message: string;
    };

export interface FameAmountSolverRequest {
  tokenIn: FameSwapToken;
  tokenOut: FameSwapToken;
  amountIn: bigint;
  routerAddress: Address;
  recipient: Address;
  deadline: bigint;
  feePpm: bigint;
  slippageBps: number;
  adapter?: FameQuoteAdapter;
}

export interface FameAsyncAmountSolverRequest
  extends Omit<FameAmountSolverRequest, "adapter"> {
  adapter: FameAsyncQuoteAdapter;
  optimizerMode?: FameOptimizerMode;
  optimizerBudgets?: Partial<FameOptimizerBudgets>;
}

function routeDisplay(plan: FameQuotedRoutePlan): FameSwapRouteDisplayLeg[] {
  return plan.candidate.legs.map((leg) => ({
    tokenIn: tokenForAddress(leg.edge.tokenIn)?.symbol ?? leg.edge.tokenIn,
    tokenOut: tokenForAddress(leg.edge.tokenOut)?.symbol ?? leg.edge.tokenOut,
    venue: leg.edge.venue,
    amountMode: leg.amountMode,
    poolId: leg.edge.poolId,
    allocationBps: leg.allocationBps,
  }));
}

function buildRoute(
  request: Omit<FameAmountSolverRequest, "adapter">,
  plan: FameQuotedRoutePlan,
) {
  const legs = plan.candidate.legs.map((candidateLeg, index) => {
    const quote = plan.legQuotes[index];
    return buildFameRouteLeg({
      edge: candidateLeg.edge,
      amountMode: candidateLeg.amountMode,
      amount: quote.amountIn,
      minAmountOut: quote.minAmountOut,
      routerAddress: request.routerAddress,
      deadline: request.deadline,
    });
  });

  return {
    version: FAME_SWAP_SCHEMA_VERSION,
    tokenIn: request.tokenIn.address,
    tokenOut: request.tokenOut.address,
    amountIn: request.amountIn,
    minAmountOutAfterFee: plan.protectedAmountOut,
    recipient: request.recipient,
    deadline: request.deadline,
    legs,
  } satisfies FameRoute;
}

function readyResult(
  request: Omit<FameAmountSolverRequest, "adapter">,
  plan: FameQuotedRoutePlan,
  rejectedCandidates: FameCandidateRejection[],
  optimizerEvidence?: FameOptimizerEvidence,
): Extract<FameAmountSolverResult, { status: "ready" }> {
  const route = buildRoute(request, plan);
  const routeHash = hashFameRoute(route);

  return {
    status: "ready",
    routeArtifactId: plan.candidate.id,
    route,
    abiEncodedRoute: encodeFameRoute(route),
    routeHash,
    poolIds: plan.candidate.legs.map((leg) => leg.edge.poolId),
    capabilities: plan.candidate.capabilities,
    routeDisplay: routeDisplay(plan),
    plan,
    optimizerSummary: optimizerSummaryFromEvidence(optimizerEvidence),
    optimizerEvidence,
    warnings: plan.warnings,
    rejectedCandidates,
  };
}

export function solveFameSwapAmount(
  request: FameAmountSolverRequest,
): FameAmountSolverResult {
  const candidateSet = routeCandidatesForPair(
    request.tokenIn.address,
    request.tokenOut.address,
  );
  if (candidateSet.candidates.length === 0) {
    return {
      status:
        candidateSet.rejected[0]?.reason === "unsupported_pair"
          ? "unsupported"
          : "no_safe_route",
      rejectedCandidates: candidateSet.rejected.map((rejection) => ({
        candidateId: "candidate-generation",
        reason: "unsafe_output",
        message: rejection.detail,
      })),
      message:
        candidateSet.rejected[0]?.detail ??
        "No known pinned pool path can connect this FAME pair.",
    };
  }

  if (!request.adapter) {
    return {
      status: "quote_adapter_failure",
      rejectedCandidates: [
        {
          candidateId: "quote-adapter",
          reason: "no_quote_evidence",
          message:
            "FAME amount solver requires an explicit liquidity quote adapter.",
        },
      ],
      message:
        "FAME amount solver requires an explicit liquidity quote adapter.",
    };
  }

  const ranked = rankRouteCandidates({
    candidates: candidateSet.candidates,
    amountIn: request.amountIn,
    feePpm: request.feePpm,
    slippageBps: request.slippageBps,
    adapter: request.adapter,
  });

  if (ranked.status !== "selected") {
    return {
      status: ranked.status,
      rejectedCandidates: ranked.rejectedCandidates,
      message:
        ranked.status === "quote_adapter_failure"
          ? "FAME route quote adapters could not produce usable quote evidence."
          : "No safe FAME route was found for this amount.",
    };
  }

  return readyResult(request, ranked.plan, ranked.rejectedCandidates);
}

export async function solveFameSwapAmountAsync(
  request: FameAsyncAmountSolverRequest,
): Promise<FameAmountSolverResult> {
  const candidateSet = routeCandidatesForPair(
    request.tokenIn.address,
    request.tokenOut.address,
  );
  if (candidateSet.candidates.length === 0) {
    return {
      status:
        candidateSet.rejected[0]?.reason === "unsupported_pair"
          ? "unsupported"
          : "no_safe_route",
      rejectedCandidates: candidateSet.rejected.map((rejection) => ({
        candidateId: "candidate-generation",
        reason: "unsafe_output",
        message: rejection.detail,
      })),
      message:
        candidateSet.rejected[0]?.detail ??
        "No known pinned pool path can connect this FAME pair.",
    };
  }

  async function legacyResult(
    optimizerEvidence?: FameOptimizerEvidence,
  ): Promise<FameAmountSolverResult> {
    const ranked = await rankRouteCandidatesAsync({
      candidates: candidateSet.candidates,
      amountIn: request.amountIn,
      feePpm: request.feePpm,
      slippageBps: request.slippageBps,
      adapter: request.adapter,
    });

    if (ranked.status !== "selected") {
      return {
        status: ranked.status,
        rejectedCandidates: ranked.rejectedCandidates,
        message:
          ranked.status === "quote_adapter_failure"
            ? "FAME route quote adapters could not produce usable quote evidence."
            : "No safe FAME route was found for this amount.",
      };
    }

    return readyResult(
      request,
      ranked.plan,
      ranked.rejectedCandidates,
      optimizerEvidence,
    );
  }

  const optimizerMode = request.optimizerMode ?? "select";
  if (optimizerMode === "disabled") {
    return legacyResult();
  }

  const optimized = await optimizeRouteAllocations({
    tokenIn: request.tokenIn.address,
    tokenOut: request.tokenOut.address,
    amountIn: request.amountIn,
    feePpm: request.feePpm,
    slippageBps: request.slippageBps,
    adapter: request.adapter,
    mode: optimizerMode,
    budgets: request.optimizerBudgets,
  });

  if (optimizerMode === "shadow") {
    return legacyResult(optimized.evidence);
  }

  if (optimized.status === "selected") {
    return readyResult(
      request,
      optimized.plan,
      optimized.rejectedCandidates,
      optimized.evidence,
    );
  }

  if (optimized.reason === "timeout") {
    return {
      status: "quote_adapter_failure",
      rejectedCandidates: optimized.rejectedCandidates,
      message:
        "FAME optimizer timed out before completing a safe route quote.",
    };
  }

  const fallback = await legacyResult(optimized.evidence);
  return fallback;
}
