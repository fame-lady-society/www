"use client";
import { FC, useCallback } from "react";
import { useFameusWrap } from "../context";
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
  const router = useRouter();
  const {
    toWrapSelectedTokenIds,
    addToWrapSelectedTokenIds,
    removeFromWrapSelectedTokenIds,
    resetWrapSelectedTokenIds,
    removeFromPendingWrapTokenIds
  } = useFameusWrap();

  const { address: addressParam, network: networkParam } = useParams<{ address: string, network: string }>() ?? {};
  const address = addressParam as `0x${string}`;
  const network = networkParam as "base" | "sepolia";

  const {
    transactionState,
    wrap,
    closeTransactionModal,
    onTransactionConfirmed: doUseApproveAndWrapOnTransactionConfirmed,
    isApprovedForAll,
  } = useApproveAndWrap(chainId, toWrapSelectedTokenIds);

  const onTransactionConfirmed = useCallback((tx: Transaction<unknown>) => {
    removeFromPendingWrapTokenIds(...toWrapSelectedTokenIds);
    doUseApproveAndWrapOnTransactionConfirmed(tx);
    router.push(`/${network}/fameus/${address}/wrap/complete`);
  }, [toWrapSelectedTokenIds, removeFromPendingWrapTokenIds, doUseApproveAndWrapOnTransactionConfirmed, router, network, address]);

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

          {toWrapSelectedTokenIds.length < tokenIds.length && tokenIds.length > 0 && (
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
