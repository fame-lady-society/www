"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Hash } from "viem";
import { base } from "viem/chains";
import {
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { hashFameRoute } from "../router/encodeRoute";
import type { FameSwapQuote } from "../solver/types";
import { applySlippageToAmount } from "../solver/slippage";
import { fameRouterAbi } from "../router/abi";
import {
  fameSwapTransactionRequests,
  type FameSwapTransactionRequests,
} from "../transactions";

export type FameSwapSubmissionKind = "approval" | "swap";

export interface FameSwapTransactionState {
  requests: FameSwapTransactionRequests;
  approvalConfirmed: boolean;
  swapConfirmed: boolean;
  reverted: boolean;
  submitting: boolean;
  canApprove: boolean;
  canSwap: boolean;
  quoteExpired: boolean;
  simulatedOutput: bigint | null;
  protectedMinimum: bigint | null;
  protectedRouteHash: Hash | null;
  hash: Hash | null;
  error: Error | null;
  submitApproval: () => Promise<Hash | null>;
  submitSwap: () => Promise<Hash | null>;
}

function quoteExecutionKey(quote: FameSwapQuote | null): string {
  if (quote?.status !== "ready") return "blocked";

  return [
    quote.routeArtifactId,
    quote.materializedRouteHash,
    quote.approval?.token.address ?? "native",
    quote.approval?.amount.toString() ?? "0",
  ].join(":");
}

export function useFameSwapTransaction(
  quote: FameSwapQuote | null,
): FameSwapTransactionState {
  const requests = useMemo(() => fameSwapTransactionRequests(quote), [quote]);
  const executionKey = quoteExecutionKey(quote);
  const { writeContractAsync } = useWriteContract();
  const [hash, setHash] = useState<Hash | null>(null);
  const [submissionKind, setSubmissionKind] =
    useState<FameSwapSubmissionKind | null>(null);
  const [approvalConfirmed, setApprovalConfirmed] = useState(false);
  const [swapConfirmed, setSwapConfirmed] = useState(false);
  const [localError, setLocalError] = useState<Error | null>(null);
  const [writing, setWriting] = useState(false);
  const [nowSeconds, setNowSeconds] = useState(() =>
    Math.floor(Date.now() / 1000),
  );
  const swapContract = requests.swap?.contract;
  const quoteExpired =
    quote?.status === "ready" && BigInt(nowSeconds) >= quote.route.deadline;
  const swapSimulationEnabled =
    requests.swap !== null &&
    (requests.approval === null || approvalConfirmed) &&
    !swapConfirmed &&
    !quoteExpired;

  const swapSimulation = useSimulateContract({
    address: swapContract?.address,
    abi: fameRouterAbi,
    functionName: "executeRoute",
    args: swapContract?.args,
    value: swapContract?.value ?? 0n,
    chainId: base.id,
    query: {
      enabled: swapSimulationEnabled,
    },
  });

  const simulatedOutput =
    typeof swapSimulation.data?.result === "bigint"
      ? swapSimulation.data.result
      : null;
  const protectedMinimum =
    quote?.status === "ready" && simulatedOutput !== null
      ? applySlippageToAmount(simulatedOutput, quote.slippageBps)
      : null;
  const protectedRoute = useMemo(() => {
    if (quote?.status !== "ready" || protectedMinimum === null) return null;

    return {
      ...quote.route,
      minAmountOutAfterFee: protectedMinimum,
    };
  }, [protectedMinimum, quote]);
  const protectedRouteHash = useMemo(() => {
    if (!protectedRoute) return null;
    return hashFameRoute(protectedRoute);
  }, [protectedRoute]);
  const protectedRequests = useMemo(
    () =>
      quote?.status === "ready" && protectedRoute && protectedRouteHash
        ? fameSwapTransactionRequests(quote, {
            route: protectedRoute,
            materializedRouteHash: protectedRouteHash,
          })
        : fameSwapTransactionRequests(null),
    [protectedRoute, protectedRouteHash, quote],
  );
  const protectedSwapContract = protectedRequests.swap?.contract;
  const protectedSimulationEnabled =
    protectedRequests.swap !== null &&
    swapSimulation.isSuccess &&
    (requests.approval === null || approvalConfirmed) &&
    !swapConfirmed &&
    !quoteExpired;

  const protectedSimulation = useSimulateContract({
    address: protectedSwapContract?.address,
    abi: fameRouterAbi,
    functionName: "executeRoute",
    args: protectedSwapContract?.args,
    value: protectedSwapContract?.value ?? 0n,
    chainId: base.id,
    query: {
      enabled: protectedSimulationEnabled,
    },
  });

  const receipt = useWaitForTransactionReceipt({
    hash: hash ?? undefined,
    chainId: base.id,
    query: {
      enabled: hash !== null,
    },
  });

  useEffect(() => {
    setHash(null);
    setSubmissionKind(null);
    setApprovalConfirmed(false);
    setSwapConfirmed(false);
    setLocalError(null);
    setWriting(false);
  }, [executionKey]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNowSeconds(Math.floor(Date.now() / 1000));
    }, 1_000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const receiptStatus = receipt.data?.status;

  useEffect(() => {
    if (!receipt.isSuccess || !receiptStatus) return;

    if (receiptStatus === "reverted") {
      setLocalError(new Error("Transaction reverted on Base."));
      setSubmissionKind(null);
      return;
    }

    if (submissionKind === "approval") {
      setApprovalConfirmed(true);
      setHash(null);
      setSubmissionKind(null);
    }

    if (submissionKind === "swap") {
      setSwapConfirmed(true);
    }
  }, [receipt.isSuccess, receiptStatus, submissionKind]);

  useEffect(() => {
    if (receipt.isError) {
      setLocalError(
        receipt.error instanceof Error
          ? receipt.error
          : new Error("Transaction receipt failed."),
      );
    }
  }, [receipt.error, receipt.isError]);

  const submitApproval = useCallback(async (): Promise<Hash | null> => {
    if (!requests.approval) return null;

    setWriting(true);
    setLocalError(null);
    setSubmissionKind("approval");

    try {
      const txHash = await writeContractAsync(requests.approval.contract);
      setHash(txHash);
      return txHash;
    } catch (error) {
      setSubmissionKind(null);
      setLocalError(
        error instanceof Error ? error : new Error("Approval transaction failed."),
      );
      return null;
    } finally {
      setWriting(false);
    }
  }, [requests.approval, writeContractAsync]);

  const submitSwap = useCallback(async (): Promise<Hash | null> => {
    if (!protectedRequests.swap) return null;
    if (requests.approval && !approvalConfirmed) return null;
    if (!protectedSimulation.data?.request) return null;

    setWriting(true);
    setLocalError(null);
    setSubmissionKind("swap");

    try {
      const txHash = await writeContractAsync(protectedSimulation.data.request);
      setHash(txHash);
      return txHash;
    } catch (error) {
      setSubmissionKind(null);
      setLocalError(
        error instanceof Error ? error : new Error("Swap transaction failed."),
      );
      return null;
    } finally {
      setWriting(false);
    }
  }, [
    approvalConfirmed,
    requests.approval,
    protectedRequests.swap,
    protectedSimulation.data?.request,
    writeContractAsync,
  ]);

  const receiptPending = Boolean(hash) && receipt.isLoading;
  const reverted = receipt.isError || localError !== null;
  const submitting = writing || receiptPending;
  const canApprove = requests.approval !== null && !submitting && !quoteExpired;
  const canSwap =
    protectedRequests.swap !== null &&
    !submitting &&
    !quoteExpired &&
    (requests.approval === null || approvalConfirmed) &&
    protectedSimulation.isSuccess;

  return {
    requests,
    approvalConfirmed,
    swapConfirmed,
    reverted,
    submitting,
    canApprove,
    canSwap,
    quoteExpired,
    simulatedOutput,
    protectedMinimum,
    protectedRouteHash,
    hash,
    error:
      localError ??
      (protectedSimulation.isError && protectedSimulation.error instanceof Error
        ? protectedSimulation.error
        : null) ??
      (swapSimulation.isError && swapSimulation.error instanceof Error
        ? swapSimulation.error
        : null),
    submitApproval,
    submitSwap,
  };
}
