import { useCallback, useEffect, useMemo, useState } from "react";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import type { Hex } from "viem";
import { flsNamingAbi, flsNamingAddress } from "@/wagmi";
import type { NetworkType } from "./useOwnedGateNftTokens";
import { getChainId } from "../utils/networkUtils";

export type PendingChange = {
  key: Hex;
  value: Hex;
  label: string;
};

type UseProfileBatchOptions = {
  network: NetworkType;
  onRefetchIdentity?: () => Promise<void> | void;
};

export function useProfileBatch({
  network,
  onRefetchIdentity,
}: UseProfileBatchOptions) {
  const chainId = getChainId(network);
  const [pendingChanges, setPendingChanges] = useState<Map<string, PendingChange>>(
    () => new Map(),
  );

  const {
    mutate: writeContract,
    data: txHash,
    isPending,
    error,
    reset,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const addChange = useCallback((id: string, change: PendingChange) => {
    setPendingChanges((prev) => {
      const next = new Map(prev);
      next.set(id, change);
      return next;
    });
  }, []);

  const removeChange = useCallback((id: string) => {
    setPendingChanges((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const pendingList = useMemo(() => {
    return Array.from(pendingChanges.values());
  }, [pendingChanges]);

  const hasPendingChanges = pendingChanges.size > 0;

  const submitBatch = useCallback(() => {
    if (!hasPendingChanges) return;
    const keys = pendingList.map((entry) => entry.key);
    const values = pendingList.map((entry) => entry.value);

    writeContract({
      address: flsNamingAddress[chainId as keyof typeof flsNamingAddress],
      abi: flsNamingAbi,
      functionName: "setMetadataBatch" as const,
      chainId,
      args: [keys, values],
    });
  }, [hasPendingChanges, pendingList, writeContract, chainId]);

  useEffect(() => {
    if (!isSuccess) return;
    setPendingChanges(new Map());
    reset();
    void onRefetchIdentity?.();
  }, [isSuccess, reset, onRefetchIdentity]);

  return {
    pendingChanges,
    pendingList,
    hasPendingChanges,
    addChange,
    removeChange,
    submitBatch,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}
