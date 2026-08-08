"use client";

import { getConnection } from "@wagmi/core";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useReducer, useRef, useState } from "react";
import type { Address } from "viem";
import {
  useConfig,
  useConnection,
  usePublicClient,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { useGalleryRuntime } from "../config/galleryRuntime";
import {
  executeGalleryLiquidityAction,
  galleryLiquidityActionReducer,
  hasGalleryLiquidityStakeLegStarted,
  initialGalleryLiquidityActionState,
  isGalleryLiquidityActionBusy,
  type GalleryLiquidityCall,
} from "../transactions/liquidityAction";
import {
  galleryLiquidityContractRequest,
  galleryLiquidityDepositApprovalRequest,
  galleryLiquidityDepositApprovalReadRequest,
  galleryLiquidityFameAllowanceRequest,
} from "../transactions/liquidityRequests";

function operatorApprovalQueryKey(
  chainId: number,
  account: Address | undefined,
  marketplace: Address,
) {
  return [
    "gallery-liquidity",
    "operator-approval",
    chainId,
    account?.toLowerCase() ?? null,
    marketplace.toLowerCase(),
  ] as const;
}

function transactionLabel(call: GalleryLiquidityCall) {
  switch (call.kind) {
    case "deposit":
      return "Society NFT liquidity stake";
    case "withdrawal_approval":
      return "Society withdrawal FAME approval";
    case "withdrawal":
      return "Society withdrawal";
  }
}

export type GalleryLiquidityAllowanceState =
  | Readonly<{ status: "idle" }>
  | Readonly<{ status: "loading" }>
  | Readonly<{ status: "error"; message: string }>
  | Readonly<{ status: "ready"; amount: bigint }>;

export function useGalleryLiquidityAction({
  refresh,
  authorization,
}: {
  refresh: (
    call: GalleryLiquidityCall,
  ) => Promise<void | { selectedTokenAvailable?: boolean }>;
  authorization: "operator" | "fame";
}) {
  const runtime = useGalleryRuntime();
  const config = useConfig();
  const queryClient = useQueryClient();
  const connection = useConnection();
  const publicClient = usePublicClient({ chainId: runtime.chainId });
  const { mutateAsync: switchChainAsync } = useSwitchChain();
  const { mutateAsync: writeContractAsync } = useWriteContract();
  const [state, dispatch] = useReducer(
    galleryLiquidityActionReducer,
    initialGalleryLiquidityActionState,
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshRetrying, setRefreshRetrying] = useState(false);
  const flightRef = useRef<GalleryLiquidityCall | null>(null);
  const refreshRetryFlightRef = useRef(false);
  const account = connection.address;
  const readsEnabled = Boolean(account && publicClient);
  const approvalKey = useMemo(
    () =>
      operatorApprovalQueryKey(
        runtime.chainId,
        account,
        runtime.addresses.gallery,
      ),
    [account, runtime.addresses.gallery, runtime.chainId],
  );
  const allowanceKey = useMemo(
    () =>
      [
        "gallery-liquidity",
        "fame-allowance",
        runtime.chainId,
        account?.toLowerCase() ?? null,
        runtime.addresses.gallery.toLowerCase(),
      ] as const,
    [account, runtime.addresses.gallery, runtime.chainId],
  );
  const operatorApproval = useQuery({
    queryKey: approvalKey,
    enabled: readsEnabled && authorization === "operator",
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: () => {
      if (!account || !publicClient) return false;
      return publicClient.readContract(
        galleryLiquidityDepositApprovalReadRequest(
          account,
          runtime.addresses.mirror,
          runtime.addresses.gallery,
        ),
      );
    },
  });
  const fameAllowance = useQuery({
    queryKey: allowanceKey,
    enabled: readsEnabled && authorization === "fame",
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: () => {
      if (!account || !publicClient) {
        throw new Error("FAME allowance is unavailable.");
      }
      return publicClient.readContract(
        galleryLiquidityFameAllowanceRequest(
          account,
          runtime.addresses.fame,
          runtime.addresses.gallery,
        ),
      );
    },
  });

  const submit = useCallback(
    async (call: GalleryLiquidityCall) => {
      if (flightRef.current) return null;
      flightRef.current = call;
      setModalOpen(true);
      if (!publicClient) {
        dispatch({
          type: "failed",
          stage: "connection",
          cause: new Error("Gallery RPC client is unavailable."),
        });
        flightRef.current = null;
        return null;
      }
      const result = await executeGalleryLiquidityAction(
        call,
        runtime.chainId,
        {
          dispatch,
          getWalletContext: () => {
            const latest = getConnection(config);
            return {
              account: latest.address ?? null,
              chainId: latest.chainId,
            };
          },
          switchChain: (chainId) => switchChainAsync({ chainId }),
          simulate: async (exactCall, latestAccount) => {
            const request = galleryLiquidityContractRequest(
              exactCall,
              latestAccount,
              runtime.chainId,
              {
                fame: runtime.addresses.fame,
                marketplace: runtime.addresses.gallery,
              },
            );
            const simulation = await publicClient.simulateContract(
              request as Parameters<typeof publicClient.simulateContract>[0],
            );
            return simulation.request;
          },
          write: (request) =>
            writeContractAsync(
              request as Parameters<typeof writeContractAsync>[0],
            ),
          approval:
            call.kind === "deposit"
              ? {
                  isRequired: async (latestAccount) => {
                    const approved = await publicClient.readContract(
                      galleryLiquidityDepositApprovalReadRequest(
                        latestAccount,
                        runtime.addresses.mirror,
                        runtime.addresses.gallery,
                      ),
                    );
                    queryClient.setQueryData(
                      operatorApprovalQueryKey(
                        runtime.chainId,
                        latestAccount,
                        runtime.addresses.gallery,
                      ),
                      approved === true,
                    );
                    return approved !== true;
                  },
                  simulate: async (latestAccount) => {
                    const request = galleryLiquidityDepositApprovalRequest(
                      latestAccount,
                      runtime.chainId,
                      runtime.addresses.mirror,
                      runtime.addresses.gallery,
                    );
                    const simulation = await publicClient.simulateContract(
                      request as Parameters<
                        typeof publicClient.simulateContract
                      >[0],
                    );
                    return simulation.request;
                  },
                  onConfirmed: (approvedAccount) => {
                    queryClient.setQueryData(
                      operatorApprovalQueryKey(
                        runtime.chainId,
                        approvedAccount,
                        runtime.addresses.gallery,
                      ),
                      true,
                    );
                  },
                }
              : undefined,
          waitForReceipt: (hash, confirmations) =>
            publicClient.waitForTransactionReceipt({ hash, confirmations }),
          refresh: async (completedCall) => {
            switch (completedCall.kind) {
              case "withdrawal_approval": {
                const [refreshed, result] = await Promise.all([
                  refresh(completedCall),
                  fameAllowance.refetch(),
                ]);
                if (result.isError) throw result.error;
                return refreshed;
              }
              case "deposit": {
                const [refreshed, result] = await Promise.all([
                  refresh(completedCall),
                  operatorApproval.refetch(),
                ]);
                if (result.isError) throw result.error;
                return refreshed;
              }
              case "withdrawal": {
                const [refreshed, result] = await Promise.all([
                  refresh(completedCall),
                  fameAllowance.refetch(),
                ]);
                if (result.isError) throw result.error;
                return refreshed;
              }
            }
          },
        },
      );
      if (result.status !== "confirmed_refreshing") {
        flightRef.current = null;
      }
      return result;
    },
    [
      config,
      fameAllowance,
      operatorApproval,
      publicClient,
      queryClient,
      refresh,
      runtime,
      switchChainAsync,
      writeContractAsync,
    ],
  );

  const retryRefresh = useCallback(async () => {
    if (
      state.status !== "confirmed_refreshing" ||
      !state.call ||
      refreshRetryFlightRef.current
    ) {
      return false;
    }
    refreshRetryFlightRef.current = true;
    setRefreshRetrying(true);
    try {
      const result = await Promise.all([
        refresh(state.call),
        authorization === "fame"
          ? fameAllowance.refetch()
          : operatorApproval.refetch(),
      ]);
      const authorizationResult = result[1];
      if (authorizationResult.isError) throw authorizationResult.error;
      dispatch({ type: "confirmed" });
      flightRef.current = null;
      return true;
    } catch (cause) {
      dispatch({ type: "confirmed_refreshing", cause });
      return false;
    } finally {
      refreshRetryFlightRef.current = false;
      setRefreshRetrying(false);
    }
  }, [authorization, fameAllowance, operatorApproval, refresh, state]);

  const transactions = useMemo(() => {
    if (!state.call) return [];
    if (state.call.kind === "deposit" && state.approvalRequired === null) {
      return [];
    }
    if (state.call.kind === "deposit" && state.approvalRequired) {
      const rows = [
        {
          kind: "Society NFT staking approval",
          hash: state.approvalHash ?? undefined,
        },
      ];
      if (hasGalleryLiquidityStakeLegStarted(state)) {
        rows.push({
          kind: transactionLabel(state.call),
          hash: state.hash ?? undefined,
        });
      }
      return rows;
    }
    return [
      {
        kind: transactionLabel(state.call),
        hash: state.hash ?? undefined,
      },
    ];
  }, [state]);

  return {
    state,
    modalOpen,
    setModalOpen,
    reset: () => {
      if (flightRef.current) return;
      dispatch({ type: "reset" });
    },
    submit,
    retryRefresh,
    refreshRetrying,
    transactions,
    operatorApproved: operatorApproval.data === true,
    fameAllowance: (!readsEnabled || authorization !== "fame"
      ? { status: "idle" }
      : fameAllowance.isPending
        ? { status: "loading" }
        : fameAllowance.isError
          ? {
              status: "error",
              message: "FAME allowance is unavailable.",
            }
          : typeof fameAllowance.data === "bigint"
            ? { status: "ready", amount: fameAllowance.data }
            : {
                status: "error",
                message: "FAME allowance is unavailable.",
              }) as GalleryLiquidityAllowanceState,
    retryFameAllowance: fameAllowance.refetch,
    chainMismatch: Boolean(
      account &&
        connection.chainId !== undefined &&
        connection.chainId !== runtime.chainId,
    ),
    busy: isGalleryLiquidityActionBusy(state),
  };
}
