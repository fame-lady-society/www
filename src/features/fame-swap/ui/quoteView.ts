import type { Hex } from "viem";
import type { FameRouteLeg } from "../router/types";
import { formatTokenAmount } from "../solver/format";
import type { FameSwapQuote } from "../solver/types";
import { FAME, USDC, tokenForAddress, type FameSwapToken } from "../tokens";
import { poolDisplayMetadata, poolDisplayName } from "./poolDisplay";
import { routeTokenMetadataForAddress } from "./routeMetadata";

export interface FameSwapQuoteViewTransaction {
  simulatedOutput: bigint | null;
  protectedMinimum: bigint | null;
  quoteExpired: boolean;
  canApprove: boolean;
  canSwap: boolean;
  approvalConfirmed: boolean;
  submitting: boolean;
  protectedSimulationPending: boolean;
  preApprovalSimulationError: {
    reason: "unsupported_rpc" | "simulation_failed";
    message: string;
  } | null;
  error: Error | null;
}

export type FameSwapUsdcEstimate =
  | {
      status: "available";
      label: string;
      tone: FameSwapValueTone;
    }
  | {
      status: "unavailable";
      label: "USDC estimate unavailable";
      tone: "neutral";
    };

export type FameSwapValueTone = "positive" | "negative" | "neutral";

export interface FameSwapRouteTokenView {
  symbol: string;
  label: string;
  iconLabel: string;
  iconBackground: string;
  iconForeground: string;
}

export interface FameSwapRouteMapEdge {
  id: string;
  from: string;
  to: string;
  fromToken: FameSwapRouteTokenView;
  toToken: FameSwapRouteTokenView;
  venue: string;
  venueLabel: string;
  poolId: string | null;
  poolName: string;
  poolTypeLabel: string;
  pairLabel: string;
  feeLabel: string;
  feeTooltip: string | null;
  amountMode: string;
  amountLabel: string | null;
}

export interface FameSwapRouteMap {
  summary: string;
  edges: FameSwapRouteMapEdge[];
  split: boolean;
  splitShareLabel: string | null;
}

export interface FameSwapDiagnosticsView {
  routeArtifactId?: string;
  fixtureRouteHash?: string;
  materializedRouteHash?: string;
  status: string;
}

export interface FameSwapQuoteView {
  receiveLabel: string;
  receiveTone: FameSwapValueTone;
  protectedMinimumLabel: string;
  protectedMinimumTone: FameSwapValueTone;
  usdcEstimate: FameSwapUsdcEstimate;
  freshnessLabel: string;
  feeLabel: string | null;
  feeTooltip: string | null;
  venueFeeLabel: string | null;
  venueFeeTooltip: string | null;
  marketImpactLabel: string | null;
  marketImpactTooltip: string | null;
  marketImpactTone: FameSwapValueTone;
  estimateSourceLabel: string | null;
  estimateSourceTooltip: string | null;
  slippageLabel: string | null;
  routeMap: FameSwapRouteMap | null;
  diagnostics: FameSwapDiagnosticsView;
  blocked: boolean;
  blockedReason: string | null;
}

function shortHash(value: Hex): string {
  return `${value.slice(0, 10)}...${value.slice(-8)}`;
}

function routeTokenView(
  address: FameRouteLeg["tokenIn"],
): FameSwapRouteTokenView {
  const metadata = routeTokenMetadataForAddress(address);
  return {
    symbol: metadata.symbol,
    label: metadata.label,
    iconLabel: metadata.iconLabel,
    iconBackground: metadata.iconBackground,
    iconForeground: metadata.iconForeground,
  };
}

function legAmountLabel(leg: FameRouteLeg): string | null {
  if (leg.amountMode === "All") return "remaining";
  if (leg.amountMode !== "Exact") return null;

  const token = tokenForAddress(leg.tokenIn);
  return token ? formatTokenAmount(leg.amount, token) : null;
}

function venueFeeTooltip(poolName: string, feeLabel: string): string {
  return `${poolName} uses reviewed pool metadata for a ${feeLabel} venue fee tier. Venue fees are already included in the quoted output; this is not a live fee read.`;
}

function unavailableVenueFeeTooltip(poolName: string, reason: string): string {
  return `${poolName} has no reviewed venue fee metadata: ${reason}`;
}

function buildRouteMap(quote: FameSwapQuote): FameSwapRouteMap | null {
  if (quote.status !== "ready") return null;

  const edges = quote.route.legs.map((leg, index) => {
    const poolId = quote.poolIds[index];
    const quotedLeg = quote.feeBreakdown.legs[index];
    const fromToken = routeTokenView(leg.tokenIn);
    const toToken = routeTokenView(leg.tokenOut);
    const poolMetadata = poolDisplayMetadata(poolId, leg.venue);
    const poolName = poolMetadata.displayName;
    const fee =
      quotedLeg?.fee.status === "available"
        ? {
            label: quotedLeg.fee.label,
            tooltip: venueFeeTooltip(poolName, quotedLeg.fee.label),
          }
        : {
            label: "Fee unavailable",
            tooltip: unavailableVenueFeeTooltip(
              poolName,
              quotedLeg?.fee.reason ?? "No selected leg fee descriptor.",
            ),
          };

    return {
      id: `${index}-${leg.venue}-${leg.amountMode}`,
      from: fromToken.symbol,
      to: toToken.symbol,
      fromToken,
      toToken,
      venue: leg.venue,
      venueLabel: poolMetadata.venueLabel,
      poolId: poolId ?? null,
      poolName,
      poolTypeLabel: poolMetadata.poolTypeLabel,
      pairLabel: poolMetadata.pairLabel,
      feeLabel: fee.label,
      feeTooltip: fee.tooltip,
      amountMode: leg.amountMode,
      amountLabel: legAmountLabel(leg),
    };
  });
  const path = edges.reduce<string[]>((tokens, edge) => {
    if (tokens.length === 0) return [edge.from, edge.to];
    return tokens[tokens.length - 1] === edge.to
      ? tokens
      : [...tokens, edge.to];
  }, []);
  const summary =
    path.length > 0
      ? path.join(" -> ")
      : `${quote.tokenIn.symbol} -> ${quote.tokenOut.symbol}`;

  return {
    summary,
    edges,
    split: quote.capabilities.split || quote.capabilities.splitThenMerge,
    splitShareLabel:
      quote.capabilities.split || quote.capabilities.splitThenMerge
        ? "Split share unavailable"
        : null,
  };
}

function venueFeeSummary(quote: FameSwapQuote | null): {
  label: string;
  tooltip: string;
} | null {
  if (!quote || quote.status !== "ready") return null;

  const legs = quote.feeBreakdown.legs;
  if (legs.length === 0) {
    return {
      label: "Unavailable",
      tooltip: "No selected route legs are available for venue fee labels.",
    };
  }

  const descriptions = legs.map((leg) => {
    const poolName = poolDisplayName(leg.poolId, leg.venue);
    return leg.fee.status === "available"
      ? `${poolName}: ${leg.fee.label}`
      : `${poolName}: unavailable (${leg.fee.reason})`;
  });
  const availableCount = legs.filter(
    (leg) => leg.fee.status === "available",
  ).length;

  return {
    label:
      availableCount === legs.length
        ? "Included in quote"
        : `${availableCount}/${legs.length} tiers known`,
    tooltip: `Venue fees are already included in quoted outputs. Reviewed pool fee tiers: ${descriptions.join("; ")}. These labels come from pinned pool metadata, not live fee reads.`,
  };
}

function marketImpactSummary(quote: FameSwapQuote | null): {
  label: string;
  tooltip: string;
  tone: FameSwapValueTone;
} | null {
  if (quote?.status !== "ready") return null;
  const { maxLegMarketImpactBps, computableLegs } =
    quote.feeBreakdown.marketImpact;
  if (computableLegs <= 0 || maxLegMarketImpactBps === null) return null;

  const fameIn = quote.tokenIn.address.toLowerCase() === FAME.toLowerCase();
  const fameOut = quote.tokenOut.address.toLowerCase() === FAME.toLowerCase();
  const signedImpact =
    maxLegMarketImpactBps === 0
      ? 0
      : fameOut
        ? maxLegMarketImpactBps
        : fameIn
          ? -maxLegMarketImpactBps
          : 0;
  const sign = signedImpact > 0 ? "+" : "";
  const label = `${sign}${(signedImpact / 100).toFixed(2)}%`;
  const tone =
    signedImpact > 0 ? "positive" : signedImpact < 0 ? "negative" : "neutral";

  return {
    label,
    tooltip: `max ${label} across all computable legs`,
    tone,
  };
}

function usdcEstimate(
  quote: FameSwapQuote | null,
  transaction: FameSwapQuoteViewTransaction,
): FameSwapUsdcEstimate {
  const usdc = tokenForAddress(USDC);
  if (!quote || !usdc) {
    return {
      status: "unavailable",
      label: "USDC estimate unavailable",
      tone: "neutral",
    };
  }

  if (quote.tokenIn.address.toLowerCase() === USDC.toLowerCase()) {
    return {
      status: "available",
      label: formatTokenAmount(quote.requestedAmountIn, usdc),
      tone: "positive",
    };
  }

  if (
    quote.status === "ready" &&
    quote.tokenOut.address.toLowerCase() === USDC.toLowerCase() &&
    transaction.simulatedOutput !== null
  ) {
    return {
      status: "available",
      label: formatTokenAmount(transaction.simulatedOutput, usdc),
      tone: "positive",
    };
  }

  return {
    status: "unavailable",
    label: "USDC estimate unavailable",
    tone: "neutral",
  };
}

function freshnessLabel(quote: FameSwapQuote | null, expired: boolean): string {
  if (!quote || quote.status !== "ready") return "Quote pending";
  if (expired) return "Quote expired";

  return `Expires ${quote.expiresAt.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

function quoteExpiryTime(
  quote: Extract<FameSwapQuote, { status: "ready" }>,
): string {
  return quote.expiresAt.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function blockedReason(
  quote: FameSwapQuote | null,
  transaction: FameSwapQuoteViewTransaction,
): string | null {
  if (!quote) return "Enter an amount to prepare a quote.";
  if (transaction.quoteExpired) return "Refresh the quote before submitting.";
  if (quote.status === "not_live_ready") return quote.readiness.message;
  if (quote.status === "stale_artifact") return quote.reason;
  if (quote.status === "unsupported") return quote.message;
  if (quote.status === "no_safe_route") return quote.message;
  if (quote.status === "quote_adapter_failure") return quote.message;
  if (quote.status === "simulation_failure") return quote.message;
  return null;
}

function unavailableEstimateLabel(quote: FameSwapQuote | null): string {
  if (!quote) return "Enter amount";
  if (quote.status !== "ready") return "Quote unavailable";
  return "Estimate unavailable";
}

function estimateLabels(
  quote: FameSwapQuote | null,
  outputToken: FameSwapToken,
  transaction: FameSwapQuoteViewTransaction,
): {
  receiveLabel: string;
  receiveTone: FameSwapValueTone;
  protectedMinimumLabel: string;
  protectedMinimumTone: FameSwapValueTone;
  sourceLabel: string | null;
  sourceTooltip: string | null;
} {
  if (quote?.status !== "ready") {
    const label = unavailableEstimateLabel(quote);
    return {
      receiveLabel: label,
      receiveTone: "neutral",
      protectedMinimumLabel: label,
      protectedMinimumTone: "neutral",
      sourceLabel: null,
      sourceTooltip: null,
    };
  }

  if (transaction.simulatedOutput !== null) {
    return {
      receiveLabel: formatTokenAmount(transaction.simulatedOutput, outputToken),
      receiveTone: "positive",
      protectedMinimumLabel:
        transaction.protectedMinimum !== null
          ? formatTokenAmount(transaction.protectedMinimum, outputToken)
          : formatTokenAmount(quote.minAmountOutAfterFee, outputToken),
      protectedMinimumTone: "positive",
      sourceLabel: "Wallet-simulated output",
      sourceTooltip:
        "This display uses wallet/RPC simulation output. Swap submission still uses the protected route simulation gate.",
    };
  }

  if (transaction.protectedSimulationPending) {
    return {
      receiveLabel: "Estimating",
      receiveTone: "neutral",
      protectedMinimumLabel: "Estimating",
      protectedMinimumTone: "neutral",
      sourceLabel: null,
      sourceTooltip: null,
    };
  }

  const fallbackReason =
    transaction.preApprovalSimulationError?.reason === "unsupported_rpc"
      ? "Bundled wallet simulation is not supported by this browser RPC."
      : transaction.preApprovalSimulationError?.reason === "simulation_failed"
        ? "Bundled wallet simulation did not return an output before approval."
        : "Wallet simulation has not returned an output before approval.";

  return {
    receiveLabel: formatTokenAmount(quote.estimatedOutput, outputToken),
    receiveTone: "positive",
    protectedMinimumLabel: formatTokenAmount(
      quote.minAmountOutAfterFee,
      outputToken,
    ),
    protectedMinimumTone: "positive",
    sourceLabel: `Quote estimate until ${quoteExpiryTime(quote)}`,
    sourceTooltip: `${fallbackReason} This display falls back to the server quote. It does not enable swap submission; the protected wallet simulation remains the final gate.`,
  };
}

export function fameSwapQuoteView(
  quote: FameSwapQuote | null,
  outputToken: FameSwapToken,
  transaction: FameSwapQuoteViewTransaction,
): FameSwapQuoteView {
  const estimates = estimateLabels(quote, outputToken, transaction);
  const reason = blockedReason(quote, transaction);
  const feePercentLabel =
    quote?.status === "ready"
      ? `${(Number(quote.feePpm) / 10_000).toFixed(4)}%`
      : null;
  const venueFees = venueFeeSummary(quote);
  const marketImpact = marketImpactSummary(quote);

  return {
    receiveLabel: estimates.receiveLabel,
    receiveTone: estimates.receiveTone,
    protectedMinimumLabel: estimates.protectedMinimumLabel,
    protectedMinimumTone: estimates.protectedMinimumTone,
    usdcEstimate: usdcEstimate(quote, transaction),
    freshnessLabel: freshnessLabel(quote, transaction.quoteExpired),
    feeLabel: feePercentLabel,
    feeTooltip:
      quote?.status === "ready"
        ? "This fee is enforced by the FAME router contract. Proceeds go to the Society community multisig on Base."
        : null,
    venueFeeLabel: venueFees?.label ?? null,
    venueFeeTooltip: venueFees?.tooltip ?? null,
    marketImpactLabel: marketImpact?.label ?? null,
    marketImpactTooltip: marketImpact?.tooltip ?? null,
    marketImpactTone: marketImpact?.tone ?? "neutral",
    estimateSourceLabel: estimates.sourceLabel,
    estimateSourceTooltip: estimates.sourceTooltip,
    slippageLabel:
      quote?.status === "ready"
        ? `${(quote.slippageBps / 100).toFixed(2)}%`
        : null,
    routeMap: quote ? buildRouteMap(quote) : null,
    diagnostics: {
      status: quote?.status ?? "none",
      routeArtifactId:
        quote && "routeArtifactId" in quote ? quote.routeArtifactId : undefined,
      fixtureRouteHash:
        quote?.status === "ready"
          ? shortHash(quote.fixtureRouteHash)
          : undefined,
      materializedRouteHash:
        quote?.status === "ready"
          ? shortHash(quote.materializedRouteHash)
          : undefined,
    },
    blocked:
      reason !== null ||
      transaction.quoteExpired ||
      (quote?.status === "ready" &&
        !transaction.canApprove &&
        !transaction.canSwap),
    blockedReason: reason,
  };
}
