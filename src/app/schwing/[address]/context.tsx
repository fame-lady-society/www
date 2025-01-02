"use client";
import {
  createContext,
  useState,
  useCallback,
  useContext,
} from "react";

export type FameusContextType = {
  address: `0x${string}`;
  toWrapSelectedTokenIds: bigint[];
  addToWrapSelectedTokenIds: (...tokenIds: bigint[]) => void;
  removeFromWrapSelectedTokenIds: (...tokenIds: bigint[]) => void;
  resetWrapSelectedTokenIds: () => void;
};

export const FameusContext = createContext<FameusContextType>({
  address: "0x0",
  toWrapSelectedTokenIds: [],
  addToWrapSelectedTokenIds: () => { },
  removeFromWrapSelectedTokenIds: () => { },
  resetWrapSelectedTokenIds: () => { },
});

export const FameusProvider = ({
  children,
  address,
}: {
  children: React.ReactNode;
  address: `0x${string}`;
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
