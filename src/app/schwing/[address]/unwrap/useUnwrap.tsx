"use client";
import { useReducer, useCallback, useEffect } from "react";
import { BaseError } from "viem";
import { WriteContractData } from "wagmi/query";
import { Transaction } from "@/components/TransactionsModal";
import { useNotifications } from "@/features/notifications/Context";
import { useWriteGovSocietyWithdrawTo } from "@/wagmi";
import { useWaitForTransactionReceipt } from "wagmi";
import { useAccount } from "@/hooks/useAccount";
import { useFameusUnwrap } from "./context";

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
export function useUnwrap(toWrapSelectedTokenIds: bigint[]) {
  const [transactionState, dispatch] = useReducer(
    transactionReducer,
    initialTransactionState,
  );
  const { address } = useAccount();
  const { addNotification } = useNotifications();

  // Contract calls
  const { writeContractAsync: writeGovSocietyWithdrawTo } =
    useWriteGovSocietyWithdrawTo();

  // Transaction watchers
  const { isSuccess: isSuccess0, isError: isError0 } =
    useWaitForTransactionReceipt({
      hash: transactionState.activeTransactionHashList[0]?.hash,
    });

  const { resetUnwrapSelectedTokenIds } = useFameusUnwrap();

  // -----------------------------------------
  // Effects for success/failure notifications
  // -----------------------------------------
  useEffect(() => {
    if (isSuccess0) {
      addNotification({
        message: "Unwrap successful",
        type: "success",
        id: "unwrap-success",
        autoHideMs: 5000,
      });
    }
  }, [isSuccess0, addNotification]);

  if (isSuccess0 || isError0) {
    dispatch({
      type: "REMOVE_ACTIVE_TX",
      payload: { hash: transactionState.activeTransactionHashList[0]?.hash },
    });
  }

  // -----------------------------------------
  // Main unwrap call
  // -----------------------------------------
  const unwrap = useCallback(async () => {
    if (!address) return;
    try {
      dispatch({ type: "OPEN_MODAL" });
      dispatch({ type: "ADD_ACTIVE_TX", payload: { kind: "unwrap" } });

      const withdrawResponse = await writeGovSocietyWithdrawTo({
        address: "0x1AA1702627f4491741944130f0fa975f90213851",
        args: [address, toWrapSelectedTokenIds],
      });

      resetUnwrapSelectedTokenIds();

      dispatch({
        type: "SET_ACTIVE_TX_HASH",
        payload: {
          kind: "unwrap",
          hash: withdrawResponse,
          context: toWrapSelectedTokenIds,
        },
      });
    } catch (error) {
      if (error instanceof BaseError) {
        dispatch({ type: "CLOSE_MODAL" });
        addNotification({
          message: error.metaMessages?.length
            ? error.metaMessages.map((m) => <p key={m}>{m}</p>)
            : error.message,
          type: "error",
          id: "unwrap-error",
          autoHideMs: 5000,
        });
      }
    } finally {
      // If no active transactions, close the modal
      if (!transactionState.activeTransactionHashList.length) {
        dispatch({ type: "CLOSE_MODAL" });
      }
    }
  }, [
    address,
    writeGovSocietyWithdrawTo,
    toWrapSelectedTokenIds,
    resetUnwrapSelectedTokenIds,
    addNotification,
    transactionState.activeTransactionHashList.length,
  ]);

  // -----------------------------------------
  // Handlers for the TransactionsModal
  // -----------------------------------------
  const closeTransactionModal = useCallback(() => {
    dispatch({ type: "CLOSE_MODAL" });
  }, []);

  const onTransactionConfirmed = useCallback((tx: Transaction<unknown>) => {
    if (tx.kind === "unwrap" && tx.hash) {
      dispatch({
        type: "COMPLETE_TX",
        payload: { kind: "unwrapped tokens", hash: tx.hash },
      });
    }
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
