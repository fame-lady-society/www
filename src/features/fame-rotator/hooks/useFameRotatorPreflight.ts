"use client";

import { useAccount } from "@/hooks/useAccount";
import { fameFromNetwork, societyFromNetwork } from "@/features/fame/contract";
import {
  fameMirrorAbi,
  useReadFameBalanceOf,
  useReadFameGetSkipNft,
  useReadFameUnit,
} from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import type { Address, PublicClient } from "viem";
import { base } from "viem/chains";
import { usePublicClient } from "wagmi";
import { contractQueryReadState } from "@/features/society-nft-readiness/state";
import {
  buildOwnerAtChunks,
  isOwnedTokenScanCurrent,
  projectOwnedTokenScan,
  type OwnedTokenScanResult,
  type OwnerAtChunkResult,
} from "../ownedTokens";
import {
  projectFameRotatorPreflight,
  type FameRotatorPreflight,
  type ReadState,
} from "../state";

const fameAddress = fameFromNetwork(base.id);
const mirrorAddress = societyFromNetwork(base.id);

/** Concurrent ownerAt calls per multicall batch (RPC-friendly). */
const OWNER_AT_CHUNK_SIZE = 50;

export interface UseFameRotatorPreflightResult {
  account: Address | undefined;
  preflight: FameRotatorPreflight;
  ownership: OwnedTokenScanResult | null;
  fameBalance: ReadState<bigint>;
  unit: ReadState<bigint>;
  skipNft: ReadState<boolean>;
  isFetching: boolean;
  refetch: () => Promise<void>;
}

async function scanOwnedTokensAtBlock(
  client: PublicClient,
  account: Address,
  blockNumber: bigint,
): Promise<OwnedTokenScanResult> {
  const balance = await client.readContract({
    address: mirrorAddress,
    abi: fameMirrorAbi,
    functionName: "balanceOf",
    args: [account],
    blockNumber,
  });

  const idChunks = buildOwnerAtChunks(OWNER_AT_CHUNK_SIZE);
  const chunkResults: OwnerAtChunkResult[] = [];

  for (const tokenIds of idChunks) {
    try {
      const contracts = tokenIds.map((tokenId) => ({
        address: mirrorAddress,
        abi: fameMirrorAbi,
        functionName: "ownerAt" as const,
        args: [BigInt(tokenId)] as const,
      }));

      const results = await client.multicall({
        contracts,
        blockNumber,
        allowFailure: true,
      });

      const owners = results.map((result) => {
        if (result.status !== "success") return null;
        const value = result.result;
        if (typeof value !== "string") return null;
        return value as Address;
      });

      chunkResults.push({ tokenIds, owners });
    } catch {
      chunkResults.push({
        tokenIds,
        owners: tokenIds.map(() => null),
        failed: true,
      });
      // Fail closed: still project with remaining uncovered IDs.
      break;
    }
  }

  return projectOwnedTokenScan({
    account,
    blockNumber,
    balance,
    chunks: chunkResults,
  });
}

/**
 * Block-pinned Society ownership scan + acquisition readiness projection.
 * Inventory completeness is a financial safety gate (U3).
 */
export function useFameRotatorPreflight(): UseFameRotatorPreflightResult {
  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient({ chainId: base.id });
  const onBase = isConnected && chainId === base.id;
  const enabled = onBase && address !== undefined && publicClient !== undefined;

  const ownershipQuery = useQuery({
    queryKey: [
      "fame-rotator",
      "owned-tokens",
      base.id,
      address,
      // block is captured inside the query so the key is account-scoped;
      // callers invalidate via refetch after recovery actions.
    ],
    enabled,
    queryFn: async (): Promise<OwnedTokenScanResult> => {
      if (!publicClient || !address) {
        return projectOwnedTokenScan({
          account: null,
          blockNumber: null,
          balance: null,
          chunks: [],
        });
      }
      const blockNumber = await publicClient.getBlockNumber();
      return scanOwnedTokensAtBlock(publicClient, address, blockNumber);
    },
    staleTime: 15_000,
    retry: false,
  });

  const ownership = useMemo(() => {
    const data = ownershipQuery.data ?? null;
    if (!data) return null;
    if (!isOwnedTokenScanCurrent(data, address, data.blockNumber)) {
      return null;
    }
    return data;
  }, [address, ownershipQuery.data]);

  const needsAcquisitionReads =
    enabled &&
    ownership !== null &&
    ownership.status === "complete" &&
    ownership.ownedIds.length === 0;

  const fameBalanceQuery = useReadFameBalanceOf({
    address: fameAddress,
    args: [address ?? "0x0000000000000000000000000000000000000000"],
    chainId: base.id,
    query: { enabled: needsAcquisitionReads },
  });
  const unitQuery = useReadFameUnit({
    address: fameAddress,
    chainId: base.id,
    query: { enabled: needsAcquisitionReads },
  });
  const skipNftQuery = useReadFameGetSkipNft({
    address: fameAddress,
    args: [address ?? "0x0000000000000000000000000000000000000000"],
    chainId: base.id,
    query: { enabled: needsAcquisitionReads },
  });

  const fameBalance = useMemo(
    () =>
      contractQueryReadState(needsAcquisitionReads, {
        data: fameBalanceQuery.data,
        isError: fameBalanceQuery.isError,
        isSuccess: fameBalanceQuery.isSuccess,
      }),
    [
      fameBalanceQuery.data,
      fameBalanceQuery.isError,
      fameBalanceQuery.isSuccess,
      needsAcquisitionReads,
    ],
  );
  const unit = useMemo(
    () =>
      contractQueryReadState(needsAcquisitionReads, {
        data: unitQuery.data,
        isError: unitQuery.isError,
        isSuccess: unitQuery.isSuccess,
      }),
    [
      needsAcquisitionReads,
      unitQuery.data,
      unitQuery.isError,
      unitQuery.isSuccess,
    ],
  );
  const skipNft = useMemo(
    () =>
      contractQueryReadState(needsAcquisitionReads, {
        data: skipNftQuery.data,
        isError: skipNftQuery.isError,
        isSuccess: skipNftQuery.isSuccess,
      }),
    [
      needsAcquisitionReads,
      skipNftQuery.data,
      skipNftQuery.isError,
      skipNftQuery.isSuccess,
    ],
  );

  const preflight = useMemo(
    () =>
      projectFameRotatorPreflight({
        isConnected,
        account: address,
        ownership,
        ownershipPending: enabled && ownershipQuery.isPending,
        fameBalance: needsAcquisitionReads ? fameBalance : null,
        unit: needsAcquisitionReads ? unit : null,
        skipNft: needsAcquisitionReads ? skipNft : null,
      }),
    [
      address,
      enabled,
      fameBalance,
      isConnected,
      needsAcquisitionReads,
      ownership,
      ownershipQuery.isPending,
      skipNft,
      unit,
    ],
  );

  const refetch = useCallback(async () => {
    await ownershipQuery.refetch();
    if (needsAcquisitionReads) {
      await Promise.all([
        fameBalanceQuery.refetch(),
        unitQuery.refetch(),
        skipNftQuery.refetch(),
      ]);
    }
  }, [
    fameBalanceQuery,
    needsAcquisitionReads,
    ownershipQuery,
    skipNftQuery,
    unitQuery,
  ]);

  return {
    account: address,
    preflight,
    ownership,
    fameBalance,
    unit,
    skipNft,
    isFetching:
      ownershipQuery.isFetching ||
      (needsAcquisitionReads &&
        (fameBalanceQuery.isFetching ||
          unitQuery.isFetching ||
          skipNftQuery.isFetching)),
    refetch,
  };
}

/** Exported for focused tests of the block-pinned multicall scan. */
export { scanOwnedTokensAtBlock };
