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
  addToWrapSelectedTokenIds: (...tokenIds: bigint[]) => void;
  removeFromWrapSelectedTokenIds: (...tokenIds: bigint[]) => void;
  resetWrapSelectedTokenIds: () => void;
};

export const FameusContext = createContext<FameusContextType>({
  address: "0x0",
  network: "mainnet",
  chain: base,
  toWrapSelectedTokenIds: [],
  addToWrapSelectedTokenIds: () => { },
  removeFromWrapSelectedTokenIds: () => { },
  resetWrapSelectedTokenIds: () => { },
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
  const addToWrapSelectedTokenIds = useCallback((...tokenIds: bigint[]) => {
    setToWrapSelectedTokenIds((prev) => [...prev, ...tokenIds]);
  }, []);

  const removeFromWrapSelectedTokenIds = useCallback(
    (...tokenIds: bigint[]) => {
      setToWrapSelectedTokenIds((prev) =>
        prev.filter((id) => !tokenIds.includes(id)),
      );
    },
    [],
  );


  return (
    <FameusContext.Provider
      value={{
        toWrapSelectedTokenIds,
        address,
        network,
        chain: network === "mainnet" ? base : sepolia,
        addToWrapSelectedTokenIds,
        removeFromWrapSelectedTokenIds,
        resetWrapSelectedTokenIds: () => setToWrapSelectedTokenIds([]),
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
