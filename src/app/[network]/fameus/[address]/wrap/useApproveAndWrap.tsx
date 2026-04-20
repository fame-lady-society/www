"use client";
import { useReducer, useCallback, useEffect } from "react";
import { WriteContractData } from "wagmi/query";
import { Transaction } from "@/components/TransactionsModal";
import { useNotifications } from "@/features/notifications/Context";
import {
  useReadFameMirrorIsApprovedForAll,
  useWriteFameMirrorSetApprovalForAll,
  useWriteGovSocietyDepositFor,
} from "@/wagmi";
import {
  societyFromNetwork,
  govSocietyFromNetwork,
} from "@/features/fame/contract";
import { sepolia, type base } from "viem/chains";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";
import { useFameusWrap } from "./context";
import { revalidate } from "../actions";
import { getContractWriteErrorMessage } from "@/lib/getContractWriteErrorMessage";

// -------------------------------
// State & Actions
// -------------------------------
type TransactionKind = "approval" | "wrap" | string;

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
export function useApproveAndWrap(
  chainId: typeof sepolia.id | typeof base.id,
  toWrapSelectedTokenIds: bigint[],
) {
  const {
    resetWrapSelectedTokenIds,
    addToPendingWrapTokenIds,
    removeFromPendingWrapTokenIds,
    addToCompletedWrapTokenIds,
  } = useFameusWrap();

  const [transactionState, dispatch] = useReducer(
    transactionReducer,
    initialTransactionState,
  );
  const { address } = useAccount();
  const { addNotification } = useNotifications();

  // Contract calls
  const { data: isApprovedForAll } = useReadFameMirrorIsApprovedForAll({
    address: societyFromNetwork(chainId),
    args: address ? [address, govSocietyFromNetwork(chainId)] : undefined,
  });
  const { writeContractAsync: writeFameMirrorSetApprovalForAll } =
    useWriteFameMirrorSetApprovalForAll();
  const { writeContractAsync: writeGovSocietyDepositFor } =
    useWriteGovSocietyDepositFor();
  const activeTransaction0 = transactionState.activeTransactionHashList[0];
  const activeTransaction1 = transactionState.activeTransactionHashList[1];

  // Transaction watchers
  const { isSuccess: isSuccess0, isError: isError0 } =
    useWaitForTransactionReceipt({
      hash: activeTransaction0?.hash,
    });
  const { isSuccess: isSuccess1, isError: isError1 } =
    useWaitForTransactionReceipt({
      hash: activeTransaction1?.hash,
    });

  // -----------------------------------------
  // Effects for success/failure notifications
  // -----------------------------------------
  const noticeSuccess = useCallback(
    (transaction?: ActiveTransaction) => {
      if (!transaction?.hash) {
        return;
      }

      addNotification({
        message: `${transaction.kind.charAt(0).toUpperCase() + transaction.kind.slice(1)} successful`,
        type: "success",
        id: `${transaction.kind}-success`,
        autoHideMs: 5000,
      });

      if (transaction.kind === "wrap" && transaction.context?.length) {
        removeFromPendingWrapTokenIds(...transaction.context);
        addToCompletedWrapTokenIds(...transaction.context);
        if (address) {
          revalidate(chainId === sepolia.id ? "sepolia" : "base", address);
        }
        dispatch({
          type: "COMPLETE_TX",
          payload: { kind: "wrapped tokens", hash: transaction.hash },
        });
      }
    },
    [
      addNotification,
      addToCompletedWrapTokenIds,
      address,
      chainId,
      removeFromPendingWrapTokenIds,
    ],
  );

  useEffect(() => {
    if (!isSuccess0) {
      return;
    }

    noticeSuccess(activeTransaction0);
  }, [activeTransaction0, isSuccess0, noticeSuccess]);

  useEffect(() => {
    if (!isSuccess1) {
      return;
    }

    noticeSuccess(activeTransaction1);
  }, [activeTransaction1, isSuccess1, noticeSuccess]);

  useEffect(() => {
    if (!activeTransaction0?.hash || (!isSuccess0 && !isError0)) {
      return;
    }

    if (isError0 && activeTransaction0.kind === "wrap" && activeTransaction0.context?.length) {
      removeFromPendingWrapTokenIds(...activeTransaction0.context);
    }

    dispatch({
      type: "REMOVE_ACTIVE_TX",
      payload: { hash: activeTransaction0.hash },
    });
  }, [
    activeTransaction0,
    isError0,
    isSuccess0,
    removeFromPendingWrapTokenIds,
  ]);

  useEffect(() => {
    if (!activeTransaction1?.hash || (!isSuccess1 && !isError1)) {
      return;
    }

    if (isError1 && activeTransaction1.kind === "wrap" && activeTransaction1.context?.length) {
      removeFromPendingWrapTokenIds(...activeTransaction1.context);
    }

    dispatch({
      type: "REMOVE_ACTIVE_TX",
      payload: { hash: activeTransaction1.hash },
    });
  }, [
    activeTransaction1,
    isError1,
    isSuccess1,
    removeFromPendingWrapTokenIds,
  ]);

  // -----------------------------------------
  // Main wrap call
  // -----------------------------------------
  const wrap = useCallback(async () => {
    if (!address) return;

    const selectedTokenIds = [...toWrapSelectedTokenIds];

    try {
      dispatch({ type: "OPEN_MODAL" });

      let approvalWasAttemptedAndFailed = false;

      // Attempt approval if needed
      if (!isApprovedForAll) {
        dispatch({ type: "ADD_ACTIVE_TX", payload: { kind: "approval" } });
        try {
          const approvalResponse = await writeFameMirrorSetApprovalForAll({
            address: societyFromNetwork(chainId),
            args: [govSocietyFromNetwork(chainId), true],
          });
          dispatch({
            type: "SET_ACTIVE_TX_HASH",
            payload: { kind: "approval", hash: approvalResponse },
          });
        } catch (error) {
          approvalWasAttemptedAndFailed = true;
          addNotification({
            message: getContractWriteErrorMessage(error),
            type: "error",
            id: "approval-error",
            autoHideMs: 5000,
          });
          dispatch({ type: "CLOSE_MODAL" });
        }
      }

      // Wrap
      if (!approvalWasAttemptedAndFailed && selectedTokenIds.length !== 0) {
        dispatch({ type: "ADD_ACTIVE_TX", payload: { kind: "wrap" } });
        const depositResponse = await writeGovSocietyDepositFor({
          address: govSocietyFromNetwork(chainId),
          args: [address, selectedTokenIds],
        });
        addToPendingWrapTokenIds(...selectedTokenIds);
        dispatch({
          type: "SET_ACTIVE_TX_HASH",
          payload: {
            kind: "wrap",
            hash: depositResponse,
            context: selectedTokenIds,
          },
        });
        resetWrapSelectedTokenIds();
      }
    } catch (error) {
      dispatch({ type: "CLOSE_MODAL" });
      addNotification({
        message: getContractWriteErrorMessage(error),
        type: "error",
        id: "wrap-error",
        autoHideMs: 5000,
      });
    }
  }, [
    address,
    isApprovedForAll,
    toWrapSelectedTokenIds,
    writeFameMirrorSetApprovalForAll,
    chainId,
    addNotification,
    addToPendingWrapTokenIds,
    writeGovSocietyDepositFor,
    resetWrapSelectedTokenIds,
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
    wrap,
    closeTransactionModal,
    onTransactionConfirmed,
    isApprovedForAll,
  };
}
