"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  decodeFunctionResult,
  encodeFunctionData,
  type Address,
  type Hash,
} from "viem";
import { simulateCalls } from "viem/actions";
import { base } from "viem/chains";
import {
  usePublicClient,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { hashFameRoute } from "../router/encodeRoute";
import type { FameSwapQuote } from "../solver/types";
import { applySlippageToAmount } from "../solver/slippage";
import { fameRouterAbi } from "../router/abi";
import { erc20ApprovalAbi } from "../router/erc20Abi";
import { fameRouteToCall } from "../router/callRoute";
import {
  fameSwapTransactionRequests,
  type FameSwapTransactionRequests,
} from "../transactions";

export type FameSwapSubmissionKind = "approval" | "swap";

export interface FameSwapPreApprovalSimulationError {
  reason: "unsupported_rpc" | "simulation_failed";
  message: string;
}

export interface FameSwapTransactionState {
  requests: FameSwapTransactionRequests;
  submissionKind: FameSwapSubmissionKind | null;
  approvalConfirmed: boolean;
  approvalPending: boolean;
  swapConfirmed: boolean;
  swapPending: boolean;
  reverted: boolean;
  submitting: boolean;
  canApprove: boolean;
  canSwap: boolean;
  quoteExpired: boolean;
  simulatedOutput: bigint | null;
  protectedMinimum: bigint | null;
  protectedRouteHash: Hash | null;
  protectedSimulationPending: boolean;
  protectedSimulationReady: boolean;
  preApprovalSimulationError: FameSwapPreApprovalSimulationError | null;
  hash: Hash | null;
  error: Error | null;
  submitApproval: () => Promise<Hash | null>;
  submitSwap: () => Promise<Hash | null>;
  reset: () => void;
}

function preApprovalSimulationError(
  error: unknown,
): FameSwapPreApprovalSimulationError {
  const message = error instanceof Error ? error.message : String(error);
  const unsupported =
    /\beth_simulateV1\b|simulateCalls|method not found|not supported|unsupported|does not exist|not available/i.test(
      message,
    );

  return unsupported
    ? {
        reason: "unsupported_rpc",
        message: "Wallet RPC does not support bundled quote simulation.",
      }
    : {
        reason: "simulation_failed",
        message: "Bundled approval-plus-swap quote simulation failed.",
      };
}

function quoteExecutionKey(quote: FameSwapQuote | null): string {
  if (quote?.status !== "ready") return "blocked";

  return [
    quote.routeArtifactId,
    quote.materializedRouteHash,
    quote.routerAddress,
    quote.route.recipient,
    quote.route.deadline.toString(),
    quote.approval?.token.address ?? "native",
    quote.approval?.spender ?? quote.routerAddress,
    quote.approval?.amount.toString() ?? "0",
  ].join(":");
}

export function useFameSwapTransaction(
  quote: FameSwapQuote | null,
  account?: Address,
): FameSwapTransactionState {
  const requests = useMemo(() => fameSwapTransactionRequests(quote), [quote]);
  const executionKey = quoteExecutionKey(quote);
  const publicClient = usePublicClient({ chainId: base.id });
  const { writeContractAsync } = useWriteContract();
  const [hash, setHash] = useState<Hash | null>(null);
  const [submissionKind, setSubmissionKind] =
    useState<FameSwapSubmissionKind | null>(null);
  const [approvalConfirmed, setApprovalConfirmed] = useState(false);
  const [swapConfirmed, setSwapConfirmed] = useState(false);
  const [localError, setLocalError] = useState<Error | null>(null);
  const [writing, setWriting] = useState(false);
  const [approvalFlowActive, setApprovalFlowActive] = useState(false);
  const [approvalSimulationOutput, setApprovalSimulationOutput] = useState<
    bigint | null
  >(null);
  const [approvalSimulationPending, setApprovalSimulationPending] =
    useState(false);
  const [approvalSimulationError, setApprovalSimulationError] =
    useState<FameSwapPreApprovalSimulationError | null>(null);
  const autoSwapSubmitted = useRef(false);
  const inFlightSubmission = useRef<FameSwapSubmissionKind | null>(null);
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

  const directSimulatedOutput =
    typeof swapSimulation.data?.result === "bigint"
      ? swapSimulation.data.result
      : null;
  const simulatedOutput = directSimulatedOutput ?? approvalSimulationOutput;
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
    setApprovalFlowActive(false);
    setApprovalSimulationOutput(null);
    setApprovalSimulationPending(false);
    setApprovalSimulationError(null);
    autoSwapSubmitted.current = false;
    inFlightSubmission.current = null;
  }, [executionKey]);

  const reset = useCallback(() => {
    setHash(null);
    setSubmissionKind(null);
    setApprovalConfirmed(false);
    setSwapConfirmed(false);
    setLocalError(null);
    setWriting(false);
    setApprovalFlowActive(false);
    setApprovalSimulationOutput(null);
    setApprovalSimulationPending(false);
    setApprovalSimulationError(null);
    autoSwapSubmitted.current = false;
    inFlightSubmission.current = null;
  }, []);

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
    let cancelled = false;

    async function simulateApprovalThenSwap() {
      if (
        !publicClient ||
        !account ||
        quote?.status !== "ready" ||
        !requests.approval ||
        !requests.swap ||
        approvalConfirmed ||
        swapConfirmed ||
        quoteExpired
      ) {
        setApprovalSimulationOutput(null);
        setApprovalSimulationPending(false);
        setApprovalSimulationError(null);
        return;
      }

      setApprovalSimulationPending(true);
      setApprovalSimulationError(null);

      try {
        const approval = requests.approval.contract;
        const swap = requests.swap.contract;
        const result = await simulateCalls(publicClient, {
          account,
          calls: [
            {
              to: approval.address,
              data: encodeFunctionData({
                abi: erc20ApprovalAbi,
                functionName: "approve",
                args: approval.args,
              }),
            },
            {
              to: swap.address,
              data: encodeFunctionData({
                abi: fameRouterAbi,
                functionName: "executeRoute",
                args: [fameRouteToCall(quote.route)],
              }),
              value: swap.value,
            },
          ],
        });

        if (cancelled) return;

        const swapResult = result.results[1];
        if (!swapResult || swapResult.status !== "success") {
          throw new Error("Bundled quote simulation failed.");
        }

        const output = decodeFunctionResult({
          abi: fameRouterAbi,
          functionName: "executeRoute",
          data: swapResult.data,
        });

        setApprovalSimulationOutput(typeof output === "bigint" ? output : null);
        setApprovalSimulationError(null);
      } catch (error) {
        if (cancelled) return;
        // Some RPCs do not expose eth_simulateV1. Keep this non-blocking; the
        // post-approval protected simulation will still gate the actual swap.
        setApprovalSimulationOutput(null);
        setApprovalSimulationError(preApprovalSimulationError(error));
      } finally {
        if (!cancelled) setApprovalSimulationPending(false);
      }
    }

    void simulateApprovalThenSwap();

    return () => {
      cancelled = true;
    };
  }, [
    account,
    approvalConfirmed,
    publicClient,
    quote,
    quoteExpired,
    requests.approval,
    requests.swap,
    swapConfirmed,
  ]);

  useEffect(() => {
    if (!receipt.isSuccess || !receiptStatus) return;

    if (receiptStatus === "reverted") {
      setLocalError(new Error("Transaction reverted on Base."));
      setSubmissionKind(null);
      setApprovalFlowActive(false);
      inFlightSubmission.current = null;
      return;
    }

    if (submissionKind === "approval") {
      setApprovalConfirmed(true);
      setHash(null);
      setSubmissionKind(null);
      inFlightSubmission.current = null;
    }

    if (submissionKind === "swap") {
      setSwapConfirmed(true);
      setApprovalFlowActive(false);
      inFlightSubmission.current = null;
    }
  }, [receipt.isSuccess, receiptStatus, submissionKind]);

  useEffect(() => {
    if (receipt.isError) {
      inFlightSubmission.current = null;
      setLocalError(
        receipt.error instanceof Error
          ? receipt.error
          : new Error("Transaction receipt failed."),
      );
    }
  }, [receipt.error, receipt.isError]);

  const submitApproval = useCallback(async (): Promise<Hash | null> => {
    if (!requests.approval) return null;
    if (inFlightSubmission.current !== null) return null;

    inFlightSubmission.current = "approval";
    setWriting(true);
    setLocalError(null);
    setSubmissionKind("approval");
    setApprovalFlowActive(true);
    autoSwapSubmitted.current = false;

    try {
      const txHash = await writeContractAsync(requests.approval.contract);
      setHash(txHash);
      return txHash;
    } catch (error) {
      inFlightSubmission.current = null;
      setSubmissionKind(null);
      setApprovalFlowActive(false);
      setLocalError(
        error instanceof Error
          ? error
          : new Error("Approval transaction failed."),
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
    if (inFlightSubmission.current !== null) return null;

    inFlightSubmission.current = "swap";
    setWriting(true);
    setLocalError(null);
    setSubmissionKind("swap");

    try {
      const txHash = await writeContractAsync(protectedSimulation.data.request);
      setHash(txHash);
      return txHash;
    } catch (error) {
      inFlightSubmission.current = null;
      setSubmissionKind(null);
      setApprovalFlowActive(false);
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

  useEffect(() => {
    if (!approvalFlowActive || autoSwapSubmitted.current) return;
    if (!approvalConfirmed || !protectedSimulation.data?.request) return;
    if (quoteExpired || swapConfirmed || writing || receipt.isLoading) return;
    if (localError !== null) return;

    autoSwapSubmitted.current = true;
    void submitSwap();
  }, [
    approvalConfirmed,
    approvalFlowActive,
    localError,
    protectedSimulation.data?.request,
    quoteExpired,
    receipt.isLoading,
    submitSwap,
    swapConfirmed,
    writing,
  ]);

  const receiptPending = Boolean(hash) && receipt.isLoading;
  const reverted = receipt.isError || receiptStatus === "reverted";
  const submitting = writing || receiptPending;
  const approvalPending =
    submissionKind === "approval" && (writing || receiptPending);
  const swapPending = submissionKind === "swap" && (writing || receiptPending);
  const canApprove =
    requests.approval !== null &&
    !approvalConfirmed &&
    !submitting &&
    !quoteExpired;
  const canSwap =
    protectedRequests.swap !== null &&
    !submitting &&
    !quoteExpired &&
    (requests.approval === null || approvalConfirmed) &&
    protectedSimulation.isSuccess;

  return {
    requests,
    submissionKind,
    approvalConfirmed,
    approvalPending,
    swapConfirmed,
    swapPending,
    reverted,
    submitting,
    canApprove,
    canSwap,
    quoteExpired,
    simulatedOutput,
    protectedMinimum,
    protectedRouteHash,
    protectedSimulationPending:
      (protectedSimulationEnabled && protectedSimulation.isLoading) ||
      approvalSimulationPending,
    protectedSimulationReady:
      protectedSimulation.isSuccess || approvalSimulationOutput !== null,
    preApprovalSimulationError: approvalSimulationError,
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
    reset,
  };
}
