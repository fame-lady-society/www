"use client";
import { FC, useCallback, useMemo, useState } from "react";
import { useFameusUnwrap } from "./context";
import { SelectableGrid } from "./SelectableGrid";
import cn from "classnames";
import { TransactionsModal } from "@/components/TransactionsModal";

import { useUnwrap } from "./useUnwrap";
import { useLockStatus } from "./useLockStatus";
import { useLock } from "./useLock";
import { LockWithGuardianModal } from "./LockWithGuardianModal";

type ManageTokensProps = {
  tokenIds: bigint[];
  chainId: 8453 | 11155111;
};

export const ManageTokens: FC<ManageTokensProps> = ({ tokenIds, chainId }) => {
  const [lockWithGuardianModalOpen, setLockWithGuardianModalOpen] =
    useState(false);
  const {
    toUnwrapSelectedTokenIds,
    pendingTokenIds,
    completedTokenIds,
    addToUnwrapSelectedTokenIds,
    removeFromUnwrapSelectedTokenIds,
    resetUnwrapSelectedTokenIds,
  } = useFameusUnwrap();

  const {
    lock,
    transactionState: lockTransactionState,
    closeTransactionModal: closeLockTransactionModal,
    onTransactionConfirmed: onLockTransactionConfirmed,
  } = useLock(chainId, toUnwrapSelectedTokenIds);

  const {
    transactionState: unwrapTransactionState,
    unwrap,
    closeTransactionModal: closeUnwrapTransactionModal,
    onTransactionConfirmed: onUnwrapTransactionConfirmed,
  } = useUnwrap(chainId, toUnwrapSelectedTokenIds);

  const { lockStatus, guardianAddresses } = useLockStatus(chainId, tokenIds);
  const handleLockWithGuardianModalClose = useCallback(
    (reason: "cancel" | "confirm", address?: `0x${string}`) => {
      if (reason === "confirm") {
        lock(address);
      }
      setLockWithGuardianModalOpen(false);
    },
    [lock],
  );

  const { tokenIdsToDisplay, lockStatusToDisplay, guardianAddressesToDisplay } =
    useMemo(() => {
      const filteredIndexes = tokenIds
        .map((_, index) => index)
        .filter(
          (index) =>
            !pendingTokenIds.includes(tokenIds[index]) &&
            !completedTokenIds.includes(tokenIds[index]),
        );

      return {
        tokenIdsToDisplay: filteredIndexes.map((i) => tokenIds[i]),
        lockStatusToDisplay: filteredIndexes.map((i) => lockStatus[i]),
        guardianAddressesToDisplay: filteredIndexes.map(
          (i) => guardianAddresses[i],
        ),
      };
    }, [
      tokenIds,
      pendingTokenIds,
      completedTokenIds,
      lockStatus,
      guardianAddresses,
    ]);
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <button
            className={cn("bg-blue-500 text-white px-4 py-2 rounded-md")}
            disabled={toUnwrapSelectedTokenIds.length === 0}
            onClick={() => setLockWithGuardianModalOpen(true)}
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
        lockStatuses={lockStatusToDisplay}
        guardianAddresses={guardianAddressesToDisplay}
      />
      <TransactionsModal
        open={unwrapTransactionState.transactionModelOpen}
        onClose={closeUnwrapTransactionModal}
        transactions={unwrapTransactionState.activeTransactionHashList}
        onTransactionConfirmed={onUnwrapTransactionConfirmed}
      />
      <TransactionsModal
        open={lockTransactionState.transactionModelOpen}
        onClose={closeLockTransactionModal}
        transactions={lockTransactionState.activeTransactionHashList}
        onTransactionConfirmed={onLockTransactionConfirmed}
      />
      <LockWithGuardianModal
        open={lockWithGuardianModalOpen}
        handleClose={handleLockWithGuardianModalClose}
      />
    </>
  );
};
