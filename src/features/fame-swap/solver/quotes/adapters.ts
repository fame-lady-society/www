import type { Address } from "viem";
import type { VenueFamilyName } from "../../router/types";
import type { FamePoolFeeDescriptor, FamePoolEdge } from "../poolUniverse";
import type { FameQuoteContext } from "./quoteContext";

export interface FameEdgeQuoteRequest {
  edge: FamePoolEdge;
  amountIn: bigint;
  context?: FameQuoteContext;
}

export type FameIndexedQuoteEvidence = {
  source: "indexed";
  kind: "compact-quote" | "raw-replay";
  quoteKind: "constant-product-quote-v1" | "cl-quote-v1" | "cl-replay-v1";
  evidenceId: string;
  poolId: string;
};

export type FameEdgeQuoteFailureReason =
  | "adapter_failure"
  | "amount_exceeds_capacity"
  | "no_quote_evidence"
  | "zero_output";

export type FameProtocolEvidenceStatus =
  | "available"
  | "unavailable"
  | "not_applicable"
  | "disabled";

export interface FameProtocolEvidenceItem {
  status: FameProtocolEvidenceStatus;
  source: string;
  value?: string;
  reason?: string;
}

export interface FameProtocolEvidence {
  quote: FameProtocolEvidenceItem;
  prePrice: FameProtocolEvidenceItem;
  postPrice: FameProtocolEvidenceItem;
  marketImpact: FameProtocolEvidenceItem;
  activeLiquidity: FameProtocolEvidenceItem;
}

export type FameEdgeQuoteResult =
  | {
      status: "quoted";
      amountIn: bigint;
      amountOut: bigint;
      capacityIn: bigint | null;
      fee: FamePoolFeeDescriptor;
      evidence: string;
      context?: FameQuoteContext;
      priceImpact?: FamePriceImpactEstimate;
      protocolEvidence?: FameProtocolEvidence;
      indexedEvidence?: FameIndexedQuoteEvidence;
    }
  | {
      status: "failed";
      reason: FameEdgeQuoteFailureReason;
      message: string;
    };

export interface FameQuoteAdapter {
  quoteContext?: FameQuoteContext;
  quoteEdge(request: FameEdgeQuoteRequest): FameEdgeQuoteResult;
}

export interface FameAsyncQuoteAdapter {
  quoteContext?: FameQuoteContext;
  quoteEdge(request: FameEdgeQuoteRequest): Promise<FameEdgeQuoteResult>;
}

export interface FameLegQuote {
  poolId: string;
  tokenIn: Address;
  tokenOut: Address;
  venue: VenueFamilyName;
  amountIn: bigint;
  amountOut: bigint;
  minAmountOut: bigint;
  fee: FamePoolFeeDescriptor;
  feeAmount: bigint | null;
  feeIncludedInQuote: boolean;
  evidence: string;
  quoteContext?: FameQuoteContext;
  priceImpact?: FamePriceImpactEstimate;
  protocolEvidence?: FameProtocolEvidence;
  indexedEvidence?: FameIndexedQuoteEvidence;
}

export interface FameCandidateRejection {
  candidateId: string;
  reason: FameEdgeQuoteFailureReason | "unsafe_output";
  message: string;
  failedLegIndex?: number;
  failedPoolId?: string;
  failedAmountIn?: bigint;
}

export interface FamePriceImpactEstimate {
  preSwapPriceX18: bigint;
  postSwapPriceX18: bigint | null;
  executionPriceX18: bigint;
  marketImpactBps: number | null;
  method:
    | "constant-product-reserves"
    | "concentrated-liquidity-slot0"
    | "quote-table"
    | "quoter-price-after";
}
