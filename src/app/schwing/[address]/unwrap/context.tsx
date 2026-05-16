"use client";
import { createContext, useState, useCallback, useContext } from "react";

export type FameusContextType = {
  address: `0x${string}`;
  toUnwrapSelectedTokenIds: bigint[];
  addToUnwrapSelectedTokenIds: (...tokenIds: bigint[]) => void;
  removeFromUnwrapSelectedTokenIds: (...tokenIds: bigint[]) => void;
  resetUnwrapSelectedTokenIds: () => void;
};

export const FameusContext = createContext<FameusContextType>({
  address: "0x0",
  toUnwrapSelectedTokenIds: [],
  addToUnwrapSelectedTokenIds: () => {},
  removeFromUnwrapSelectedTokenIds: () => {},
  resetUnwrapSelectedTokenIds: () => {},
});

export const FameusProvider = ({
  children,
  address,
}: {
  children: React.ReactNode;
  address: `0x${string}`;
}) => {
  const [toUnwrapSelectedTokenIds, setToUnwrapSelectedTokenIds] = useState<
    bigint[]
  >([]);

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

  return (
    <FameusContext.Provider
      value={{
        toUnwrapSelectedTokenIds,
        address,
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
