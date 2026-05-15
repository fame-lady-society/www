import type { Address } from "viem";
import type { FameRouteCandidate } from "../graph/routePlan";
import type { FamePoolEdge } from "../poolUniverse";
import type { FameCandidateRejection } from "../quotes/adapters";
import type { FameQuotedRoutePlan } from "../quotes/rankRoutes";
import type { FameQuoteContext } from "../quotes/quoteContext";

export type FameOptimizerMode = "disabled" | "shadow" | "select";

export type FameAllocationTrialStatus =
  | "selected"
  | "rejected"
  | "pruned"
  | "budget_exhausted"
  | "quote_failed"
  | "unsupported_shape"
  | "ineligible";

export type FameOptimizerTemplateKind =
  | "single_path"
  | "direct_split"
  | "terminal_split"
  | "split_merge";

export type FameOptimizerFailureReason =
  | "no_templates"
  | "no_safe_route"
  | "budget_exhausted"
  | "timeout"
  | "validation_failed"
  | "materialization_failed";

export interface FameOptimizerBudgets {
  maxTemplates: number;
  maxTrialsPerTemplate: number;
  maxLogicalQuoteRequests: number;
  maxUniqueExactQuoteReads: number;
  maxUniqueStateReads: number;
  maxUnderlyingRpcReads: number;
  timeoutMs: number;
}

export interface FameOptimizerQuotePlanStats {
  logicalQuoteRequests: number;
  uniqueExactQuoteReads: number;
  exactQuoteCacheHits: number;
  inFlightExactQuoteCoalesces: number;
  stateReadRequests: number;
  uniqueStateReads: number;
  stateReadCacheHits: number;
  inFlightStateReadCoalesces: number;
  underlyingRpcReads: number;
  allocationTrials: number;
  templatesConsidered: number;
  budgetExhaustions: number;
  timeout: boolean;
  fallbackReason: FameOptimizerFailureReason | null;
}

export interface FameOptimizerRunContext {
  quoteContext?: FameQuoteContext;
  budgets: FameOptimizerBudgets;
  stats: FameOptimizerQuotePlanStats;
  startedAtMs: number;
  quoteContextKey: string;
}

export interface FameOptimizerBranchTemplate {
  edge: FamePoolEdge;
  label: string;
}

export interface FameOptimizerRouteTemplate {
  id: string;
  kind: FameOptimizerTemplateKind;
  tokenIn: Address;
  tokenOut: Address;
  prefix?: readonly FamePoolEdge[];
  branches: readonly FameOptimizerBranchTemplate[];
  suffix: readonly FamePoolEdge[];
  baselineCandidate?: FameRouteCandidate;
  summary: string;
}

export interface FameOptimizerEligibilitySummary {
  templateId: string;
  status: FameAllocationTrialStatus;
  reason: string;
  poolIds: string[];
}

export interface FameAllocationTrialEvidence {
  templateId: string;
  allocationBps: number | null;
  status: FameAllocationTrialStatus;
  reason: string;
  candidateId?: string;
  poolIds: string[];
  grossAmountOut?: bigint;
  netAmountOut?: bigint;
  protectedAmountOut?: bigint;
  routerFeeAmount?: bigint;
  maxLegMarketImpactBps?: number | null;
  branchInputs?: string[];
  branchOutputs?: string[];
  winningMarginBps?: number | null;
}

export interface FameOptimizerEvidence {
  mode: FameOptimizerMode;
  status: "not_run" | "selected" | "fallback";
  quoteContext?: FameQuoteContext;
  selectedTemplateId: string | null;
  selectedAllocationBps: number | null;
  selectedCandidateId: string | null;
  objective: {
    baselineProtectedAmountOut: bigint | null;
    selectedProtectedAmountOut: bigint | null;
    winningMarginAmount: bigint | null;
    winningMarginBps: number | null;
  };
  trialStatusCounts: Record<FameAllocationTrialStatus, number>;
  allocationTrials: FameAllocationTrialEvidence[];
  templateEligibility: FameOptimizerEligibilitySummary[];
  quotePlanStats: FameOptimizerQuotePlanStats;
  fallbackReason: FameOptimizerFailureReason | null;
}

export type FameRouteOptimizerResult =
  | {
      status: "selected";
      plan: FameQuotedRoutePlan;
      evidence: FameOptimizerEvidence;
      rejectedCandidates: FameCandidateRejection[];
    }
  | {
      status: "fallback_required";
      reason: FameOptimizerFailureReason;
      evidence: FameOptimizerEvidence;
      rejectedCandidates: FameCandidateRejection[];
    };
