"use client";
import { FC, useCallback, useEffect, useState } from "react";
import { useFameusWrap } from "./context";
import { SelectableGrid } from "./SelectableGrid";
import cn from "classnames";
import { useReadFameMirrorIsApprovedForAll, useWriteFameMirrorSetApprovalForAll, useWriteGovSocietyDepositFor } from "@/wagmi";
import { govSocietyFromNetwork, societyFromNetwork } from "@/features/fame/contract";
import { type base, type sepolia } from "viem/chains";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";
import { Transaction, TransactionsModal } from "@/components/TransactionsModal";
import { type WriteContractData } from "wagmi/query";
import { useNotifications } from "@/features/notifications/Context";
import {
  BaseError,
} from "viem";


type TransactionState = {
  transactionModelOpen: boolean;
  activeTransactionHashList: { kind: string; hash?: WriteContractData }[];
  completedTransactionHashList: { kind: string; hash: WriteContractData }[];
};

export const WrapTokens: FC<{
  tokenIds: bigint[];
  chainId: typeof sepolia.id | typeof base.id;
}> = ({ tokenIds, chainId }) => {
  const { address } = useAccount();
  const {
    toWrapSelectedTokenIds,
    addToWrapSelectedTokenIds,
    removeFromWrapSelectedTokenIds,
    resetWrapSelectedTokenIds,
  } = useFameusWrap();

  const { writeContractAsync: writeGovSocietyDepositFor } =
    useWriteGovSocietyDepositFor();
  const { data: isApprovedForAll } = useReadFameMirrorIsApprovedForAll({
    address: societyFromNetwork(chainId),
    args: address ? [address, govSocietyFromNetwork(chainId)] : undefined,
  });
  const { writeContractAsync: writeFameMirrorSetApprovalForAll } =
    useWriteFameMirrorSetApprovalForAll();
  const [transactionState, setTransactionState] = useState<TransactionState>({
    transactionModelOpen: false,
    activeTransactionHashList: [],
    completedTransactionHashList: [],
  });

  const { data: receipt0, isSuccess: isSuccess0, isError: isError0, failureReason: failureReason0 } = useWaitForTransactionReceipt({
    hash: transactionState.activeTransactionHashList[0]?.hash,
  });
  const { data: receipt1, isSuccess: isSuccess1, isError: isError1 } = useWaitForTransactionReceipt({
    hash: transactionState.activeTransactionHashList[1]?.hash,
  });
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (isSuccess0) {
      addNotification({
        message: "Approval successful",
        type: "success",
        id: "approval-success",
        autoHideMs: 5000,
      });
    }
  }, [isSuccess0, addNotification]);

  useEffect(() => {
    if (isSuccess1) {
      addNotification({
        message: "Wrap successful",
        type: "success",
        id: "wrap-success",
        autoHideMs: 5000,
      });
    }
  }, [isSuccess1, addNotification]);

  useEffect(() => {
    if (isSuccess0 || isError0) {
      setTransactionState((state) => {
        const newActiveTransactionHashList = state.activeTransactionHashList.filter((t) => t.hash !== transactionState.activeTransactionHashList[0]?.hash);
        return {
          ...state,
          activeTransactionHashList: newActiveTransactionHashList,
          transactionModelOpen: newActiveTransactionHashList.length > 0,
        };
      });
    }
  }, [isSuccess0, isError0, transactionState.activeTransactionHashList]);
  useEffect(() => {
    if (isSuccess1 || isError1) {
      setTransactionState((state) => ({
        ...state,
        activeTransactionHashList: state.activeTransactionHashList.filter((t) => t.hash !== transactionState.activeTransactionHashList[1]?.hash),
        transactionModelOpen: state.activeTransactionHashList.length > 0,
      }));
    }
  }, [isSuccess1, isError1, transactionState.activeTransactionHashList]);
  const wrap = useCallback(async () => {
    if (!address) return;
    try {
      setTransactionState((state) => ({
        ...state,
        transactionModelOpen: true,
      }));
      let approvalWasAttemptedAndFailed = false;
      if (!isApprovedForAll && toWrapSelectedTokenIds.length !== 0) {
        setTransactionState((state) => ({
          ...state,
          activeTransactionHashList: [
            ...state.activeTransactionHashList.filter((t) => t.kind !== "approval"),
            {
              kind: "approval",
            },
          ],
          transactionModelOpen: true,
        }));
        try {
          const approvalResponse = await writeFameMirrorSetApprovalForAll({
            address: societyFromNetwork(chainId),
            args: [govSocietyFromNetwork(chainId), true],
          });
          setTransactionState((state) => ({
            ...state,
            activeTransactionHashList: [
              ...state.activeTransactionHashList.filter((t) => t.kind !== "approval"),
              {
                kind: "approval",
                hash: approvalResponse,
              },
            ],
            transactionModelOpen: true,
          }));
        } catch (error) {
          approvalWasAttemptedAndFailed = true;
          if (error instanceof BaseError) {
            addNotification({
              message: error.metaMessages?.length ? (
                error.metaMessages.map(m => <p key={m}>{m}</p>)
              ) : error.message,
              type: "error",
              id: "approval-error",
              autoHideMs: 5000,
            });
          }
          setTransactionState((state) => ({
            ...state,
            transactionModelOpen: false,
          }));
        }
      }
      if (!approvalWasAttemptedAndFailed) {
        setTransactionState((state) => ({
          ...state,
          activeTransactionHashList: [
            ...state.activeTransactionHashList.filter((t) => t.kind !== "wrap"),
            {
              kind: "wrap",
            },
          ],
        }));
        const depositResponse = await writeGovSocietyDepositFor({
          address: govSocietyFromNetwork(chainId),
          args: [address, toWrapSelectedTokenIds],
        });
        setTransactionState((state) => ({
          ...state,
          activeTransactionHashList: [
            ...state.activeTransactionHashList.filter((t) => t.kind !== "wrap"),
            {
              kind: "wrap",
              hash: depositResponse,
              context: toWrapSelectedTokenIds,
            },
          ],
        }));
      }
    } catch (error) {
      if (error instanceof BaseError) {
        setTransactionState((state) => ({
          ...state,
          transactionModelOpen: false,
        }));
        addNotification({
          message: error.metaMessages?.length ? (
            error.metaMessages.map(m => <p key={m}>{m}</p>)
          ) : error.message,
          type: "error",
          id: "wrap-error",
          autoHideMs: 5000,
        });
      }
    } finally {
      setTransactionState((state) => {
        if (state.activeTransactionHashList.length !== 0) {
          return state;
        }
        return {
          ...state,
          transactionModelOpen: false,
        };
      });
    }
  }, [address, isApprovedForAll, writeGovSocietyDepositFor, chainId, toWrapSelectedTokenIds, writeFameMirrorSetApprovalForAll, addNotification]);

  const closeTransactionModal = useCallback(() => {
    setTransactionState((state) => ({
      ...state,
      transactionModelOpen: false,
    }));
  }, [setTransactionState]);
  const onTransactionConfirmed = useCallback((tx: Transaction<unknown>) => {
    switch (tx.kind) {
      case "wrap": {
        setTransactionState((state) => ({
          ...state,
          completedTransactionHashList: [
            ...state.completedTransactionHashList,
            {
              kind: "wrapped tokens",
              hash: tx.hash!,
            },
          ],
        }));
        break;
      }
    }
    setTransactionState((state) => ({
      ...state,
      activeTransactionHashList: state.activeTransactionHashList.filter(
        (t) => tx.hash !== t.hash,
      ),
    }));
  }, []);
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
      </div >
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
