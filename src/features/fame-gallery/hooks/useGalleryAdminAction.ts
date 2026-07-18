"use client";

import { getConnection } from "@wagmi/core";
import { useCallback, useReducer, useRef, useState } from "react";
import type { Address } from "viem";
import {
  useConfig,
  usePublicClient,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { BASE_SEPOLIA_TEST_GALLERY_CONFIG } from "../config/baseSepoliaTestGallery";
import {
  createGalleryAdminSubmissionGate,
  executeGalleryAdminAction,
  galleryAdminReducer,
  initialGalleryAdminState,
  type GalleryAdminCall,
} from "../transactions/adminAction";
import { galleryAdminContractRequest } from "../transactions/contractRequests";

const chainId = BASE_SEPOLIA_TEST_GALLERY_CONFIG.chainId;

export function useGalleryAdminAction({
  refresh,
}: {
  refresh: (call: GalleryAdminCall) => Promise<void>;
}) {
  const config = useConfig();
  const publicClient = usePublicClient({ chainId });
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const [state, dispatch] = useReducer(
    galleryAdminReducer,
    initialGalleryAdminState,
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [isRetryingRefresh, setIsRetryingRefresh] = useState(false);
  const gate = useRef(createGalleryAdminSubmissionGate());
  const refreshInFlight = useRef(false);

  const submit = useCallback(
    (call: GalleryAdminCall) => {
      setModalOpen(true);
      if (!publicClient) {
        const cause = new Error("Base Sepolia RPC client is unavailable.");
        dispatch({ type: "failed", stage: "connection", cause });
        return Promise.resolve({
          status: "failed" as const,
          stage: "connection",
          cause,
        });
      }

      return gate.current.run(() =>
        executeGalleryAdminAction(call, chainId, {
          dispatch,
          getWalletContext: () => {
            const connection = getConnection(config);
            return {
              account: connection.address ?? null,
              chainId: connection.chainId,
            };
          },
          switchChain: (targetChainId) =>
            switchChainAsync({ chainId: targetChainId }),
          simulate: async (exactCall, account) => {
            const request = galleryAdminContractRequest(exactCall, account);
            switch (request.functionName) {
              case "list":
                await publicClient.simulateContract(request);
                break;
              case "setPremium":
                await publicClient.simulateContract(request);
                break;
              case "unlist":
                await publicClient.simulateContract(request);
                break;
              case "rotateToMintPool":
                await publicClient.simulateContract(request);
                break;
              case "rotateToBurnPool":
                await publicClient.simulateContract(request);
                break;
              case "rotateToEndOfMintPool":
                await publicClient.simulateContract(request);
                break;
              case "withdrawAccruedFees":
                await publicClient.simulateContract(request);
                break;
            }
            return null;
          },
          write: (_prepared, exactCall, account) => {
            const request = galleryAdminContractRequest(exactCall, account);
            switch (request.functionName) {
              case "list":
                return writeContractAsync(request);
              case "setPremium":
                return writeContractAsync(request);
              case "unlist":
                return writeContractAsync(request);
              case "rotateToMintPool":
                return writeContractAsync(request);
              case "rotateToBurnPool":
                return writeContractAsync(request);
              case "rotateToEndOfMintPool":
                return writeContractAsync(request);
              case "withdrawAccruedFees":
                return writeContractAsync(request);
            }
          },
          waitForReceipt: async ({ hash, onReplaced }) => {
            const receipt = await publicClient.waitForTransactionReceipt({
              hash,
              confirmations: 1,
              onReplaced: ({ reason, transaction }) =>
                onReplaced({ reason, hash: transaction.hash }),
            });
            return { status: receipt.status };
          },
          refresh,
        }),
      );
    },
    [config, publicClient, refresh, switchChainAsync, writeContractAsync],
  );

  const retryRefresh = useCallback(async () => {
    if (!state.call || refreshInFlight.current) return;
    refreshInFlight.current = true;
    setIsRetryingRefresh(true);
    try {
      await refresh(state.call);
      dispatch({ type: "confirmed" });
    } catch (cause) {
      dispatch({ type: "confirmed_refreshing", cause });
    } finally {
      refreshInFlight.current = false;
      setIsRetryingRefresh(false);
    }
  }, [refresh, state.call]);

  return {
    state,
    submit,
    modalOpen,
    setModalOpen,
    retryRefresh,
    isRetryingRefresh,
    reset: () => dispatch({ type: "reset" }),
    transaction: state.call
      ? {
          kind: state.call.kind.replaceAll("_", " "),
          hash: state.hash ?? undefined,
        }
      : null,
  };
}
