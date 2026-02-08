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
  storageKey?: string;
};

export function useProfileBatch({
  network,
  onRefetchIdentity,
  storageKey,
}: UseProfileBatchOptions) {
  const chainId = getChainId(network);
  const [pendingChanges, setPendingChanges] = useState<Map<string, PendingChange>>(
    () => new Map(),
  );
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);

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
    if (!storageKey || hasLoadedStorage) return;
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      setHasLoadedStorage(true);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Array<[string, PendingChange]>;
      setPendingChanges(new Map(parsed));
    } catch {
      window.localStorage.removeItem(storageKey);
    } finally {
      setHasLoadedStorage(true);
    }
  }, [storageKey, hasLoadedStorage]);

  useEffect(() => {
    if (!storageKey || !hasLoadedStorage) return;
    if (typeof window === "undefined") return;
    if (pendingChanges.size === 0) {
      window.localStorage.removeItem(storageKey);
      return;
    }
    const payload = JSON.stringify(Array.from(pendingChanges.entries()));
    window.localStorage.setItem(storageKey, payload);
  }, [pendingChanges, storageKey, hasLoadedStorage]);

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
