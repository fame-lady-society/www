"use client";
import { FC, useMemo } from "react";
import { useFameusUnwrap } from "./context";
import { SelectableGrid } from "./SelectableGrid";
import cn from "classnames";
import { TransactionsModal } from "@/components/TransactionsModal";

import { useUnwrap } from "./useUnwrap";
import { useLockStatus } from "./useLockStatus";
import { useLock } from "./useLock";

type ManageTokensProps = {
  tokenIds: bigint[];
  chainId: 8453 | 11155111;
};

export const ManageTokens: FC<ManageTokensProps> = ({ tokenIds, chainId }) => {
  const {
    toUnwrapSelectedTokenIds,
    pendingTokenIds,
    completedTokenIds,
    addToUnwrapSelectedTokenIds,
    removeFromUnwrapSelectedTokenIds,
    resetUnwrapSelectedTokenIds,
  } = useFameusUnwrap();

  const {
    transactionState,
    unwrap,
    closeTransactionModal,
    onTransactionConfirmed,
  } = useUnwrap(chainId, toUnwrapSelectedTokenIds);

  const tokenIdsToDisplay = useMemo(() => {
    return tokenIds.filter(
      (id) => !pendingTokenIds.includes(id) && !completedTokenIds.includes(id),
    );
  }, [tokenIds, pendingTokenIds, completedTokenIds]);

  const { lockStatus, guardianAddresses } = useLockStatus(chainId, tokenIds);

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <button
            className={cn("bg-blue-500 text-white px-4 py-2 rounded-md")}
            disabled={toUnwrapSelectedTokenIds.length === 0}
          // onClick={lock}
          >
            Lock
          </button>
          <button
            className={cn("bg-blue-500 text-white px-4 py-2 rounded-md")}
            disabled={toUnwrapSelectedTokenIds.length === 0}
            onClick={unwrap}
          >
            Unwrap
          </button>

          {toUnwrapSelectedTokenIds.length < tokenIds.length &&
            tokenIds.length > 0 && (
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
        tokenIds={tokenIdsToDisplay}
        selectedTokenIds={toUnwrapSelectedTokenIds}
        onTokenSelected={addToUnwrapSelectedTokenIds}
        onTokenUnselected={removeFromUnwrapSelectedTokenIds}
        lockStatuses={lockStatus}
        guardianAddresses={guardianAddresses}
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
