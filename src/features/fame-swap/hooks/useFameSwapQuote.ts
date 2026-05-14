"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import type { FameSwapConfig } from "../config";
import { deadlineMinutesToSeconds } from "../solver/deadline";
import { quoteFameSwap } from "../solver/quote";
import {
  deserializeFameSwapQuoteResponse,
  displaySafeErrorMessage,
  quoteAdapterFailure,
} from "../solver/quoteWire";
import type {
  FameSwapQuote,
  FameSwapQuoteRequest,
  FameSwapReadiness,
} from "../solver/types";
import type { FameSwapToken } from "../tokens";

export type FameSwapQuoteQueryKey = readonly [
  "fame-swap-quote",
  {
    readonly tokenIn: Address;
    readonly tokenOut: Address;
    readonly amountIn: string | null;
    readonly recipient: string | null;
    readonly routerAddress: string | null;
    readonly slippageBps: number;
    readonly deadlineMinutes: number;
    readonly readiness: string;
    readonly refreshNonce: number;
  },
];

export const FAME_SWAP_QUOTE_DEBOUNCE_MS = 350;

export type FameSwapRemoteQuoteInput = UseFameSwapQuoteInput & {
  amountIn: bigint;
  recipient: Address | null;
  readiness: Extract<FameSwapReadiness, { status: "ready" }>;
};

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

function quoteKey(
  input: UseFameSwapQuoteInput,
  refreshNonce: number,
): string | null {
  if (input.amountIn === null) return null;
  const queryKey = fameSwapQuoteQueryKey(input, refreshNonce)[1];

  return [
    ...quoteIdentityParts(queryKey),
    queryKey.refreshNonce.toString(),
  ].join(":");
}

function quoteIdentityParts(
  queryKey: FameSwapQuoteQueryKey[1],
): readonly string[] {
  return [
    queryKey.tokenIn,
    queryKey.tokenOut,
    queryKey.amountIn ?? "no-amount",
    queryKey.recipient ?? "no-recipient",
    queryKey.routerAddress ?? "no-router",
    queryKey.slippageBps.toString(),
    queryKey.deadlineMinutes.toString(),
    queryKey.readiness,
  ];
}

export function fameSwapQuoteInputKey(
  input: UseFameSwapQuoteInput,
): string | null {
  if (input.amountIn === null) return null;
  return quoteIdentityParts(fameSwapQuoteQueryKey(input, 0)[1]).join(":");
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => clearTimeout(timeout);
  }, [delayMs, value]);

  return debouncedValue;
}

function readinessKey(readiness: FameSwapReadiness): string {
  if (readiness.status === "ready") {
    return [
      "ready",
      readiness.routerAddress.toLowerCase(),
      readiness.feePpm.toString(),
    ].join(":");
  }

  return [
    readiness.status,
    readiness.reason,
    readiness.routerAddress?.toLowerCase() ?? "no-router",
  ].join(":");
}

export function fameSwapQuoteQueryKey(
  input: UseFameSwapQuoteInput,
  refreshNonce: number,
): FameSwapQuoteQueryKey {
  return [
    "fame-swap-quote",
    {
      tokenIn: input.tokenIn.address.toLowerCase() as Address,
      tokenOut: input.tokenOut.address.toLowerCase() as Address,
      amountIn: input.amountIn?.toString() ?? null,
      recipient: input.recipient?.toLowerCase() ?? null,
      routerAddress:
        input.readiness.status === "ready"
          ? input.readiness.routerAddress.toLowerCase()
          : input.config.routerAddress?.toLowerCase() ?? null,
      slippageBps: input.config.defaultSlippageBps,
      deadlineMinutes: input.deadlineMinutes,
      readiness: readinessKey(input.readiness),
      refreshNonce,
    },
  ];
}

export function fameSwapRemoteQuoteInput(
  input: UseFameSwapQuoteInput,
): FameSwapRemoteQuoteInput | null {
  if (input.amountIn === null) return null;
  if (input.readiness.status !== "ready") return null;

  return {
    ...input,
    amountIn: input.amountIn,
    recipient: input.recipient,
    readiness: input.readiness,
  };
}

export function fameSwapRemoteQuoteEnabled(
  input: UseFameSwapQuoteInput,
): boolean {
  return fameSwapRemoteQuoteInput(input) !== null;
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

export async function fetchFameSwapRemoteQuote(
  input: FameSwapRemoteQuoteInput,
  signal: AbortSignal,
): Promise<FameSwapQuote> {
  const response = await fetch("/api/fame/swap/quote", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      tokenIn: input.tokenIn.address,
      tokenOut: input.tokenOut.address,
      amountIn: input.amountIn.toString(),
      recipient: input.recipient,
      slippageBps: input.config.defaultSlippageBps,
      deadlineMinutes: input.deadlineMinutes,
    }),
    signal,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      displaySafeErrorMessage(
        new Error(String(data.error ?? "FAME quote request failed.")),
      ),
    );
  }

  return deserializeFameSwapQuoteResponse(data, {
    tokenIn: input.tokenIn,
    tokenOut: input.tokenOut,
    amountIn: input.amountIn,
    config: input.config,
  });
}

function queryFailureQuote(
  input: FameSwapRemoteQuoteInput,
  error: Error,
): FameSwapQuote {
  return quoteAdapterFailure(
    {
      tokenIn: input.tokenIn,
      tokenOut: input.tokenOut,
      amountIn: input.amountIn,
      config: input.config,
    },
    displaySafeErrorMessage(error),
  );
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
  const [refreshNonce, setRefreshNonce] = useState(0);
  const currentInput = useMemo(
    () => ({
      tokenIn,
      tokenOut,
      amountIn,
      recipient,
      config,
      readiness,
      deadlineMinutes,
    }),
    [
      amountIn,
      config,
      deadlineMinutes,
      readiness,
      recipient,
      tokenIn,
      tokenOut,
    ],
  );
  const debouncedInput = useDebouncedValue(
    currentInput,
    FAME_SWAP_QUOTE_DEBOUNCE_MS,
  );
  const key = useMemo(
    () => quoteKey(currentInput, refreshNonce),
    [currentInput, refreshNonce],
  );
  const inputKey = useMemo(
    () => fameSwapQuoteInputKey(currentInput),
    [currentInput],
  );
  const debouncedInputKey = useMemo(
    () => fameSwapQuoteInputKey(debouncedInput),
    [debouncedInput],
  );
  const queryKey = useMemo(
    () => fameSwapQuoteQueryKey(debouncedInput, refreshNonce),
    [debouncedInput, refreshNonce],
  );
  const currentRemoteInput = useMemo(
    () => fameSwapRemoteQuoteInput(currentInput),
    [currentInput],
  );
  const debouncedRemoteInput = useMemo(
    () => fameSwapRemoteQuoteInput(debouncedInput),
    [debouncedInput],
  );
  const quoteDebouncing =
    currentRemoteInput !== null && inputKey !== debouncedInputKey;
  const query = useQuery<FameSwapQuote, Error>({
    queryKey,
    enabled: debouncedRemoteInput !== null && !quoteDebouncing,
    queryFn: ({ signal }) => {
      if (!debouncedRemoteInput) {
        throw new Error("FAME quote query is disabled.");
      }
      return fetchFameSwapRemoteQuote(debouncedRemoteInput, signal);
    },
    retry: false,
    refetchOnWindowFocus: false,
  });
  const localQuote = useMemo(
    () => (currentRemoteInput ? null : localBlockedQuote(currentInput)),
    [currentInput, currentRemoteInput],
  );

  const refresh = useCallback(() => {
    setRefreshNonce((current) => current + 1);
  }, []);
  const queryError =
    !quoteDebouncing && debouncedRemoteInput && query.error
      ? query.error
      : null;
  const remoteQuote =
    !quoteDebouncing && debouncedRemoteInput && queryError
      ? queryFailureQuote(debouncedRemoteInput, queryError)
      : !quoteDebouncing
        ? query.data ?? null
        : null;

  return {
    quote: currentRemoteInput ? remoteQuote : localQuote,
    isLoading:
      currentRemoteInput !== null &&
      (quoteDebouncing ||
        (query.isFetching && query.data === undefined && !queryError)),
    error: queryError,
    quoteKey: key,
    refresh,
  };
}
