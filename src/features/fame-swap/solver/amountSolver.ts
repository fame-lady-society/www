import type { Address, Hex } from "viem";
import { buildFameRouteLeg } from "../router/buildLegPayload";
import { encodeFameRoute, hashFameRoute } from "../router/encodeRoute";
import {
  FAME_SWAP_SCHEMA_VERSION,
  type FameRoute,
  type FameRouteCapabilities,
} from "../router/types";
import { tokenForAddress, type FameSwapToken } from "../tokens";
import { routeArtifactById } from "./artifacts";
import { routeCandidatesForPair } from "./graph/candidates";
import type {
  FameRouteCandidate,
  FameRouteCandidateRejected,
  FameRouteCandidateSet,
} from "./graph/routePlan";
import type {
  FameSwapOptimizerSummary,
  FameSwapRouteDisplayLeg,
} from "./types";
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
      routeSource: "artifact" | "generated";
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
  requestedRouteId?: string;
}

export interface FameAsyncAmountSolverRequest
  extends Omit<FameAmountSolverRequest, "adapter"> {
  adapter: FameAsyncQuoteAdapter;
  optimizerMode?: FameOptimizerMode;
  optimizerBudgets?: Partial<FameOptimizerBudgets>;
}

function sameAddress(left: Address, right: Address): boolean {
  return left.toLowerCase() === right.toLowerCase();
}

function candidatePoolIds(candidate: FameRouteCandidate): string[] {
  return candidate.legs.map((leg) => leg.edge.poolId);
}

function samePoolPath(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return (
    left.length === right.length &&
    left.every((poolId, index) => poolId === right[index])
  );
}

function allocationBpsForExactLeg(
  amountIn: bigint,
  legAmount: string,
): number | null {
  const amount = BigInt(legAmount);
  const numerator = amount * 10_000n;
  if (amountIn <= 0n || numerator % amountIn !== 0n) return null;
  const allocation = numerator / amountIn;
  return allocation >= 0n && allocation <= 10_000n ? Number(allocation) : null;
}

function requestedArtifactKind(
  artifact: NonNullable<ReturnType<typeof routeArtifactById>>,
): FameRouteCandidate["kind"] {
  const allocatedLegs = artifact.route.legs.filter(
    (leg) =>
      leg.amountMode === "Exact" &&
      BigInt(leg.amount) < BigInt(artifact.route.amountIn),
  ).length;
  if (allocatedLegs === 0) return "single_path";
  return artifact.route.legs.length === 2 ? "split" : "split_merge";
}

function candidateMatchesArtifact(
  candidate: FameRouteCandidate,
  artifact: NonNullable<ReturnType<typeof routeArtifactById>>,
): boolean {
  if (candidate.kind !== requestedArtifactKind(artifact)) return false;
  if (!samePoolPath(candidatePoolIds(candidate), artifact.poolIds))
    return false;
  if (candidate.legs.length !== artifact.route.legs.length) return false;

  const routeAmountIn = BigInt(artifact.route.amountIn);
  let firstAllocationBps: number | null = null;

  return candidate.legs.every((leg, index) => {
    const artifactLeg = artifact.route.legs[index];
    if (!artifactLeg) return false;

    if (leg.allocationBps === null) return true;
    if (leg.amountMode !== artifactLeg.amountMode) return false;
    if (artifactLeg.amountMode === "Exact") {
      const allocation = allocationBpsForExactLeg(
        routeAmountIn,
        artifactLeg.amount,
      );
      firstAllocationBps = allocation;
      return allocation !== null && leg.allocationBps === allocation;
    }
    if (artifactLeg.amountMode === "All" && firstAllocationBps !== null) {
      return leg.allocationBps === 10_000 - firstAllocationBps;
    }
    return false;
  });
}

function requestedRouteMismatch(
  requestedRouteId: string,
  detail: string,
): FameRouteCandidateRejected {
  return {
    reason: "requested_route_unavailable",
    detail: `Requested route ${requestedRouteId} is not available: ${detail}`,
  };
}

function routeCandidateSetForRequest(
  request: Pick<
    FameAmountSolverRequest,
    "tokenIn" | "tokenOut" | "requestedRouteId"
  >,
): FameRouteCandidateSet {
  const candidateSet = routeCandidatesForPair(
    request.tokenIn.address,
    request.tokenOut.address,
  );
  const requestedRouteId = request.requestedRouteId?.trim();
  if (!requestedRouteId) return candidateSet;

  const artifact = routeArtifactById(requestedRouteId);
  if (artifact) {
    if (
      !sameAddress(artifact.route.tokenIn, request.tokenIn.address) ||
      !sameAddress(artifact.route.tokenOut, request.tokenOut.address)
    ) {
      return {
        candidates: [],
        rejected: [
          requestedRouteMismatch(
            requestedRouteId,
            "the artifact token pair does not match this quote request.",
          ),
        ],
      };
    }

    const candidates = candidateSet.candidates.filter((candidate) =>
      candidateMatchesArtifact(candidate, artifact),
    );
    return candidates.length > 0
      ? { candidates, rejected: candidateSet.rejected }
      : {
          candidates: [],
          rejected: [
            requestedRouteMismatch(
              requestedRouteId,
              "no generated candidate matches the artifact pool path.",
            ),
            ...candidateSet.rejected,
          ],
        };
  }

  const candidates = candidateSet.candidates.filter(
    (candidate) => candidate.id === requestedRouteId,
  );
  return candidates.length > 0
    ? { candidates, rejected: candidateSet.rejected }
    : {
        candidates: [],
        rejected: [
          requestedRouteMismatch(
            requestedRouteId,
            "no generated candidate has that id.",
          ),
          ...candidateSet.rejected,
        ],
      };
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
  const requestedArtifact = request.requestedRouteId
    ? routeArtifactById(request.requestedRouteId)
    : undefined;

  return {
    status: "ready",
    routeArtifactId: requestedArtifact?.id ?? plan.candidate.id,
    routeSource: requestedArtifact ? "artifact" : "generated",
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
  const candidateSet = routeCandidateSetForRequest(request);
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
  const candidateSet = routeCandidateSetForRequest(request);
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
  if (optimizerMode === "disabled" || request.requestedRouteId) {
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
      message: "FAME optimizer timed out before completing a safe route quote.",
    };
  }

  const fallback = await legacyResult(optimized.evidence);
  return fallback;
}
