"use client";
import { FC, useCallback, useMemo } from "react";
import { useFameusWrap } from "./context";
import { SelectableGrid } from "./SelectableGrid";
import cn from "classnames";
import { TransactionsModal, Transaction } from "@/components/TransactionsModal";
import { useApproveAndWrap } from "./useApproveAndWrap";
import { useParams, useRouter } from "next/navigation";

type WrapTokensProps = {
  tokenIds: bigint[];
  chainId: 8453 | 11155111;
};

export const WrapTokens: FC<WrapTokensProps> = ({ tokenIds, chainId }) => {
  const {
    toWrapSelectedTokenIds,
    pendingWrapTokenIds,
    completedWrapTokenIds,
    addToWrapSelectedTokenIds,
    removeFromWrapSelectedTokenIds,
    resetWrapSelectedTokenIds,
  } = useFameusWrap();

  const {
    transactionState,
    wrap,
    closeTransactionModal,
    onTransactionConfirmed: doUseApproveAndWrapOnTransactionConfirmed,
    isApprovedForAll,
  } = useApproveAndWrap(chainId, toWrapSelectedTokenIds);

  const onTransactionConfirmed = useCallback(
    (tx: Transaction<unknown>) => {
      doUseApproveAndWrapOnTransactionConfirmed(tx);
    },
    [doUseApproveAndWrapOnTransactionConfirmed],
  );

  const tokenIdsToDisplay = useMemo(() => {
    return tokenIds.filter((id) => !completedWrapTokenIds.includes(id));
  }, [tokenIds, completedWrapTokenIds]);

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <button
            className={cn("bg-blue-500 text-white px-4 py-2 rounded-md")}
            disabled={isApprovedForAll && toWrapSelectedTokenIds.length === 0}
            onClick={wrap}
          >
            {isApprovedForAll ? "Wrap" : "Approve"}
          </button>

          {toWrapSelectedTokenIds.length < tokenIds.length &&
            tokenIds.length > 0 && (
              <button
                className="bg-blue-400 text-white px-4 py-2 rounded-md"
                onClick={() => {
                  resetWrapSelectedTokenIds();
                  addToWrapSelectedTokenIds(...tokenIds);
                }}
              >
                Select All
              </button>
            )}

          {toWrapSelectedTokenIds.length > 0 && (
            <button
              className="bg-blue-400 text-white px-4 py-2 rounded-md"
              onClick={resetWrapSelectedTokenIds}
            >
              Reset
            </button>
          )}
        </div>
        {toWrapSelectedTokenIds.length > 0 && (
          <p className="text-sm text-gray-500">
            {toWrapSelectedTokenIds.length} tokens selected
          </p>
        )}
      </div>
      <SelectableGrid
        tokenIds={tokenIdsToDisplay}
        selectedTokenIds={toWrapSelectedTokenIds}
        pendingTokenIds={pendingWrapTokenIds}
        onTokenSelected={addToWrapSelectedTokenIds}
        onTokenUnselected={removeFromWrapSelectedTokenIds}
      />
      <TransactionsModal
        open={transactionState.transactionModelOpen}
        onClose={closeTransactionModal}
        transactions={transactionState.activeTransactionHashList}
        onTransactionConfirmed={onTransactionConfirmed}
        topContent={
          <p className="mb-4">
            Your wallet may flag this transaction as suspicious. Please review
            the transaction simulation and confirm the transaction.
          </p>
        }
      />
    </>
  );
};
