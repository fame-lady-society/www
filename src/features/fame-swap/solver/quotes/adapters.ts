import type { Address } from "viem";
import type { FamePoolFeeDescriptor, FamePoolEdge } from "../poolUniverse";
import type { FameQuoteContext } from "./quoteContext";

export interface FameEdgeQuoteRequest {
  edge: FamePoolEdge;
  amountIn: bigint;
  context?: FameQuoteContext;
}

export type FameEdgeQuoteFailureReason =
  | "adapter_failure"
  | "amount_exceeds_capacity"
  | "no_quote_evidence"
  | "zero_output";

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
  venue: string;
  amountIn: bigint;
  amountOut: bigint;
  minAmountOut: bigint;
  fee: FamePoolFeeDescriptor;
  feeAmount: bigint | null;
  feeIncludedInQuote: boolean;
  evidence: string;
  quoteContext?: FameQuoteContext;
  priceImpact?: FamePriceImpactEstimate;
}

export interface FameCandidateRejection {
  candidateId: string;
  reason: FameEdgeQuoteFailureReason | "unsafe_output";
  message: string;
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
