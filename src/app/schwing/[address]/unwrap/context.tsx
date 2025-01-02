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
  toUnwrapSelectedTokenIds: bigint[];
  addToUnwrapSelectedTokenIds: (...tokenIds: bigint[]) => void;
  removeFromUnwrapSelectedTokenIds: (...tokenIds: bigint[]) => void;
  resetUnwrapSelectedTokenIds: () => void;
};

export const FameusContext = createContext<FameusContextType>({
  address: "0x0",
  network: "mainnet",
  chain: base,
  toUnwrapSelectedTokenIds: [],
  addToUnwrapSelectedTokenIds: () => { },
  removeFromUnwrapSelectedTokenIds: () => { },
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
  const [toUnwrapSelectedTokenIds, setToUnwrapSelectedTokenIds] = useState<
    bigint[]
  >([]);

  const addToUnwrapSelectedTokenIds = useCallback((...tokenIds: bigint[]) => {
    setToUnwrapSelectedTokenIds((prev) => [...prev, ...tokenIds]);
  }, []);


  const removeFromUnwrapSelectedTokenIds = useCallback((...tokenIds: bigint[]) => {
    setToUnwrapSelectedTokenIds((prev) =>
      prev.filter((id) => !tokenIds.includes(id)),
    );
  }, []);

  return (
    <FameusContext.Provider
      value={{
        toUnwrapSelectedTokenIds,
        address,
        network,
        chain: network === "mainnet" ? base : sepolia,
        addToUnwrapSelectedTokenIds,
        removeFromUnwrapSelectedTokenIds,
        resetUnwrapSelectedTokenIds: () => setToUnwrapSelectedTokenIds([]),
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
