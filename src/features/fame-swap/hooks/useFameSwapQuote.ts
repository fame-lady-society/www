"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { isAddress, isHex, type Address, type Hex } from "viem";
import type { FameSwapConfig } from "../config";
import {
  routeFromJson,
  type FameRouteCapabilities,
  type JsonFameRoute,
} from "../router/types";
import { supportedDirections } from "../solver/artifacts";
import { deadlineMinutesToSeconds } from "../solver/deadline";
import { quoteFameSwap } from "../solver/quote";
import type {
  FameSwapQuote,
  FameSwapNotLiveReadyQuote,
  FameSwapQuoteRequest,
  FameSwapRouteDisplayLeg,
  FameSwapReadiness,
} from "../solver/types";
import type { FameCandidateRejection, FameLegQuote } from "../solver/quotes/adapters";
import type { FameQuoteContext } from "../solver/quotes/quoteContext";
import type { FameRouteFeeBreakdown } from "../solver/quotes/rankRoutes";
import type { FameSwapToken } from "../tokens";

export interface UseFameSwapQuoteInput {
  tokenIn: FameSwapToken;
  tokenOut: FameSwapToken;
  amountIn: bigint | null;
  recipient: Address | null;
  config: FameSwapConfig;
  readiness: FameSwapReadiness;
  deadlineMinutes: number;
}

export interface UseFameSwapQuoteResult {
  quote: FameSwapQuote | null;
  isLoading: boolean;
  error: Error | null;
  quoteKey: string | null;
  refresh: () => void;
}

interface DeserializeQuoteInput {
  tokenIn: FameSwapToken;
  tokenOut: FameSwapToken;
  amountIn: bigint;
  config: FameSwapConfig;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function bigintFrom(value: unknown, fallback = 0n): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number" && Number.isSafeInteger(value)) return BigInt(value);
  if (typeof value === "string" && /^[0-9]+$/.test(value)) return BigInt(value);
  return fallback;
}

function numberFrom(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function booleanFrom(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function addressFrom(value: unknown, fallback: Address | null): Address | null {
  return typeof value === "string" && isAddress(value) ? value : fallback;
}

function parseQuoteContext(value: unknown): FameQuoteContext | undefined {
  const raw = asRecord(value);
  if (raw.source === "live" || raw.source === "fork") {
    return {
      source: raw.source,
      chainId: numberFrom(raw.chainId),
      blockNumber: bigintFrom(raw.blockNumber),
    };
  }

  if (raw.source === "snapshot") {
    return {
      source: "snapshot",
      snapshotId: String(raw.snapshotId ?? ""),
      pinnedBaseBlock: numberFrom(raw.pinnedBaseBlock),
    };
  }

  if (raw.source === "deterministic_test") {
    return {
      source: "deterministic_test",
      profileId: String(raw.profileId ?? ""),
    };
  }

  return undefined;
}

function parseRejections(value: unknown): FameCandidateRejection[] {
  return Array.isArray(value)
    ? value.map((entry) => {
        const raw = asRecord(entry);
        return {
          candidateId: String(raw.candidateId ?? "unknown"),
          reason: String(raw.reason ?? "adapter_failure") as FameCandidateRejection["reason"],
          message: String(raw.message ?? "Quote candidate failed."),
        };
      })
    : [];
}

function parseLegQuote(value: unknown): FameLegQuote {
  const raw = asRecord(value);
  const priceImpact = asRecord(raw.priceImpact);
  return {
    poolId: String(raw.poolId ?? "unknown"),
    tokenIn: addressFrom(raw.tokenIn, "0x0000000000000000000000000000000000000000")!,
    tokenOut: addressFrom(raw.tokenOut, "0x0000000000000000000000000000000000000000")!,
    venue: String(raw.venue ?? "unknown"),
    amountIn: bigintFrom(raw.amountIn),
    amountOut: bigintFrom(raw.amountOut),
    minAmountOut: bigintFrom(raw.minAmountOut),
    fee: asRecord(raw.fee) as FameLegQuote["fee"],
    feeAmount: raw.feeAmount === null ? null : bigintFrom(raw.feeAmount),
    feeIncludedInQuote: booleanFrom(raw.feeIncludedInQuote, true),
    evidence: String(raw.evidence ?? "quote evidence unavailable"),
    quoteContext: parseQuoteContext(raw.quoteContext),
    priceImpact:
      priceImpact.preSwapPriceX18 || priceImpact.executionPriceX18
        ? {
            preSwapPriceX18: bigintFrom(priceImpact.preSwapPriceX18),
            postSwapPriceX18:
              priceImpact.postSwapPriceX18 === null
                ? null
                : bigintFrom(priceImpact.postSwapPriceX18),
            executionPriceX18: bigintFrom(priceImpact.executionPriceX18),
            marketImpactBps:
              typeof priceImpact.marketImpactBps === "number"
                ? priceImpact.marketImpactBps
                : null,
            method:
              priceImpact.method === "quote-table" ||
              priceImpact.method === "concentrated-liquidity-slot0" ||
              priceImpact.method === "quoter-price-after"
                ? priceImpact.method
                : "constant-product-reserves",
          }
        : undefined,
  };
}

function parseFeeBreakdown(value: unknown): FameRouteFeeBreakdown {
  const raw = asRecord(value);
  const marketImpact = asRecord(raw.marketImpact);
  return {
    routerFeePpm: bigintFrom(raw.routerFeePpm),
    routerFeeAmount: bigintFrom(raw.routerFeeAmount),
    venueFeesIncluded: booleanFrom(raw.venueFeesIncluded, true),
    legs: Array.isArray(raw.legs) ? raw.legs.map(parseLegQuote) : [],
    marketImpact: {
      routeExecutionPriceX18:
        marketImpact.routeExecutionPriceX18 === null
          ? null
          : bigintFrom(marketImpact.routeExecutionPriceX18),
      maxLegMarketImpactBps:
        typeof marketImpact.maxLegMarketImpactBps === "number"
          ? marketImpact.maxLegMarketImpactBps
          : null,
      computableLegs: numberFrom(marketImpact.computableLegs, 0),
    },
  };
}

function parseCapabilities(value: unknown): FameRouteCapabilities {
  const raw = asRecord(value);
  return {
    nativeEth: booleanFrom(raw.nativeEth),
    weth: booleanFrom(raw.weth),
    permit2UniversalRouter: booleanFrom(raw.permit2UniversalRouter),
    v4Hooks: booleanFrom(raw.v4Hooks),
    v4HookAddress: booleanFrom(raw.v4HookAddress),
    v4NonEmptyHookData: booleanFrom(raw.v4NonEmptyHookData),
    v4MultiHopPathKeys: booleanFrom(raw.v4MultiHopPathKeys),
    split: booleanFrom(raw.split),
    splitThenMerge: booleanFrom(raw.splitThenMerge),
  };
}

function parseBlockedReadiness(
  value: unknown,
): FameSwapNotLiveReadyQuote["readiness"] {
  const raw = asRecord(value);
  return {
    status: "not_live_ready",
    reason: String(raw.reason ?? "read_error") as FameSwapNotLiveReadyQuote["readiness"]["reason"],
    message: String(raw.message ?? "FAME router is not live-ready."),
    routerAddress: addressFrom(raw.routerAddress, null),
  };
}

function displaySafeErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  return (
    raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0) ?? "FAME quote request failed."
  );
}

function quoteAdapterFailure(
  input: DeserializeQuoteInput,
  message: string,
): FameSwapQuote {
  return {
    status: "quote_adapter_failure",
    tokenIn: input.tokenIn,
    tokenOut: input.tokenOut,
    requestedAmountIn: input.amountIn,
    rejectedCandidates: [
      {
        candidateId: "api-runner",
        reason: "adapter_failure",
        message,
      },
    ],
    message,
    diagnosticsVisibleByDefault: true,
  };
}

export function deserializeFameSwapQuoteResponse(
  data: unknown,
  input: DeserializeQuoteInput,
): FameSwapQuote {
  const raw = asRecord(data);
  const status = raw.status;
  const message = String(raw.message ?? "FAME quote unavailable.");
  const requestedAmountIn = bigintFrom(raw.requestedAmountIn, input.amountIn);

  if (status === "ready") {
    const route = routeFromJson(raw.route as JsonFameRoute);
    const routerAddress = addressFrom(raw.routerAddress, input.config.routerAddress);
    const routeHash = String(raw.routeHash ?? raw.materializedRouteHash ?? "0x") as Hex;
    if (!routerAddress || !isHex(routeHash) || routeHash === "0x") {
      return quoteAdapterFailure(input, "FAME quote response was malformed.");
    }

    return {
      status: "ready",
      tokenIn: input.tokenIn,
      tokenOut: input.tokenOut,
      requestedAmountIn,
      routerAddress,
      routeArtifactId: String(raw.routeArtifactId ?? "generated"),
      routeSource: raw.routeSource === "artifact" ? "artifact" : "generated",
      fixtureRouteHash: routeHash,
      materializedRouteHash: routeHash,
      poolIds: Array.isArray(raw.poolIds) ? raw.poolIds.map(String) : [],
      route,
      approval: input.tokenIn.native
        ? null
        : {
            token: input.tokenIn,
            spender: routerAddress,
            amount: route.amountIn,
          },
      callValue: input.tokenIn.native ? route.amountIn : bigintFrom(raw.callValue),
      grossEstimatedOutput: bigintFrom(raw.grossEstimatedOutput),
      routerFeeAmount: bigintFrom(raw.routerFeeAmount),
      estimatedOutput: bigintFrom(raw.estimatedOutput),
      minAmountOutAfterFee: bigintFrom(raw.minAmountOutAfterFee),
      feeBreakdown: parseFeeBreakdown(raw.feeBreakdown),
      quoteContext: parseQuoteContext(raw.quoteContext),
      feePpm: bigintFrom(raw.feePpm),
      capabilities: parseCapabilities(raw.capabilities),
      routeDisplay: Array.isArray(raw.routeDisplay)
        ? (raw.routeDisplay as FameSwapRouteDisplayLeg[])
        : [],
      rejectedCandidates: parseRejections(raw.rejectedCandidates),
      slippageBps: numberFrom(raw.slippageBps, input.config.defaultSlippageBps),
      expiresAt: new Date(String(raw.expiresAt ?? Date.now())),
      warnings: Array.isArray(raw.warnings) ? raw.warnings.map(String) : [],
      message,
      diagnosticsVisibleByDefault: booleanFrom(raw.diagnosticsVisibleByDefault),
    };
  }

  if (status === "unsupported") {
    return {
      status: "unsupported",
      tokenIn: input.tokenIn,
      tokenOut: input.tokenOut,
      requestedAmountIn,
      availableDirections: supportedDirections(),
      message,
      diagnosticsVisibleByDefault: booleanFrom(raw.diagnosticsVisibleByDefault, true),
    };
  }

  if (status === "not_live_ready") {
    return {
      status: "not_live_ready",
      tokenIn: input.tokenIn,
      tokenOut: input.tokenOut,
      requestedAmountIn,
      readiness: parseBlockedReadiness(raw.readiness),
      message,
      diagnosticsVisibleByDefault: booleanFrom(raw.diagnosticsVisibleByDefault, true),
    };
  }

  if (status === "stale_artifact") {
    return {
      status: "stale_artifact",
      tokenIn: input.tokenIn,
      tokenOut: input.tokenOut,
      requestedAmountIn,
      reason: String(raw.reason ?? message),
      message,
      diagnosticsVisibleByDefault: booleanFrom(raw.diagnosticsVisibleByDefault, true),
    };
  }

  if (status === "no_safe_route") {
    return {
      status: "no_safe_route",
      tokenIn: input.tokenIn,
      tokenOut: input.tokenOut,
      requestedAmountIn,
      rejectedCandidates: parseRejections(raw.rejectedCandidates),
      message,
      diagnosticsVisibleByDefault: booleanFrom(raw.diagnosticsVisibleByDefault, true),
    };
  }

  if (status === "simulation_failure") {
    return {
      status: "simulation_failure",
      tokenIn: input.tokenIn,
      tokenOut: input.tokenOut,
      requestedAmountIn,
      reason: String(raw.reason ?? message),
      rejectedCandidates: parseRejections(raw.rejectedCandidates),
      message,
      diagnosticsVisibleByDefault: booleanFrom(raw.diagnosticsVisibleByDefault, true),
    };
  }

  return {
    status: "quote_adapter_failure",
    tokenIn: input.tokenIn,
    tokenOut: input.tokenOut,
    requestedAmountIn,
    rejectedCandidates: parseRejections(raw.rejectedCandidates),
    message,
    diagnosticsVisibleByDefault: booleanFrom(raw.diagnosticsVisibleByDefault, true),
  };
}

function quoteKey(input: UseFameSwapQuoteInput): string | null {
  if (input.amountIn === null) return null;
  return [
    input.tokenIn.address.toLowerCase(),
    input.tokenOut.address.toLowerCase(),
    input.amountIn.toString(),
    input.recipient?.toLowerCase() ?? "no-recipient",
    input.config.routerAddress?.toLowerCase() ?? "no-router",
    input.config.defaultSlippageBps.toString(),
    input.deadlineMinutes.toString(),
    input.readiness.status,
    input.readiness.status === "ready"
      ? input.readiness.feePpm.toString()
      : input.readiness.reason,
  ].join(":");
}

function localBlockedQuote(input: UseFameSwapQuoteInput): FameSwapQuote | null {
  if (input.amountIn === null) return null;
  const request: FameSwapQuoteRequest = {
    tokenIn: input.tokenIn,
    tokenOut: input.tokenOut,
    amountIn: input.amountIn,
    recipient: input.recipient,
    config: input.config,
    readiness: input.readiness,
    deadlineSeconds: deadlineMinutesToSeconds(input.deadlineMinutes),
  };
  return quoteFameSwap(request);
}

export function useFameSwapQuote(
  input: UseFameSwapQuoteInput,
): UseFameSwapQuoteResult {
  const {
    tokenIn,
    tokenOut,
    amountIn,
    recipient,
    config,
    readiness,
    deadlineMinutes,
  } = input;
  const key = useMemo(
    () =>
      quoteKey({
        tokenIn,
        tokenOut,
        amountIn,
        recipient,
        config,
        readiness,
        deadlineMinutes,
      }),
    [amountIn, config, deadlineMinutes, readiness, recipient, tokenIn, tokenOut],
  );
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [quote, setQuote] = useState<FameSwapQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (amountIn === null || key === null) {
      setQuote(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (readiness.status !== "ready" || !recipient) {
      setQuote(
        localBlockedQuote({
          tokenIn,
          tokenOut,
          amountIn,
          recipient,
          config,
          readiness,
          deadlineMinutes,
        }),
      );
      setIsLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;
    setQuote(null);
    setIsLoading(true);
    setError(null);

    fetch("/api/fame/swap/quote", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        tokenIn: tokenIn.address,
        tokenOut: tokenOut.address,
        amountIn: amountIn.toString(),
        recipient,
        slippageBps: config.defaultSlippageBps,
        deadlineMinutes,
      }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(String(data.error ?? "FAME quote request failed."));
        }
        return deserializeFameSwapQuoteResponse(data, {
          tokenIn,
          tokenOut,
          amountIn,
          config,
        });
      })
      .then((nextQuote) => {
        if (cancelled) return;
        setQuote(nextQuote);
        setIsLoading(false);
      })
      .catch((fetchError) => {
        if (cancelled || fetchError?.name === "AbortError") return;
        const nextError =
          fetchError instanceof Error
            ? fetchError
            : new Error("FAME quote request failed.");
        setError(nextError);
        setQuote(
          quoteAdapterFailure(
            {
              tokenIn,
              tokenOut,
              amountIn,
              config,
            },
            displaySafeErrorMessage(nextError),
          ),
        );
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [
    amountIn,
    config,
    deadlineMinutes,
    key,
    readiness,
    recipient,
    refreshNonce,
    tokenIn,
    tokenOut,
  ]);

  const refresh = useCallback(() => {
    setRefreshNonce((current) => current + 1);
  }, []);

  return {
    quote,
    isLoading,
    error,
    quoteKey: key,
    refresh,
  };
}
