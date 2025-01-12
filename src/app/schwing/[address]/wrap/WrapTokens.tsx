"use client";
import { FC } from "react";
import { useFameusWrap } from "../context";
import { SelectableGrid } from "./SelectableGrid";
import cn from "classnames";
import { TransactionsModal } from "@/components/TransactionsModal";
import { useApproveAndWrap } from "./useApproveAndWrap";

type WrapTokensProps = {
  tokenIds: bigint[];
  chainId: 8453 | 11155111;
};

export const WrapTokens: FC<WrapTokensProps> = ({ tokenIds, chainId }) => {
  const {
    toWrapSelectedTokenIds,
    addToWrapSelectedTokenIds,
    removeFromWrapSelectedTokenIds,
    resetWrapSelectedTokenIds,
  } = useFameusWrap();

  const {
    transactionState,
    wrap,
    closeTransactionModal,
    onTransactionConfirmed,
    isApprovedForAll,
  } = useApproveAndWrap(chainId, toWrapSelectedTokenIds);
  const needsApproval = !isApprovedForAll && toWrapSelectedTokenIds.length > 0;
  const needsWrap = toWrapSelectedTokenIds.length > 0 && isApprovedForAll;

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <button
            className={cn(" text-white px-4 py-2 rounded-md", {
              "bg-gray-500":
                tokenIds.length === 0 || toWrapSelectedTokenIds.length === 0,
              "bg-blue-500": needsApproval || needsWrap,
            })}
            disabled={!needsApproval && !needsWrap}
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
        tokenIds={tokenIds}
        selectedTokenIds={toWrapSelectedTokenIds}
        onTokenSelected={addToWrapSelectedTokenIds}
        onTokenUnselected={removeFromWrapSelectedTokenIds}
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
