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
  type ExecuteGalleryPurchaseResult,
  type GalleryTransactionLog,
} from "../transactions/purchaseQueue";
import {
  galleryApprovalContractRequest,
  galleryFillContractRequest,
} from "../transactions/contractRequests";
import { verifyGalleryPurchase } from "../transactions/verifyPurchase";

const gallery = BASE_SEPOLIA_TEST_GALLERY_CONFIG.addresses.gallery;
const fame = BASE_SEPOLIA_TEST_GALLERY_CONFIG.addresses.fame;
const mirror = BASE_SEPOLIA_TEST_GALLERY_CONFIG.addresses.mirror;
const targetChainId = BASE_SEPOLIA_TEST_GALLERY_CONFIG.chainId;

type ConfirmedPurchase = Extract<
  ExecuteGalleryPurchaseResult,
  { status: "fill_receipt_confirmed" }
>;

function transactionLog(log: {
  address: Address;
  data: `0x${string}`;
  topics: readonly `0x${string}`[];
  blockNumber: bigint | null;
  transactionHash: `0x${string}` | null;
  transactionIndex: number | null;
  logIndex: number | null;
}): GalleryTransactionLog {
  if (
    log.blockNumber === null ||
    log.transactionHash === null ||
    log.transactionIndex === null ||
    log.logIndex === null
  ) {
    throw new Error("Canonical transaction log position is unavailable.");
  }
  return {
    address: log.address,
    data: log.data,
    topics: log.topics,
    blockNumber: log.blockNumber,
    transactionHash: log.transactionHash,
    transactionIndex: log.transactionIndex,
    logIndex: log.logIndex,
  };
}

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
  const confirmedPurchase = useRef<ConfirmedPurchase | null>(null);

  const verifyConfirmedPurchase = useCallback(
    async (confirmed: ConfirmedPurchase) => {
      if (!publicClient) {
        const cause = new Error("Base Sepolia RPC client is unavailable.");
        dispatch({ type: "confirmed_refreshing", cause });
        return { status: "confirmed_refreshing" as const, cause };
      }

      dispatch({ type: "verifying" });
      const verification = await verifyGalleryPurchase({
        receipt: confirmed.receipt,
        expectedHash: confirmed.fillHash,
        fingerprint: confirmed.fingerprint,
        preFillSnapshot: confirmed.preFillSnapshot,
        addresses: { gallery, mirror },
        dependencies: {
          readReceiptBlockState: async (blockNumber, tokenId) => {
            const [owner, listing, inventory, accruedProtocolFees] =
              await publicClient.multicall({
                allowFailure: false,
                blockNumber,
                contracts: [
                  {
                    abi: fameMirrorAbi,
                    address: mirror,
                    functionName: "ownerAt",
                    args: [tokenId],
                  },
                  {
                    abi: closedLoopGallerySwapAbi,
                    address: gallery,
                    functionName: "listings",
                    args: [tokenId],
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
                ],
              });
            return {
              owner,
              listingActive: listing[1],
              inventory,
              accruedProtocolFees,
            };
          },
          readReconciliationLogs: async (fromBlock, toBlock) => {
            const [galleryLogs, mirrorLogs] = await Promise.all([
              publicClient.getLogs({
                address: gallery,
                fromBlock,
                toBlock,
              }),
              publicClient.getLogs({
                address: mirror,
                fromBlock,
                toBlock,
              }),
            ]);
            return [...galleryLogs, ...mirrorLogs].map(transactionLog);
          },
          readTokenUri: (blockNumber, tokenId) =>
            publicClient.readContract({
              abi: fameMirrorAbi,
              address: mirror,
              functionName: "tokenURI",
              args: [tokenId],
              blockNumber,
            }),
        },
      });

      if (verification.status === "verified") {
        dispatch({
          type: "verified",
          acquiredNft: verification.acquiredNft,
        });
      } else if (verification.status === "confirmed_refreshing") {
        dispatch({
          type: "confirmed_refreshing",
          cause: verification.cause,
        });
      } else {
        dispatch({
          type: "confirmed_unverified",
          reason: verification.reason,
        });
      }
      return verification;
    },
    [publicClient],
  );

  const start = useCallback(
    async (tokenId: bigint, recipient?: Address) => {
      setModalOpen(true);
      if (!publicClient) {
        const cause = new Error("Base Sepolia RPC client is unavailable.");
        dispatch({ type: "failed", stage: "connection", cause });
        return {
          status: "failed" as const,
          stage: "connection" as const,
          cause,
        };
      }

      return gate.current.run(async () => {
        const execution = await executeGalleryPurchase(
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
              const [unit, inventory, accruedProtocolFees, listing, allowance] =
                await publicClient.multicall({
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
              await publicClient.simulateContract(
                galleryApprovalContractRequest(fingerprint),
              );
              return null;
            },
            writeApproval: (_prepared, fingerprint) =>
              writeContractAsync(galleryApprovalContractRequest(fingerprint)),
            simulateFill: async (fingerprint) => {
              await publicClient.simulateContract(
                galleryFillContractRequest(fingerprint),
              );
              return null;
            },
            writeFill: (_prepared, fingerprint) =>
              writeContractAsync(galleryFillContractRequest(fingerprint)),
            waitForReceipt: async ({ hash, confirmations, onReplaced }) => {
              const receipt = await publicClient.waitForTransactionReceipt({
                hash,
                confirmations,
                onReplaced: ({ reason, transaction }) =>
                  onReplaced({ reason, hash: transaction.hash }),
              });
              return {
                status: receipt.status,
                blockNumber: receipt.blockNumber,
                transactionHash: receipt.transactionHash,
                logs: receipt.logs.map(transactionLog),
              };
            },
          },
        );
        if (execution.status !== "fill_receipt_confirmed") return execution;
        confirmedPurchase.current = execution;
        return verifyConfirmedPurchase(execution);
      });
    },
    [
      config,
      publicClient,
      switchChainAsync,
      verifyConfirmedPurchase,
      writeContractAsync,
    ],
  );

  const reset = useCallback(() => {
    confirmedPurchase.current = null;
    dispatch({ type: "reset" });
  }, []);
  const retryVerification = useCallback(() => {
    if (!confirmedPurchase.current) return Promise.resolve(null);
    return verifyConfirmedPurchase(confirmedPurchase.current);
  }, [verifyConfirmedPurchase]);
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
  }, [state.approvalHash, state.fillHash, state.status, state.transactionKind]);

  return {
    state,
    transactions,
    modalOpen,
    setModalOpen,
    start,
    retryVerification,
    reset,
    isActive:
      state.status !== "idle" &&
      state.status !== "fill_receipt_confirmed" &&
      state.status !== "verified" &&
      state.status !== "confirmed_refreshing" &&
      state.status !== "confirmed_unverified" &&
      state.status !== "outcome_unknown" &&
      state.status !== "error",
  };
}
