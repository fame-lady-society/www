import type { Hex } from "viem";
import type { FameRouteLeg } from "../router/types";
import { formatTokenAmount } from "../solver/format";
import type { FameSwapQuote } from "../solver/types";
import { USDC, tokenForAddress, type FameSwapToken } from "../tokens";
import { poolDisplayName } from "./poolDisplay";

export interface FameSwapQuoteViewTransaction {
  simulatedOutput: bigint | null;
  protectedMinimum: bigint | null;
  quoteExpired: boolean;
  canApprove: boolean;
  canSwap: boolean;
  approvalConfirmed: boolean;
  submitting: boolean;
  protectedSimulationPending: boolean;
  error: Error | null;
}

export type FameSwapUsdcEstimate =
  | {
      status: "available";
      label: string;
    }
  | {
      status: "unavailable";
      label: "USDC estimate unavailable";
    };

export interface FameSwapRouteMapEdge {
  id: string;
  from: string;
  to: string;
  venue: string;
  poolId: string | null;
  poolName: string;
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
  protectedMinimumLabel: string;
  usdcEstimate: FameSwapUsdcEstimate;
  freshnessLabel: string;
  feeLabel: string | null;
  feeTooltip: string | null;
  slippageLabel: string | null;
  routeMap: FameSwapRouteMap | null;
  diagnostics: FameSwapDiagnosticsView;
  blocked: boolean;
  blockedReason: string | null;
}

function shortHash(value: Hex): string {
  return `${value.slice(0, 10)}...${value.slice(-8)}`;
}

const ROUTE_TOKEN_SYMBOLS: Record<string, string> = {
  "0x1111111111166b7fe7bd91427724b487980afc69": "ZORA",
  "0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926": "basedflick",
  "0xe5020a6d073a794b6e7f05678707de47986fb0b6": "frxUSD",
};

function tokenSymbol(address: FameRouteLeg["tokenIn"]): string {
  return (
    tokenForAddress(address)?.symbol ??
    ROUTE_TOKEN_SYMBOLS[address.toLowerCase()] ??
    `${address.slice(0, 6)}...`
  );
}

function legAmountLabel(leg: FameRouteLeg): string | null {
  if (leg.amountMode === "All") return "remaining";
  if (leg.amountMode !== "Exact") return null;

  const token = tokenForAddress(leg.tokenIn);
  return token ? formatTokenAmount(leg.amount, token) : null;
}

function buildRouteMap(quote: FameSwapQuote): FameSwapRouteMap | null {
  if (quote.status !== "ready") return null;

  const edges = quote.route.legs.map((leg, index) => {
    const poolId = quote.poolIds[index];

    return {
      id: `${index}-${leg.venue}-${leg.amountMode}`,
      from: tokenSymbol(leg.tokenIn),
      to: tokenSymbol(leg.tokenOut),
      venue: leg.venue,
      poolId: poolId ?? null,
      poolName: poolDisplayName(poolId, leg.venue),
      amountMode: leg.amountMode,
      amountLabel: legAmountLabel(leg),
    };
  });
  const path = edges.reduce<string[]>((tokens, edge) => {
    if (tokens.length === 0) return [edge.from, edge.to];
    return tokens[tokens.length - 1] === edge.to ? tokens : [...tokens, edge.to];
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

function usdcEstimate(
  quote: FameSwapQuote | null,
  transaction: FameSwapQuoteViewTransaction,
): FameSwapUsdcEstimate {
  const usdc = tokenForAddress(USDC);
  if (!quote || !usdc) {
    return {
      status: "unavailable",
      label: "USDC estimate unavailable",
    };
  }

  if (quote.tokenIn.address.toLowerCase() === USDC.toLowerCase()) {
    return {
      status: "available",
      label: formatTokenAmount(quote.requestedAmountIn, usdc),
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
    };
  }

  return {
    status: "unavailable",
    label: "USDC estimate unavailable",
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
  if (transaction.error) return transaction.error.message;
  return null;
}

function estimateFallbackLabel(
  quote: FameSwapQuote | null,
  pending: boolean,
): string {
  if (!quote) return "Enter amount";
  if (quote.status !== "ready") return "Quote unavailable";
  return pending ? "Estimating" : "Estimate unavailable";
}

export function fameSwapQuoteView(
  quote: FameSwapQuote | null,
  outputToken: FameSwapToken,
  transaction: FameSwapQuoteViewTransaction,
): FameSwapQuoteView {
  const receiveLabel =
    quote?.status === "ready" && transaction.simulatedOutput !== null
      ? formatTokenAmount(transaction.simulatedOutput, outputToken)
      : estimateFallbackLabel(quote, transaction.protectedSimulationPending);
  const protectedMinimumLabel =
    quote?.status === "ready" && transaction.protectedMinimum !== null
      ? formatTokenAmount(transaction.protectedMinimum, outputToken)
      : estimateFallbackLabel(quote, transaction.protectedSimulationPending);
  const reason = blockedReason(quote, transaction);
  const feePercentLabel =
    quote?.status === "ready"
      ? `${(Number(quote.feePpm) / 10_000).toFixed(4)}%`
      : null;

  return {
    receiveLabel,
    protectedMinimumLabel,
    usdcEstimate: usdcEstimate(quote, transaction),
    freshnessLabel: freshnessLabel(quote, transaction.quoteExpired),
    feeLabel: feePercentLabel,
    feeTooltip:
      quote?.status === "ready"
        ? "This fee is enforced by the FAME router contract. Proceeds go to the Society community multisig on Base."
        : null,
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
        quote?.status === "ready" ? shortHash(quote.fixtureRouteHash) : undefined,
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
