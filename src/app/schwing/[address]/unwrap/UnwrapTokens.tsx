"use client";
import { FC } from "react";
import { useFameusUnwrap } from "./context";
import { SelectableGrid } from "./SelectableGrid";
import cn from "classnames";
import { TransactionsModal } from "@/components/TransactionsModal";
import { useUnwrap } from "./useUnwrap";

type UnWrapTokensProps = {
  tokenIds: bigint[];
};

export const UnWrapTokens: FC<UnWrapTokensProps> = ({ tokenIds }) => {
  const {
    toUnwrapSelectedTokenIds,
    addToUnwrapSelectedTokenIds,
    removeFromUnwrapSelectedTokenIds,
    resetUnwrapSelectedTokenIds,
  } = useFameusUnwrap();

  const {
    transactionState,
    unwrap,
    closeTransactionModal,
    onTransactionConfirmed,
  } = useUnwrap(toUnwrapSelectedTokenIds);

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <button
            className={cn("bg-blue-500 text-white px-4 py-2 rounded-md")}
            disabled={toUnwrapSelectedTokenIds.length === 0}
            onClick={unwrap}
          >
            Unwrap
          </button>

          {toUnwrapSelectedTokenIds.length < tokenIds.length && tokenIds.length > 0 && (
            <button
              className="bg-blue-400 text-white px-4 py-2 rounded-md"
              onClick={() => {
                resetUnwrapSelectedTokenIds();
                addToUnwrapSelectedTokenIds(...tokenIds);
              }}
            >
              Select All
            </button>
          )}

          {toUnwrapSelectedTokenIds.length > 0 && (
            <button
              className="bg-blue-400 text-white px-4 py-2 rounded-md"
              onClick={resetUnwrapSelectedTokenIds}
            >
              Reset
            </button>
          )}
        </div>
        {toUnwrapSelectedTokenIds.length > 0 && (
          <p className="text-sm text-gray-500">
            {toUnwrapSelectedTokenIds.length} tokens selected
          </p>
        )}
      </div>
      <SelectableGrid
        tokenIds={tokenIds}
        selectedTokenIds={toUnwrapSelectedTokenIds}
        onTokenSelected={addToUnwrapSelectedTokenIds}
        onTokenUnselected={removeFromUnwrapSelectedTokenIds}
      />
      <TransactionsModal
        open={transactionState.transactionModelOpen}
        onClose={closeTransactionModal}
        transactions={transactionState.activeTransactionHashList}
        onTransactionConfirmed={onTransactionConfirmed}
      />
    </>
  );
};
