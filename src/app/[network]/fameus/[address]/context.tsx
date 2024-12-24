"use client";
import {
  createContext,
  useState,
  useCallback,
  useContext,
} from "react";
import { base, sepolia } from "viem/chains";

export type FameusContextType = {
  address: `0x${string}`;
  network: "mainnet" | "sepolia";
  chain: typeof base | typeof sepolia;
  toWrapSelectedTokenIds: bigint[];
  toUnwrapSelectedTokenIds: bigint[];
  addToWrapSelectedTokenIds: (...tokenIds: bigint[]) => void;
  addToUnwrapSelectedTokenIds: (...tokenIds: bigint[]) => void;
  removeFromWrapSelectedTokenIds: (...tokenIds: bigint[]) => void;
  removeFromUnwrapSelectedTokenIds: (...tokenIds: bigint[]) => void;
  resetWrapSelectedTokenIds: () => void;
  resetUnwrapSelectedTokenIds: () => void;
};

export const FameusContext = createContext<FameusContextType>({
  address: "0x0",
  network: "mainnet",
  chain: base,
  toWrapSelectedTokenIds: [],
  toUnwrapSelectedTokenIds: [],
  addToWrapSelectedTokenIds: () => { },
  addToUnwrapSelectedTokenIds: () => { },
  removeFromWrapSelectedTokenIds: () => { },
  removeFromUnwrapSelectedTokenIds: () => { },
  resetWrapSelectedTokenIds: () => { },
  resetUnwrapSelectedTokenIds: () => { },
});

export const FameusProvider = ({
  children,
  address,
  network,
}: {
  children: React.ReactNode;
  address: `0x${string}`;
  network: "mainnet" | "sepolia";
}) => {
  const [toWrapSelectedTokenIds, setToWrapSelectedTokenIds] = useState<
    bigint[]
  >([]);
  const [toUnwrapSelectedTokenIds, setToUnwrapSelectedTokenIds] = useState<
    bigint[]
  >([]);

  const addToWrapSelectedTokenIds = useCallback((...tokenIds: bigint[]) => {
    setToWrapSelectedTokenIds((prev) => [...prev, ...tokenIds]);
  }, []);

  const addToUnwrapSelectedTokenIds = useCallback((...tokenIds: bigint[]) => {
    setToUnwrapSelectedTokenIds((prev) => [...prev, ...tokenIds]);
  }, []);

  const removeFromWrapSelectedTokenIds = useCallback(
    (...tokenIds: bigint[]) => {
      setToWrapSelectedTokenIds((prev) =>
        prev.filter((id) => !tokenIds.includes(id)),
      );
    },
    [],
  );

  const removeFromUnwrapSelectedTokenIds = useCallback((...tokenIds: bigint[]) => {
    setToUnwrapSelectedTokenIds((prev) =>
      prev.filter((id) => !tokenIds.includes(id)),
    );
  }, []);

  return (
    <FameusContext.Provider
      value={{
        toWrapSelectedTokenIds,
        toUnwrapSelectedTokenIds,
        address,
        network,
        chain: network === "mainnet" ? base : sepolia,
        addToWrapSelectedTokenIds,
        addToUnwrapSelectedTokenIds,
        removeFromWrapSelectedTokenIds,
        removeFromUnwrapSelectedTokenIds,
        resetWrapSelectedTokenIds: () => setToWrapSelectedTokenIds([]),
        resetUnwrapSelectedTokenIds: () => setToUnwrapSelectedTokenIds([]),
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
