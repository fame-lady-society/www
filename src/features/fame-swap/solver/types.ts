import type { Address, Hex } from "viem";
import type { FameSwapRouteArtifactId } from "../artifacts/manifest";
import type { FameSwapConfig } from "../config";
import type { FameSwapToken, FameSwapTokenSymbol } from "../tokens";
import type {
  FameRoute,
  FameRouteArtifact,
  FameRouteCapabilities,
  VenueFamilyName,
} from "../router/types";

export type FameSwapQuoteStatus =
  | "ready"
  | "unsupported"
  | "stale_artifact"
  | "not_live_ready";

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
  now?: Date;
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
}

export interface FameSwapQuoteBase {
  status: FameSwapQuoteStatus;
  tokenIn: FameSwapToken;
  tokenOut: FameSwapToken;
  requestedAmountIn: bigint;
  message: string;
  diagnosticsVisibleByDefault: boolean;
}

export interface FameSwapExecutableQuote extends FameSwapQuoteBase {
  status: "ready";
  routerAddress: Address;
  routeArtifactId: FameSwapRouteArtifactId;
  fixtureRouteHash: Hex;
  materializedRouteHash: Hex;
  artifact: FameRouteArtifact;
  route: FameRoute;
  approval: FameSwapApprovalRequirement | null;
  callValue: bigint;
  estimatedOutput: bigint;
  minAmountOutAfterFee: bigint;
  feePpm: bigint;
  capabilities: FameRouteCapabilities;
  routeDisplay: FameSwapRouteDisplayLeg[];
  slippageBps: number;
  expiresAt: Date;
  warnings: string[];
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
  routeArtifactId: string;
  readiness: FameSwapReadinessBlocked;
}

export type FameSwapQuote =
  | FameSwapExecutableQuote
  | FameSwapUnsupportedQuote
  | FameSwapStaleArtifactQuote
  | FameSwapNotLiveReadyQuote;
