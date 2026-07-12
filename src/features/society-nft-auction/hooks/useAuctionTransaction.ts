"use client";

import { useCallback, useReducer, useRef } from "react";
import type { Address, Hash } from "viem";
import type { ReplacementReason } from "viem/actions";
import { base } from "viem/chains";
import { usePublicClient, useWriteContract } from "wagmi";
import { societyNftAuctionAbi } from "../../../wagmi";
import {
  auctionTransactionReducer,
  classifyAuctionTransactionError,
  createAuctionSubmissionGate,
  initialAuctionTransactionState,
  type AuctionErrorStage,
  type AuctionTransactionAction,
  type AuctionTransactionError,
  type AuctionTransactionEvent,
  type AuctionTransactionState,
} from "../transactionState";

export interface BuildAuctionTransactionRequestBase {
  action: AuctionTransactionAction;
  auctionAddress: Address;
  account: Address;
  value?: bigint;
}

export type AuctionBidRequest = {
  abi: typeof societyNftAuctionAbi;
  address: Address;
  account: Address;
  chainId: typeof base.id;
  functionName: "bid";
  value: bigint;
};

export type AuctionSettleRequest = {
  abi: typeof societyNftAuctionAbi;
  address: Address;
  account: Address;
  chainId: typeof base.id;
  functionName: "settle";
};

export type AuctionTransactionRequest =
  | AuctionBidRequest
  | AuctionSettleRequest;

export function buildAuctionTransactionRequest({
  action,
  auctionAddress,
  account,
  value,
}: BuildAuctionTransactionRequestBase): AuctionTransactionRequest {
  const baseRequest = {
    abi: societyNftAuctionAbi,
    address: auctionAddress,
    account,
    chainId: base.id,
  } as const;

  if (action === "bid") {
    if (typeof value !== "bigint" || value <= 0n) {
      throw new Error("A bid requires an exact positive native ETH value");
    }
    return { ...baseRequest, functionName: "bid", value };
  }

  return { ...baseRequest, functionName: "settle" };
}

export interface AuctionReplacement {
  reason: ReplacementReason;
  hash: Hash;
}

export interface AuctionReceipt {
  status: "success" | "reverted";
}

export interface ExecuteAuctionTransactionDependencies {
  dispatch: (event: AuctionTransactionEvent) => void;
  simulate: (
    request: AuctionTransactionRequest,
  ) => Promise<AuctionTransactionRequest>;
  write: (request: AuctionTransactionRequest) => Promise<Hash>;
  wait: (
    hash: Hash,
    onReplaced: (replacement: AuctionReplacement) => void,
  ) => Promise<AuctionReceipt>;
  refresh: () => Promise<void>;
  isActionResolved?: () => boolean | Promise<boolean>;
}

export type ExecuteAuctionTransactionResult =
  | { status: "confirmed"; hash: Hash; replacement: AuctionReplacement | null }
  | { status: "resolved_by_refresh" }
  | { status: "failed"; error: AuctionTransactionError };

function receiptRevertedError(): AuctionTransactionError {
  return {
    kind: "receipt_reverted",
    message: "The transaction reverted onchain.",
    retryable: true,
    shouldRefresh: true,
  };
}

export async function executeAuctionTransaction(
  request: AuctionTransactionRequest,
  dependencies: ExecuteAuctionTransactionDependencies,
): Promise<ExecuteAuctionTransactionResult> {
  const action = request.functionName;
  let stage: AuctionErrorStage = "simulation";
  const replacement: { current: AuctionReplacement | null } = {
    current: null,
  };
  dependencies.dispatch({ type: "started", action });

  try {
    const simulatedRequest = await dependencies.simulate(request);
    stage = "wallet";
    dependencies.dispatch({ type: "wallet_requested" });
    const hash = await dependencies.write(simulatedRequest);
    dependencies.dispatch({ type: "broadcast", hash });

    stage = "receipt";
    const receipt = await dependencies.wait(hash, (nextReplacement) => {
      replacement.current = nextReplacement;
      dependencies.dispatch({
        type: "replaced",
        reason: nextReplacement.reason,
        hash: nextReplacement.hash,
      });
    });

    if (replacement.current?.reason === "cancelled") {
      const error = classifyAuctionTransactionError(
        new Error("Transaction replacement cancelled"),
        "replacement_cancelled",
      );
      dependencies.dispatch({ type: "failed", error });
      return { status: "failed", error };
    }

    if (replacement.current?.reason === "replaced") {
      dependencies.dispatch({ type: "refreshing" });
      try {
        await dependencies.refresh();
        if (await dependencies.isActionResolved?.()) {
          dependencies.dispatch({ type: "confirmed" });
          return { status: "resolved_by_refresh" };
        }
      } catch {
        // The replacement remains the actionable result.
      }
      const error = classifyAuctionTransactionError(
        new Error("A different transaction replaced this request"),
        "replacement_replaced",
      );
      dependencies.dispatch({ type: "failed", error });
      return { status: "failed", error };
    }

    if (receipt.status === "reverted") {
      const error = receiptRevertedError();
      dependencies.dispatch({ type: "refreshing" });
      try {
        await dependencies.refresh();
        if (await dependencies.isActionResolved?.()) {
          dependencies.dispatch({ type: "confirmed" });
          return { status: "resolved_by_refresh" };
        }
      } catch {
        // The confirmed revert remains the useful failure to report.
      }
      dependencies.dispatch({ type: "failed", error });
      return { status: "failed", error };
    }

    dependencies.dispatch({ type: "refreshing" });
    stage = "refresh";
    await dependencies.refresh();
    dependencies.dispatch({ type: "confirmed" });
    return {
      status: "confirmed",
      hash: replacement.current?.hash ?? hash,
      replacement: replacement.current,
    };
  } catch (cause) {
    const error = classifyAuctionTransactionError(cause, stage);
    if (error.shouldRefresh) {
      dependencies.dispatch({ type: "refreshing" });
      try {
        await dependencies.refresh();
        if (await dependencies.isActionResolved?.()) {
          dependencies.dispatch({ type: "confirmed" });
          return { status: "resolved_by_refresh" };
        }
      } catch {
        // The original action error remains the useful failure to report.
      }
    }
    dependencies.dispatch({ type: "failed", error });
    return { status: "failed", error };
  }
}

export interface UseAuctionTransactionInput {
  auctionAddress: Address | null;
  account: Address | undefined;
  executionReady: boolean;
  verifyEnvironment: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

export interface UseAuctionTransactionResult {
  state: AuctionTransactionState;
  isPending: boolean;
  submitBid: (
    value: bigint,
  ) => Promise<ExecuteAuctionTransactionResult | { status: "blocked" }>;
  settle: () => Promise<
    ExecuteAuctionTransactionResult | { status: "blocked" }
  >;
  reset: () => void;
}

export function useAuctionTransaction({
  auctionAddress,
  account,
  executionReady,
  verifyEnvironment,
  refresh,
}: UseAuctionTransactionInput): UseAuctionTransactionResult {
  const publicClient = usePublicClient({ chainId: base.id });
  const { writeContractAsync } = useWriteContract();
  const [state, dispatch] = useReducer(
    auctionTransactionReducer,
    initialAuctionTransactionState,
  );
  const gate = useRef(createAuctionSubmissionGate());

  const submit = useCallback(
    async (action: AuctionTransactionAction, value?: bigint) => {
      if (!executionReady || !auctionAddress || !account || !publicClient) {
        return { status: "blocked" as const };
      }

      const request = buildAuctionTransactionRequest({
        action,
        auctionAddress,
        account,
        value,
      });
      const gated = await gate.current.run(() =>
        verifyEnvironment().then((verified) => {
          if (!verified) {
            const error: AuctionTransactionError = {
              kind: "environment_changed",
              message:
                "Your wallet auction environment changed. Check it and try again.",
              retryable: true,
              shouldRefresh: false,
            };
            dispatch({ type: "failed", error });
            return { status: "failed" as const, error };
          }

          return executeAuctionTransaction(request, {
            dispatch,
            simulate: async (exactRequest) => {
              if (exactRequest.functionName === "bid") {
                await publicClient.simulateContract(exactRequest);
              } else {
                await publicClient.simulateContract(exactRequest);
              }
              return exactRequest;
            },
            write: async (simulatedRequest) => {
              if (simulatedRequest.functionName === "bid") {
                return writeContractAsync(simulatedRequest);
              }
              return writeContractAsync(simulatedRequest);
            },
            wait: async (hash, onReplaced) =>
              publicClient.waitForTransactionReceipt({
                hash,
                onReplaced: ({ reason, transaction }) =>
                  onReplaced({ reason, hash: transaction.hash }),
              }),
            refresh,
            // Do not infer fresh canonical state from a React render closure here:
            // refetch completion and rendering are separate clocks. Re-read the
            // lifecycle from the app RPC before treating a settlement race as done.
            isActionResolved: async () =>
              action === "settle" &&
              (await publicClient.readContract({
                abi: societyNftAuctionAbi,
                address: auctionAddress,
                functionName: "lifecycle",
              })) === 2,
          });
        }),
      );

      return gated.accepted ? gated.value : { status: "blocked" as const };
    },
    [
      account,
      auctionAddress,
      executionReady,
      publicClient,
      refresh,
      verifyEnvironment,
      writeContractAsync,
    ],
  );

  const reset = useCallback(() => dispatch({ type: "reset" }), []);

  return {
    state,
    isPending:
      state.status === "simulating" ||
      state.status === "awaiting_wallet" ||
      state.status === "confirming" ||
      state.status === "refreshing",
    submitBid: (value) => submit("bid", value),
    settle: () => submit("settle"),
    reset,
  };
}
