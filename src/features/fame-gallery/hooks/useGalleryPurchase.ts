"use client";

import { getConnection } from "@wagmi/core";
import { useCallback, useMemo, useReducer, useRef, useState } from "react";
import { encodeFunctionData, type Address } from "viem";
import {
  useConfig,
  usePublicClient,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import {
  closedLoopGallerySwapAbi,
  fameAbi,
  fameMirrorAbi,
} from "../../../wagmi";
import { BASE_SEPOLIA_TEST_GALLERY_CONFIG } from "../config/baseSepoliaTestGallery";
import {
  createGalleryPurchaseSubmissionGate,
  executeGalleryPurchase,
  galleryPurchaseReducer,
  initialGalleryPurchaseState,
} from "../transactions/purchaseQueue";

const gallery = BASE_SEPOLIA_TEST_GALLERY_CONFIG.addresses.gallery;
const fame = BASE_SEPOLIA_TEST_GALLERY_CONFIG.addresses.fame;
const mirror = BASE_SEPOLIA_TEST_GALLERY_CONFIG.addresses.mirror;
const targetChainId = BASE_SEPOLIA_TEST_GALLERY_CONFIG.chainId;

export function useGalleryPurchase() {
  const config = useConfig();
  const publicClient = usePublicClient({ chainId: targetChainId });
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const [state, dispatch] = useReducer(
    galleryPurchaseReducer,
    initialGalleryPurchaseState,
  );
  const [modalOpen, setModalOpen] = useState(false);
  const gate = useRef(createGalleryPurchaseSubmissionGate());

  const start = useCallback(
    async (tokenId: bigint, recipient?: Address) => {
      setModalOpen(true);
      if (!publicClient) {
        const cause = new Error("Base Sepolia RPC client is unavailable.");
        dispatch({ type: "failed", stage: "connection", cause });
        return { status: "failed" as const, stage: "connection" as const, cause };
      }

      return gate.current.run(() =>
        executeGalleryPurchase(
          { tokenId, recipient, targetChainId },
          {
            dispatch,
            getWalletContext: () => {
              const connection = getConnection(config);
              return {
                account: connection.address ?? null,
                chainId: connection.chainId,
              };
            },
            switchChain: (chainId) => switchChainAsync({ chainId }),
            captureSnapshot: async ({
              account,
              recipient: exactRecipient,
              tokenId: exactTokenId,
              targetChainId: exactChainId,
            }) => {
              const blockNumber = await publicClient.getBlockNumber();
              const [
                unit,
                inventory,
                accruedProtocolFees,
                listing,
                allowance,
              ] = await publicClient.multicall({
                allowFailure: false,
                blockNumber,
                contracts: [
                  {
                    abi: fameAbi,
                    address: fame,
                    functionName: "unit",
                  },
                  {
                    abi: fameMirrorAbi,
                    address: mirror,
                    functionName: "balanceOf",
                    args: [gallery],
                  },
                  {
                    abi: closedLoopGallerySwapAbi,
                    address: gallery,
                    functionName: "accruedProtocolFees",
                  },
                  {
                    abi: closedLoopGallerySwapAbi,
                    address: gallery,
                    functionName: "listings",
                    args: [exactTokenId],
                  },
                  {
                    abi: fameAbi,
                    address: fame,
                    functionName: "allowance",
                    args: [account, gallery],
                  },
                ],
              });
              const premium = listing[0];
              return {
                blockNumber,
                allowance,
                inventory,
                accruedProtocolFees,
                fingerprint: {
                  chainId: exactChainId,
                  account,
                  recipient: exactRecipient,
                  tokenId: exactTokenId,
                  unit,
                  premium,
                  total: unit + premium,
                  allowanceTarget: gallery,
                  fillCalldata: encodeFunctionData({
                    abi: closedLoopGallerySwapAbi,
                    functionName: "fill",
                    args: [exactTokenId, exactRecipient],
                  }),
                },
              };
            },
            simulateApproval: async (fingerprint) => {
              await publicClient.simulateContract({
                abi: fameAbi,
                address: fame,
                account: fingerprint.account,
                functionName: "approve",
                args: [fingerprint.allowanceTarget, fingerprint.total],
              });
              return null;
            },
            writeApproval: (_prepared, fingerprint) =>
              writeContractAsync({
                abi: fameAbi,
                address: fame,
                account: fingerprint.account,
                chainId: fingerprint.chainId,
                functionName: "approve",
                args: [fingerprint.allowanceTarget, fingerprint.total],
              }),
            simulateFill: async (fingerprint) => {
              await publicClient.simulateContract({
                abi: closedLoopGallerySwapAbi,
                address: gallery,
                account: fingerprint.account,
                functionName: "fill",
                args: [fingerprint.tokenId, fingerprint.recipient],
              });
              return null;
            },
            writeFill: (_prepared, fingerprint) =>
              writeContractAsync({
                abi: closedLoopGallerySwapAbi,
                address: gallery,
                account: fingerprint.account,
                chainId: fingerprint.chainId,
                functionName: "fill",
                args: [fingerprint.tokenId, fingerprint.recipient],
              }),
            waitForReceipt: async ({
              hash,
              confirmations,
              onReplaced,
            }) => {
              const receipt = await publicClient.waitForTransactionReceipt({
                hash,
                confirmations,
                onReplaced: ({ reason, transaction }) =>
                  onReplaced({ reason, hash: transaction.hash }),
              });
              return { status: receipt.status };
            },
          },
        ),
      );
    },
    [
      config,
      publicClient,
      switchChainAsync,
      writeContractAsync,
    ],
  );

  const reset = useCallback(() => dispatch({ type: "reset" }), []);
  const transactions = useMemo(() => {
    const items: {
      kind: string;
      hash?: `0x${string}`;
    }[] = [];
    if (state.approvalHash) {
      items.push({ kind: "TEST approval", hash: state.approvalHash });
    } else if (
      state.transactionKind === "approval" &&
      state.status === "awaiting_wallet"
    ) {
      items.push({ kind: "TEST approval" });
    }
    if (state.fillHash) {
      items.push({ kind: "gallery purchase", hash: state.fillHash });
    } else if (
      state.transactionKind === "fill" &&
      state.status === "awaiting_wallet"
    ) {
      items.push({ kind: "gallery purchase" });
    }
    return items;
  }, [
    state.approvalHash,
    state.fillHash,
    state.status,
    state.transactionKind,
  ]);

  return {
    state,
    transactions,
    modalOpen,
    setModalOpen,
    start,
    reset,
    isActive:
      state.status !== "idle" &&
      state.status !== "fill_receipt_confirmed" &&
      state.status !== "outcome_unknown" &&
      state.status !== "error",
  };
}
