"use client";
import { useReducer, useCallback, useEffect } from "react";
import { WriteContractData } from "wagmi/query";
import { Transaction } from "@/components/TransactionsModal";
import { useNotifications } from "@/features/notifications/Context";
import { useWriteGovSocietyWithdrawTo } from "@/wagmi";
import { govSocietyFromNetwork } from "@/features/fame/contract";
import { sepolia, type base } from "viem/chains";
import { useWaitForTransactionReceipt } from "wagmi";
import { useAccount } from "@/hooks/useAccount";
import { useFameusUnwrap } from "./context";
import { revalidate } from "../actions";
import { getContractWriteErrorMessage } from "@/lib/getContractWriteErrorMessage";

// -------------------------------
// State & Actions
// -------------------------------
type TransactionKind = "unwrap" | string;

interface ActiveTransaction {
  kind: TransactionKind;
  hash?: WriteContractData;
  context?: bigint[];
}

interface CompletedTransaction {
  kind: string;
  hash: WriteContractData;
}

interface TransactionState {
  transactionModelOpen: boolean;
  activeTransactionHashList: ActiveTransaction[];
  completedTransactionHashList: CompletedTransaction[];
}

type TransactionAction =
  | { type: "OPEN_MODAL" }
  | { type: "CLOSE_MODAL" }
  | { type: "ADD_ACTIVE_TX"; payload: { kind: TransactionKind } }
  | {
      type: "SET_ACTIVE_TX_HASH";
      payload: {
        kind: TransactionKind;
        hash: WriteContractData;
        context?: bigint[];
      };
    }
  | {
      type: "REMOVE_ACTIVE_TX";
      payload: { hash: WriteContractData | undefined };
    }
  | { type: "COMPLETE_TX"; payload: { kind: string; hash: WriteContractData } };

// -------------------------------
// Reducer
// -------------------------------
const transactionReducer = (
  state: TransactionState,
  action: TransactionAction,
): TransactionState => {
  switch (action.type) {
    case "OPEN_MODAL":
      return { ...state, transactionModelOpen: true };
    case "CLOSE_MODAL":
      return { ...state, transactionModelOpen: false };
    case "ADD_ACTIVE_TX":
      return {
        ...state,
        transactionModelOpen: true,
        activeTransactionHashList: [
          ...state.activeTransactionHashList.filter(
            (t) => t.kind !== action.payload.kind,
          ),
          { kind: action.payload.kind },
        ],
      };
    case "SET_ACTIVE_TX_HASH":
      return {
        ...state,
        transactionModelOpen: true,
        activeTransactionHashList: [
          ...state.activeTransactionHashList.filter(
            (t) => t.kind !== action.payload.kind,
          ),
          {
            kind: action.payload.kind,
            hash: action.payload.hash,
            context: action.payload.context,
          },
        ],
      };
    case "REMOVE_ACTIVE_TX":
      return {
        ...state,
        activeTransactionHashList: state.activeTransactionHashList.filter(
          (t) => t.hash !== action.payload.hash,
        ),
        transactionModelOpen: state.activeTransactionHashList.length > 1, // If we remove the last item, close modal
      };
    case "COMPLETE_TX":
      return {
        ...state,
        completedTransactionHashList: [
          ...state.completedTransactionHashList,
          { kind: action.payload.kind, hash: action.payload.hash },
        ],
      };
    default:
      return state;
  }
};

const initialTransactionState: TransactionState = {
  transactionModelOpen: false,
  activeTransactionHashList: [],
  completedTransactionHashList: [],
};

// -------------------------------
// Hook
// -------------------------------
export function useUnwrap(
  chainId: typeof sepolia.id | typeof base.id,
  toWrapSelectedTokenIds: bigint[],
) {
  const {
    addToPendingTokenIds,
    addToCompletedTokenIds,
    resetUnwrapSelectedTokenIds,
    removeFromPendingTokenIds,
  } = useFameusUnwrap();
  const [transactionState, dispatch] = useReducer(
    transactionReducer,
    initialTransactionState,
  );
  const { address } = useAccount();
  const { addNotification } = useNotifications();

  // Contract calls
  const { writeContractAsync: writeGovSocietyWithdrawTo } =
    useWriteGovSocietyWithdrawTo();
  const activeTransaction = transactionState.activeTransactionHashList[0];

  // Transaction watchers
  const { isSuccess: isSuccess0, isError: isError0 } =
    useWaitForTransactionReceipt({
      hash: activeTransaction?.hash,
    });

  // -----------------------------------------
  // Effects for success/failure notifications
  // -----------------------------------------
  useEffect(() => {
    if (!isSuccess0 || !activeTransaction?.hash) {
      return;
    }

    addNotification({
      message: "Unwrap successful",
      type: "success",
      id: "unwrap-success",
      autoHideMs: 5000,
    });

    if (activeTransaction.context?.length) {
      removeFromPendingTokenIds(...activeTransaction.context);
      addToCompletedTokenIds(...activeTransaction.context);
    }

    if (address) {
      revalidate(chainId === sepolia.id ? "sepolia" : "base", address);
    }

    dispatch({
      type: "COMPLETE_TX",
      payload: {
        kind: "unwrapped tokens",
        hash: activeTransaction.hash,
      },
    });
  }, [
    activeTransaction,
    addNotification,
    addToCompletedTokenIds,
    address,
    chainId,
    isSuccess0,
    removeFromPendingTokenIds,
  ]);

  useEffect(() => {
    if (!activeTransaction?.hash || (!isSuccess0 && !isError0)) {
      return;
    }

    if (isError0 && activeTransaction.context?.length) {
      removeFromPendingTokenIds(...activeTransaction.context);
    }

    dispatch({
      type: "REMOVE_ACTIVE_TX",
      payload: { hash: activeTransaction.hash },
    });
  }, [activeTransaction, isError0, isSuccess0, removeFromPendingTokenIds]);

  // -----------------------------------------
  // Main unwrap call
  // -----------------------------------------
  const unwrap = useCallback(async () => {
    if (!address) return;

    const selectedTokenIds = [...toWrapSelectedTokenIds];
    if (selectedTokenIds.length === 0) return;

    try {
      dispatch({ type: "OPEN_MODAL" });
      dispatch({ type: "ADD_ACTIVE_TX", payload: { kind: "unwrap" } });

      const withdrawResponse = await writeGovSocietyWithdrawTo({
        address: govSocietyFromNetwork(chainId),
        args: [address, selectedTokenIds],
      });

      addToPendingTokenIds(...selectedTokenIds);
      resetUnwrapSelectedTokenIds();

      dispatch({
        type: "SET_ACTIVE_TX_HASH",
        payload: {
          kind: "unwrap",
          hash: withdrawResponse,
          context: selectedTokenIds,
        },
      });
    } catch (error) {
      dispatch({ type: "CLOSE_MODAL" });
      addNotification({
        message: getContractWriteErrorMessage(error),
        type: "error",
        id: "unwrap-error",
        autoHideMs: 5000,
      });
    }
  }, [
    address,
    addToPendingTokenIds,
    toWrapSelectedTokenIds,
    writeGovSocietyWithdrawTo,
    chainId,
    resetUnwrapSelectedTokenIds,
    addNotification,
  ]);

  // -----------------------------------------
  // Handlers for the TransactionsModal
  // -----------------------------------------
  const closeTransactionModal = useCallback(() => {
    dispatch({ type: "CLOSE_MODAL" });
  }, []);

  const onTransactionConfirmed = useCallback((tx: Transaction<unknown>) => {
    dispatch({ type: "REMOVE_ACTIVE_TX", payload: { hash: tx.hash } });
  }, []);

  return {
    transactionState,
    unwrap,
    closeTransactionModal,
    onTransactionConfirmed,
    isApprovedForAll: true,
  };
}
