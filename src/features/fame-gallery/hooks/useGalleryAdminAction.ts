"use client";

import { getConnection } from "@wagmi/core";
import { useCallback, useReducer, useRef, useState } from "react";
import {
  useConfig,
  usePublicClient,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { BASE_SEPOLIA_TEST_GALLERY_CONFIG } from "../config/baseSepoliaTestGallery";
import {
  executeGalleryAdminAction,
  galleryAdminReducer,
  initialGalleryAdminState,
} from "../transactions/adminAction";
import { galleryAdminContractRequest } from "../transactions/contractRequests";
import type { GalleryAdminCall } from "../types";

const chainId = BASE_SEPOLIA_TEST_GALLERY_CONFIG.chainId;

export function useGalleryAdminAction({
  refresh,
}: {
  refresh: (call: GalleryAdminCall) => Promise<void>;
}) {
  const config = useConfig();
  const publicClient = usePublicClient({ chainId });
  const { mutateAsync: switchChainAsync } = useSwitchChain();
  const { mutateAsync: writeContractAsync } = useWriteContract();
  const [state, dispatch] = useReducer(
    galleryAdminReducer,
    initialGalleryAdminState,
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [isRetryingRefresh, setIsRetryingRefresh] = useState(false);
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

      return executeGalleryAdminAction(call, chainId, {
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
            case "setPremium":
              return (await publicClient.simulateContract(request)).request;
            case "setFeeRecipient":
              return (await publicClient.simulateContract(request)).request;
            case "pause":
              return (await publicClient.simulateContract(request)).request;
            case "unpause":
              return (await publicClient.simulateContract(request)).request;
          }
        },
        write: (preparedRequest) =>
          writeContractAsync(
            preparedRequest as Parameters<typeof writeContractAsync>[0],
          ),
        waitForReceipt: (hash, confirmations) =>
          publicClient.waitForTransactionReceipt({ hash, confirmations }),
        refresh,
      });
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
