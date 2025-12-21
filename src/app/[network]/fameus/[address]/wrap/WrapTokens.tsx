"use client";
import { FC, useCallback, useMemo } from "react";
import { useFameusWrap } from "./context";
import { SelectableGrid } from "./SelectableGrid";
import cn from "classnames";
import { TransactionsModal, Transaction } from "@/components/TransactionsModal";
import { useApproveAndWrap } from "./useApproveAndWrap";
import { useParams, useRouter } from "next/navigation";
import { useHasCreatorRole } from "./useHasCreatorRole";
import { useAccount } from "@/hooks/useAccount";
import { useSwapMetadata } from "./useSwapMetadata";
import { base } from "viem/chains";

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

  const { address } = useAccount();

  const hasCreatorRole = useHasCreatorRole(address);

  const {
    transactionState,
    wrap,
    closeTransactionModal,
    onTransactionConfirmed: doUseApproveAndWrapOnTransactionConfirmed,
    isApprovedForAll,
  } = useApproveAndWrap(chainId, toWrapSelectedTokenIds);

  const {
    transactionState: swapMetadataTransactionState,
    closeTransactionModal: closeSwapMetadataTransactionModal,
    onTransactionConfirmed: doUseSwapMetadataOnTransactionConfirmed,
    banishToArtPool,
    banishToBurnPool,
    banishToMintPool,
  } = useSwapMetadata(chainId as typeof base.id);

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

          {hasCreatorRole && (
            <button
              className="bg-blue-400 text-white px-4 py-2 rounded-md"
              disabled={toWrapSelectedTokenIds.length !== 1}
              onClick={() => {}}
            >
              Metadata Swap
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
          <>
            {transactionState.activeTransactionHashList.length > 0 &&
              transactionState.activeTransactionHashList[0].kind ===
                "approval" && (
                <p className="mb-4">
                  This approval is required to grant the DAO the ability to swap
                  the metadata of the selected token
                </p>
              )}
            {transactionState.activeTransactionHashList.length > 0 &&
              transactionState.activeTransactionHashList[0].kind.startsWith(
                "banish",
              ) && (
                <p className="mb-4">
                  This transaction will swap the metadata of the selected token
                </p>
              )}
          </>
        }
      />
    </>
  );
};
