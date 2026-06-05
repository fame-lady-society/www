import type { Address, Hex } from "viem";
import type { FameSwapConfig } from "../config";
import type { FameSwapToken, FameSwapTokenSymbol } from "../tokens";
import type {
  FameRoute,
  FameRouteCapabilities,
  VenueFamilyName,
} from "../router/types";
import type { FameCandidateRejection } from "./quotes/adapters";
import type { FameQuoteContext } from "./quotes/quoteContext";
import type { FameRouteFeeBreakdown } from "./quotes/rankRoutes";
import type {
  FameOptimizerBudgets,
  FameOptimizerEvidence,
  FameOptimizerFailureReason,
  FameOptimizerMode,
  FameOptimizerQuotePlanStats,
} from "./optimizer/types";
import type { FameRouteCandidate } from "./graph/routePlan";

export type FameSwapQuoteStatus =
  | "ready"
  | "unsupported"
  | "stale_artifact"
  | "not_live_ready"
  | "no_safe_route"
  | "quote_adapter_failure"
  | "simulation_failure";

export type FameSwapReadinessStatus = "ready" | "not_live_ready";

export type FameSwapReadinessReason =
  | "missing_router"
  | "schema_mismatch"
  | "pinned_block_mismatch"
  | "artifact_hash_mismatch"
  | "fee_mismatch"
  | "venue_family_disabled"
  | "venue_target_disabled"
  | "v4_hook_data_disabled"
  | "missing_recipient"
  | "read_error";

export interface FameSwapReadinessReady {
  status: "ready";
  routerAddress: Address;
  feePpm: bigint;
}

export interface FameSwapReadinessBlocked {
  status: "not_live_ready";
  reason: FameSwapReadinessReason;
  message: string;
  routerAddress: Address | null;
}

export type FameSwapReadiness =
  | FameSwapReadinessReady
  | FameSwapReadinessBlocked;

export interface FameSwapQuoteRequest {
  tokenIn: FameSwapToken;
  tokenOut: FameSwapToken;
  amountIn: bigint;
  recipient: Address | null;
  config: FameSwapConfig;
  readiness?: FameSwapReadiness;
  optimizerMode?: FameOptimizerMode;
  optimizerBudgets?: Partial<FameOptimizerBudgets>;
  candidateFilter?: (candidate: FameRouteCandidate) => boolean;
  now?: Date;
  deadlineSeconds?: bigint;
}

export interface FameSwapApprovalRequirement {
  token: FameSwapToken;
  spender: Address;
  amount: bigint;
}

export interface FameSwapRouteDisplayLeg {
  tokenIn: FameSwapTokenSymbol | Address;
  tokenOut: FameSwapTokenSymbol | Address;
  venue: VenueFamilyName;
  amountMode: string;
  poolId?: string;
  allocationBps?: number | null;
}

export interface FameSwapQuoteBase {
  status: FameSwapQuoteStatus;
  tokenIn: FameSwapToken;
  tokenOut: FameSwapToken;
  requestedAmountIn: bigint;
  message: string;
  diagnosticsVisibleByDefault: boolean;
}

export interface FameSwapOptimizerSummary {
  mode: FameOptimizerMode;
  status: FameOptimizerEvidence["status"];
  selectedTemplateId: string | null;
  selectedAllocationBps: number | null;
  selectedCandidateId: string | null;
  winningMarginBps: number | null;
  trialStatusCounts: FameOptimizerEvidence["trialStatusCounts"];
  fallbackReason: FameOptimizerFailureReason | null;
  runStats: Pick<
    FameOptimizerQuotePlanStats,
    | "logicalQuoteRequests"
    | "uniqueExactQuoteReads"
    | "exactQuoteCacheHits"
    | "templatesConsidered"
    | "budgetExhaustions"
    | "timeout"
  > & { trials: number };
}

export interface FameSwapExecutableQuote extends FameSwapQuoteBase {
  status: "ready";
  routerAddress: Address;
  routeArtifactId: string;
  routeSource: "artifact" | "generated";
  fixtureRouteHash: Hex;
  materializedRouteHash: Hex;
  poolIds: string[];
  route: FameRoute;
  approval: FameSwapApprovalRequirement | null;
  callValue: bigint;
  grossEstimatedOutput: bigint;
  routerFeeAmount: bigint;
  estimatedOutput: bigint;
  minAmountOutAfterFee: bigint;
  feeBreakdown: FameRouteFeeBreakdown;
  quoteContext?: FameQuoteContext;
  feePpm: bigint;
  capabilities: FameRouteCapabilities;
  routeDisplay: FameSwapRouteDisplayLeg[];
  rejectedCandidates: FameCandidateRejection[];
  slippageBps: number;
  expiresAt: Date;
  warnings: string[];
  optimizerSummary?: FameSwapOptimizerSummary;
  optimizerEvidence?: FameOptimizerEvidence;
}

export interface FameSwapUnsupportedQuote extends FameSwapQuoteBase {
  status: "unsupported";
  availableDirections: string[];
}

export interface FameSwapStaleArtifactQuote extends FameSwapQuoteBase {
  status: "stale_artifact";
  reason: string;
}

export interface FameSwapNotLiveReadyQuote extends FameSwapQuoteBase {
  status: "not_live_ready";
  routeArtifactId?: string;
  readiness: FameSwapReadinessBlocked;
}

export interface FameSwapNoSafeRouteQuote extends FameSwapQuoteBase {
  status: "no_safe_route";
  rejectedCandidates: FameCandidateRejection[];
}

export interface FameSwapQuoteAdapterFailureQuote extends FameSwapQuoteBase {
  status: "quote_adapter_failure";
  rejectedCandidates: FameCandidateRejection[];
}

export interface FameSwapSimulationFailureQuote extends FameSwapQuoteBase {
  status: "simulation_failure";
  reason: string;
  rejectedCandidates: FameCandidateRejection[];
}

export type FameSwapQuote =
  | FameSwapExecutableQuote
  | FameSwapUnsupportedQuote
  | FameSwapStaleArtifactQuote
  | FameSwapNotLiveReadyQuote
  | FameSwapNoSafeRouteQuote
  | FameSwapQuoteAdapterFailureQuote
  | FameSwapSimulationFailureQuote;
