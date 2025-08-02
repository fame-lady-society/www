"use client";
import { createContext, useState, useCallback, useContext } from "react";
import { base, sepolia } from "viem/chains";

export type FameusContextType = {
  address: `0x${string}`;
  network: "base" | "sepolia";
  chain: typeof base | typeof sepolia;
  toWrapSelectedTokenIds: bigint[];
  pendingWrapTokenIds: bigint[];
  completedWrapTokenIds: bigint[];
  addToWrapSelectedTokenIds: (...tokenIds: bigint[]) => void;
  removeFromWrapSelectedTokenIds: (...tokenIds: bigint[]) => void;
  resetWrapSelectedTokenIds: () => void;
  addToPendingWrapTokenIds: (...tokenIds: bigint[]) => void;
  removeFromPendingWrapTokenIds: (...tokenIds: bigint[]) => void;
  resetPendingWrapTokenIds: () => void;
  addToCompletedWrapTokenIds: (...tokenIds: bigint[]) => void;
  removeFromCompletedWrapTokenIds: (...tokenIds: bigint[]) => void;
  resetCompletedWrapTokenIds: () => void;
};

export const FameusContext = createContext<FameusContextType>({
  address: "0x0",
  network: "base",
  chain: base,
  toWrapSelectedTokenIds: [],
  pendingWrapTokenIds: [],
  completedWrapTokenIds: [],
  addToWrapSelectedTokenIds: () => {},
  removeFromWrapSelectedTokenIds: () => {},
  resetWrapSelectedTokenIds: () => {},
  addToPendingWrapTokenIds: () => {},
  removeFromPendingWrapTokenIds: () => {},
  resetPendingWrapTokenIds: () => {},
  addToCompletedWrapTokenIds: () => {},
  removeFromCompletedWrapTokenIds: () => {},
  resetCompletedWrapTokenIds: () => {},
});

export const FameusProvider = ({
  children,
  address,
  network,
}: {
  children: React.ReactNode;
  address: `0x${string}`;
  network: "base" | "sepolia";
}) => {
  const [toWrapSelectedTokenIds, setToWrapSelectedTokenIds] = useState<
    bigint[]
  >([]);
  const [pendingWrapTokenIds, setPendingWrapTokenIds] = useState<bigint[]>([]);
  const [completedWrapTokenIds, setCompletedWrapTokenIds] = useState<bigint[]>(
    [],
  );
  const addToWrapSelectedTokenIds = useCallback((...tokenIds: bigint[]) => {
    setToWrapSelectedTokenIds((prev) => [
      ...tokenIds,
      ...prev.filter((id) => !tokenIds.includes(id)),
    ]);
  }, []);

  const removeFromWrapSelectedTokenIds = useCallback(
    (...tokenIds: bigint[]) => {
      setToWrapSelectedTokenIds((prev) =>
        prev.filter((id) => !tokenIds.includes(id)),
      );
    },
    [],
  );

  const addToPendingWrapTokenIds = useCallback((...tokenIds: bigint[]) => {
    setPendingWrapTokenIds((prev) => [
      ...tokenIds,
      ...prev.filter((id) => !tokenIds.includes(id)),
    ]);
  }, []);

  const removeFromPendingWrapTokenIds = useCallback((...tokenIds: bigint[]) => {
    setPendingWrapTokenIds((prev) =>
      prev.filter((id) => !tokenIds.includes(id)),
    );
  }, []);

  const addToCompletedWrapTokenIds = useCallback((...tokenIds: bigint[]) => {
    setCompletedWrapTokenIds((prev) => [
      ...tokenIds,
      ...prev.filter((id) => !tokenIds.includes(id)),
    ]);
  }, []);

  const removeFromCompletedWrapTokenIds = useCallback(
    (...tokenIds: bigint[]) => {
      setCompletedWrapTokenIds((prev) =>
        prev.filter((id) => !tokenIds.includes(id)),
      );
    },
    [],
  );

  return (
    <FameusContext.Provider
      value={{
        toWrapSelectedTokenIds,
        pendingWrapTokenIds,
        completedWrapTokenIds,
        address,
        network,
        chain: network === "base" ? base : sepolia,
        addToWrapSelectedTokenIds,
        removeFromWrapSelectedTokenIds,
        resetWrapSelectedTokenIds: () => setToWrapSelectedTokenIds([]),
        addToPendingWrapTokenIds,
        removeFromPendingWrapTokenIds,
        resetPendingWrapTokenIds: () => setPendingWrapTokenIds([]),
        addToCompletedWrapTokenIds,
        removeFromCompletedWrapTokenIds,
        resetCompletedWrapTokenIds: () => setCompletedWrapTokenIds([]),
      }}
    >
      {children}
    </FameusContext.Provider>
  );
};

export const useFameusWrap = () => {
  const context = useContext(FameusContext);
  if (!context) {
    throw new Error("useFameusContext must be used within a FameusProvider");
  }
  return context;
};
