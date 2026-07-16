"use client";

import { useAccount } from "@/hooks/useAccount";
import { needsConnectedChainSwitch } from "@/utils/connectedChain";
import { useWriteFameTransfer } from "@/wagmi";
import { fameFromNetwork, societyFromNetwork } from "@/features/fame/contract";
import {
  loadSocietyNftMetadata,
  societyNftMetadataFallback,
} from "@/features/society-nft-auction/metadata";
import type { SocietyNftAuctionMetadata } from "@/features/society-nft-auction/types";
import { useQueries } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { erc721Abi, isAddressEqual, type Address, type Hash } from "viem";
import { base } from "viem/chains";
import {
  useReadContracts,
  useSwitchChain,
  useWaitForTransactionReceipt,
} from "wagmi";
import { mintedSocietyNftTokenIds } from "../reconciliation";
import {
  initialReadinessTransactionState,
  readinessTransactionError,
  readinessTransactionReducer,
  type ReadinessTransactionState,
} from "../transactionState";

const fameAddress = fameFromNetwork(base.id);
const societyAddress = societyFromNetwork(base.id);

export interface ReconciledSocietyNft {
  tokenId: bigint;
  metadata: SocietyNftAuctionMetadata;
}

export interface UseSocietyNftReconciliationResult {
  transactionState: ReadinessTransactionState;
  nfts: ReconciledSocietyNft[];
  selfTransfer: () => Promise<Hash | null>;
  reset: () => void;
}

export function useSocietyNftReconciliation(): UseSocietyNftReconciliationResult {
  const { address, chainId: connectedChainId, isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteFameTransfer();
  const [transactionState, dispatch] = useReducer(
    readinessTransactionReducer,
    initialReadinessTransactionState,
  );
  const [initiatingAccount, setInitiatingAccount] = useState<Address | null>(
    null,
  );
  const [mintedTokenIds, setMintedTokenIds] = useState<bigint[]>([]);

  const receipt = useWaitForTransactionReceipt({
    hash: transactionState.hash ?? undefined,
    chainId: base.id,
    query: { enabled: transactionState.hash !== null },
  });
  const receiptBlockNumber = receipt.data?.blockNumber;
  const tokenUriContracts = useMemo(
    () =>
      mintedTokenIds.map((tokenId) => ({
        abi: erc721Abi,
        address: societyAddress,
        args: [tokenId] as const,
        chainId: base.id,
        functionName: "tokenURI" as const,
      })),
    [mintedTokenIds],
  );
  const tokenUris = useReadContracts({
    allowFailure: true,
    blockNumber: receiptBlockNumber,
    contracts: tokenUriContracts,
    query: {
      enabled:
        transactionState.status === "verifying" &&
        mintedTokenIds.length > 0 &&
        receiptBlockNumber !== undefined,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      staleTime: Number.POSITIVE_INFINITY,
    },
  });
  const metadataQueries = useQueries({
    queries: mintedTokenIds.map((tokenId, index) => {
      const read = tokenUris.data?.[index];
      const tokenUri =
        read?.status === "success" && typeof read.result === "string"
          ? read.result
          : null;

      return {
        queryKey: [
          "society-nft-readiness",
          "generated-metadata",
          tokenId.toString(),
          tokenUri,
        ],
        queryFn: () => loadSocietyNftMetadata(tokenUri as string),
        enabled: tokenUri !== null,
        staleTime: Number.POSITIVE_INFINITY,
      };
    }),
  });
  const nfts = useMemo(
    () =>
      mintedTokenIds
        .map((tokenId, index) => {
          const tokenUriRead = tokenUris.data?.[index];
          const metadataQuery = metadataQueries[index];
          const metadata =
            metadataQuery?.data ??
            (tokenUris.isError ||
            (tokenUris.data !== undefined &&
              tokenUriRead?.status !== "success") ||
            metadataQuery?.isError
              ? societyNftMetadataFallback(
                  "Society NFT metadata is unavailable",
                )
              : null);

          return metadata ? { tokenId, metadata } : null;
        })
        .filter((nft): nft is ReconciledSocietyNft => nft !== null),
    [metadataQueries, mintedTokenIds, tokenUris.data, tokenUris.isError],
  );

  const reset = useCallback(() => {
    setInitiatingAccount(null);
    setMintedTokenIds((tokenIds) => (tokenIds.length === 0 ? tokenIds : []));
    dispatch({ type: "reset" });
  }, []);

  useEffect(() => {
    reset();
  }, [address, isConnected, reset]);

  useEffect(() => {
    if (
      transactionState.status !== "confirming" ||
      !initiatingAccount ||
      !address ||
      !isAddressEqual(initiatingAccount, address)
    ) {
      return;
    }

    if (receipt.isError) {
      dispatch({
        type: "failed",
        error: readinessTransactionError("receipt_failed"),
      });
      return;
    }

    if (receipt.data?.status === "reverted") {
      dispatch({
        type: "failed",
        error: readinessTransactionError("receipt_reverted"),
      });
      return;
    }

    if (receipt.data?.status !== "success") return;

    const tokenIds = mintedSocietyNftTokenIds(
      receipt.data.logs,
      societyAddress,
      initiatingAccount,
    );
    if (tokenIds.length === 0) {
      dispatch({
        type: "failed",
        error: readinessTransactionError("mint_not_detected"),
      });
      return;
    }

    setMintedTokenIds(tokenIds);
    dispatch({ type: "receipt_confirmed" });
  }, [
    address,
    initiatingAccount,
    receipt.data,
    receipt.isError,
    transactionState.status,
  ]);

  useEffect(() => {
    if (
      transactionState.status !== "verifying" ||
      tokenUris.isFetching ||
      mintedTokenIds.length === 0 ||
      nfts.length !== mintedTokenIds.length
    ) {
      return;
    }

    dispatch({ type: "verification_confirmed" });
  }, [
    mintedTokenIds.length,
    nfts.length,
    tokenUris.isFetching,
    transactionState.status,
  ]);

  const selfTransfer = useCallback(async (): Promise<Hash | null> => {
    if (!isConnected || !address) return null;

    setInitiatingAccount(address);
    setMintedTokenIds([]);

    if (
      needsConnectedChainSwitch({
        isConnected,
        connectedChainId,
        targetChainId: base.id,
      })
    ) {
      dispatch({ type: "switch_requested" });
      try {
        await switchChainAsync({ chainId: base.id });
      } catch {
        dispatch({
          type: "failed",
          error: readinessTransactionError("switch_failed"),
        });
        return null;
      }
    }

    dispatch({ type: "wallet_requested" });
    try {
      const hash = await writeContractAsync({
        account: address,
        address: fameAddress,
        args: [address, 1n],
        chainId: base.id,
      });
      dispatch({ type: "broadcast", hash });
      return hash;
    } catch {
      dispatch({
        type: "failed",
        error: readinessTransactionError("wallet_request_failed"),
      });
      return null;
    }
  }, [
    address,
    connectedChainId,
    isConnected,
    switchChainAsync,
    writeContractAsync,
  ]);

  return {
    transactionState,
    nfts,
    selfTransfer,
    reset,
  };
}
