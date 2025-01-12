"use client";
import { createContext, useState, useCallback, useContext } from "react";
import { base, sepolia } from "viem/chains";

export type FameusContextType = {
  address: `0x${string}`;
  network: "sepolia" | "base";
  chain: typeof base | typeof sepolia;
  toUnwrapSelectedTokenIds: bigint[];
  pendingTokenIds: bigint[];
  completedTokenIds: bigint[];
  addToUnwrapSelectedTokenIds: (...tokenIds: bigint[]) => void;
  removeFromUnwrapSelectedTokenIds: (...tokenIds: bigint[]) => void;
  resetUnwrapSelectedTokenIds: () => void;
  addToPendingTokenIds: (...tokenIds: bigint[]) => void;
  removeFromPendingTokenIds: (...tokenIds: bigint[]) => void;
  addToCompletedTokenIds: (...tokenIds: bigint[]) => void;
  removeFromCompletedTokenIds: (...tokenIds: bigint[]) => void;
  resetPendingTokenIds: () => void;
  resetCompletedTokenIds: () => void;
};

export const FameusContext = createContext<FameusContextType>({
  address: "0x0",
  network: "base",
  chain: base,
  toUnwrapSelectedTokenIds: [],
  pendingTokenIds: [],
  completedTokenIds: [],
  addToUnwrapSelectedTokenIds: () => { },
  removeFromUnwrapSelectedTokenIds: () => { },
  resetUnwrapSelectedTokenIds: () => { },
  addToPendingTokenIds: () => { },
  removeFromPendingTokenIds: () => { },
  addToCompletedTokenIds: () => { },
  removeFromCompletedTokenIds: () => { },
  resetPendingTokenIds: () => { },
  resetCompletedTokenIds: () => { },
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
  const [toUnwrapSelectedTokenIds, setToUnwrapSelectedTokenIds] = useState<
    bigint[]
  >([]);
  const [pendingTokenIds, setPendingTokenIds] = useState<bigint[]>([]);
  const [completedTokenIds, setCompletedTokenIds] = useState<bigint[]>([]);

  const addToUnwrapSelectedTokenIds = useCallback((...tokenIds: bigint[]) => {
    setToUnwrapSelectedTokenIds((prev) => [...prev, ...tokenIds]);
  }, []);

  const removeFromUnwrapSelectedTokenIds = useCallback(
    (...tokenIds: bigint[]) => {
      setToUnwrapSelectedTokenIds((prev) =>
        prev.filter((id) => !tokenIds.includes(id)),
      );
    },
    [],
  );

  const resetUnwrapSelectedTokenIds = useCallback(() => {
    setToUnwrapSelectedTokenIds([]);
  }, []);

  const addToPendingTokenIds = useCallback((...tokenIds: bigint[]) => {
    setPendingTokenIds((prev) => [...prev, ...tokenIds]);
  }, []);

  const removeFromPendingTokenIds = useCallback((...tokenIds: bigint[]) => {
    setPendingTokenIds((prev) => prev.filter((id) => !tokenIds.includes(id)));
  }, []);

  const resetPendingTokenIds = useCallback(() => {
    setPendingTokenIds([]);
  }, []);

  const addToCompletedTokenIds = useCallback((...tokenIds: bigint[]) => {
    setCompletedTokenIds((prev) => [...prev, ...tokenIds]);
  }, []);

  const removeFromCompletedTokenIds = useCallback((...tokenIds: bigint[]) => {
    setCompletedTokenIds((prev) => prev.filter((id) => !tokenIds.includes(id)));
  }, []);

  const resetCompletedTokenIds = useCallback(() => {
    setCompletedTokenIds([]);
  }, []);

  return (
    <FameusContext.Provider
      value={{
        toUnwrapSelectedTokenIds,
        pendingTokenIds,
        completedTokenIds,
        address,
        network,
        chain: network === "base" ? base : sepolia,
        addToUnwrapSelectedTokenIds,
        removeFromUnwrapSelectedTokenIds,
        resetUnwrapSelectedTokenIds,
        addToPendingTokenIds,
        removeFromPendingTokenIds,
        resetPendingTokenIds,
        addToCompletedTokenIds,
        removeFromCompletedTokenIds,
        resetCompletedTokenIds,
      }}
    >
      {children}
    </FameusContext.Provider>
  );
};

export const useFameusUnwrap = () => {
  const context = useContext(FameusContext);
  if (!context) {
    throw new Error("useFameusContext must be used within a FameusProvider");
  }
  return context;
};
