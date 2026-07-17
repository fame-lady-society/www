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
import { closedLoopGallerySwapAbi } from "../../../wagmi";
import { BASE_SEPOLIA_TEST_GALLERY_CONFIG } from "../config/baseSepoliaTestGallery";
import {
  createGalleryAdminSubmissionGate,
  executeGalleryAdminAction,
  galleryAdminReducer,
  initialGalleryAdminState,
  type GalleryAdminCall,
} from "../transactions/adminAction";

const gallery = BASE_SEPOLIA_TEST_GALLERY_CONFIG.addresses.gallery;
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
  const gate = useRef(createGalleryAdminSubmissionGate());

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
            const baseRequest = {
              abi: closedLoopGallerySwapAbi,
              address: gallery,
              account,
            } as const;
            switch (exactCall.kind) {
              case "list":
                await publicClient.simulateContract({
                  ...baseRequest,
                  functionName: "list",
                  args: [exactCall.tokenId, exactCall.premium],
                });
                break;
              case "set_premium":
                await publicClient.simulateContract({
                  ...baseRequest,
                  functionName: "setPremium",
                  args: [exactCall.tokenId, exactCall.premium],
                });
                break;
              case "unlist":
                await publicClient.simulateContract({
                  ...baseRequest,
                  functionName: "unlist",
                  args: [exactCall.tokenId],
                });
                break;
              case "rotate_mint":
                await publicClient.simulateContract({
                  ...baseRequest,
                  functionName: "rotateToMintPool",
                  args: [exactCall.tokenId, exactCall.poolTokenId],
                });
                break;
              case "rotate_burn":
                await publicClient.simulateContract({
                  ...baseRequest,
                  functionName: "rotateToBurnPool",
                  args: [exactCall.tokenId, exactCall.poolTokenId],
                });
                break;
              case "rotate_end_of_mint":
                await publicClient.simulateContract({
                  ...baseRequest,
                  functionName: "rotateToEndOfMintPool",
                  args: [exactCall.tokenId, exactCall.metadataUri],
                });
                break;
              case "withdraw_fees":
                await publicClient.simulateContract({
                  ...baseRequest,
                  functionName: "withdrawAccruedFees",
                  args: [exactCall.recipient, exactCall.amount],
                });
                break;
            }
            return null;
          },
          write: (_prepared, exactCall, account) => {
            const baseRequest = {
              abi: closedLoopGallerySwapAbi,
              address: gallery,
              account,
              chainId,
            } as const;
            switch (exactCall.kind) {
              case "list":
                return writeContractAsync({
                  ...baseRequest,
                  functionName: "list",
                  args: [exactCall.tokenId, exactCall.premium],
                });
              case "set_premium":
                return writeContractAsync({
                  ...baseRequest,
                  functionName: "setPremium",
                  args: [exactCall.tokenId, exactCall.premium],
                });
              case "unlist":
                return writeContractAsync({
                  ...baseRequest,
                  functionName: "unlist",
                  args: [exactCall.tokenId],
                });
              case "rotate_mint":
                return writeContractAsync({
                  ...baseRequest,
                  functionName: "rotateToMintPool",
                  args: [exactCall.tokenId, exactCall.poolTokenId],
                });
              case "rotate_burn":
                return writeContractAsync({
                  ...baseRequest,
                  functionName: "rotateToBurnPool",
                  args: [exactCall.tokenId, exactCall.poolTokenId],
                });
              case "rotate_end_of_mint":
                return writeContractAsync({
                  ...baseRequest,
                  functionName: "rotateToEndOfMintPool",
                  args: [exactCall.tokenId, exactCall.metadataUri],
                });
              case "withdraw_fees":
                return writeContractAsync({
                  ...baseRequest,
                  functionName: "withdrawAccruedFees",
                  args: [exactCall.recipient, exactCall.amount],
                });
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
    [
      config,
      publicClient,
      refresh,
      switchChainAsync,
      writeContractAsync,
    ],
  );

  return {
    state,
    submit,
    modalOpen,
    setModalOpen,
    reset: () => dispatch({ type: "reset" }),
    transaction: state.call
      ? {
          kind: state.call.kind.replaceAll("_", " "),
          hash: state.hash ?? undefined,
        }
      : null,
  };
}
