"use client";
import { useReducer, useCallback } from "react";
import { BaseError } from "viem";
import { WriteContractData } from "wagmi/query";
import { Transaction } from "@/components/TransactionsModal";
import { useNotifications } from "@/features/notifications/Context";
import {
  useWriteCreatorArtistMagicBanishToArtPool,
  useWriteCreatorArtistMagicBanishToBurnPool,
  useWriteCreatorArtistMagicBanishToMintPool,
  useWriteCreatorArtistMagicBanishToEndOfMintPool,
  useWriteCreatorArtistMagicUpdateMetadata,
} from "@/wagmi";
import { creatorArtistMagicAddress } from "@/features/fame/contract";
import { sepolia, type base } from "viem/chains";
import { useAccount } from "@/hooks/useAccount";
import { useWaitForTransactionReceipt } from "wagmi";
import { useFameusWrap } from "./context";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";

// -------------------------------
// State & Actions
// -------------------------------
type TransactionKind =
  | "banishToArtPool"
  | "banishToMintPool"
  | "banishToBurnPool"
  | "banishToEndOfMintPool"
  | "updateMetadata"
  | string;

interface ActiveTransaction {
  kind: TransactionKind;
  hash?: WriteContractData;
  context?: {
    tokenIdToUpdate: bigint;
    newMetadataUrl?: string;
    tokenIdFromPool?: bigint;
  };
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
        context?: {
          tokenIdToUpdate: bigint;
          newMetadataUrl?: string;
          tokenIdFromPool?: bigint;
        };
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
        transactionModelOpen: state.activeTransactionHashList.length > 1,
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
export function useSwapMetadata(chainId: typeof base.id) {
  const [transactionState, dispatch] = useReducer(
    transactionReducer,
    initialTransactionState,
  );
  const { address } = useAccount();
  const { addNotification } = useNotifications();

  // Contract calls
  const { writeContractAsync: writeBanishToArtPool } =
    useWriteCreatorArtistMagicBanishToArtPool();
  const { writeContractAsync: writeBanishToMintPool } =
    useWriteCreatorArtistMagicBanishToMintPool();
  const { writeContractAsync: writeBanishToBurnPool } =
    useWriteCreatorArtistMagicBanishToBurnPool();
  const { writeContractAsync: writeBanishToEndOfMintPool } =
    useWriteCreatorArtistMagicBanishToEndOfMintPool();
  const { writeContractAsync: writeUpdateMetadata } =
    useWriteCreatorArtistMagicUpdateMetadata();

  // Transaction watchers
  const { isSuccess: isSuccess0, isError: isError0 } =
    useWaitForTransactionReceipt({
      hash: transactionState.activeTransactionHashList[0]?.hash,
    });
  const { isSuccess: isSuccess1, isError: isError1 } =
    useWaitForTransactionReceipt({
      hash: transactionState.activeTransactionHashList[1]?.hash,
    });

  // -----------------------------------------
  // Effects for success/failure notifications
  // -----------------------------------------
  function noticeSuccess(
    kind: TransactionKind,
    hash: WriteContractData,
    context?: {
      tokenIdToUpdate: bigint;
      newMetadataUrl?: string;
      tokenIdFromPool?: bigint;
    },
  ) {
    const actionName = kind.replace(/([A-Z])/g, " $1").toLowerCase();
    addNotification({
      message: `${actionName.charAt(0).toUpperCase() + actionName.slice(1)} successful`,
      type: "success",
      id: `${kind}-success`,
      autoHideMs: 5000,
    });

    dispatch({
      type: "COMPLETE_TX",
      payload: { kind: `metadata ${actionName}`, hash },
    });
  }

  if (isSuccess0 && transactionState.activeTransactionHashList[0]?.hash) {
    const kind = transactionState.activeTransactionHashList[0]?.kind;
    noticeSuccess(
      kind,
      transactionState.activeTransactionHashList[0]?.hash,
      transactionState.activeTransactionHashList[0]?.context,
    );
  }
  if (isSuccess1 && transactionState.activeTransactionHashList[1]?.hash) {
    const kind = transactionState.activeTransactionHashList[1]?.kind;
    noticeSuccess(
      kind,
      transactionState.activeTransactionHashList[1]?.hash,
      transactionState.activeTransactionHashList[1]?.context,
    );
  }

  if (isSuccess0 || isError0) {
    dispatch({
      type: "REMOVE_ACTIVE_TX",
      payload: { hash: transactionState.activeTransactionHashList[0]?.hash },
    });
  }
  if (isSuccess1 || isError1) {
    dispatch({
      type: "REMOVE_ACTIVE_TX",
      payload: { hash: transactionState.activeTransactionHashList[1]?.hash },
    });
  }

  // -----------------------------------------
  // Banish to Art Pool
  // -----------------------------------------
  const banishToArtPool = useCallback(
    async (tokenIdToUpdate: bigint, newMetadataUrl: string) => {
      if (!address) return;
      try {
        dispatch({ type: "OPEN_MODAL" });
        dispatch({
          type: "ADD_ACTIVE_TX",
          payload: { kind: "banishToArtPool" },
        });

        const response = await writeBanishToArtPool({
          address: creatorArtistMagicAddress(chainId),
          args: [tokenIdToUpdate, newMetadataUrl],
        });

        dispatch({
          type: "SET_ACTIVE_TX_HASH",
          payload: {
            kind: "banishToArtPool",
            hash: response,
            context: { tokenIdToUpdate, newMetadataUrl },
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
            id: "banish-to-art-pool-error",
            autoHideMs: 5000,
          });
        }
      } finally {
        if (!transactionState.activeTransactionHashList.length) {
          dispatch({ type: "CLOSE_MODAL" });
        }
      }
    },
    [
      address,
      writeBanishToArtPool,
      chainId,
      addNotification,
      transactionState.activeTransactionHashList.length,
    ],
  );

  // -----------------------------------------
  // Banish to Mint Pool
  // -----------------------------------------
  const banishToMintPool = useCallback(
    async (tokenIdToUpdate: bigint, tokenIdFromMintPool: bigint) => {
      if (!address) return;
      try {
        dispatch({ type: "OPEN_MODAL" });
        dispatch({
          type: "ADD_ACTIVE_TX",
          payload: { kind: "banishToMintPool" },
        });

        const response = await writeBanishToMintPool({
          address: creatorArtistMagicAddress(chainId),
          args: [tokenIdToUpdate, tokenIdFromMintPool],
        });

        dispatch({
          type: "SET_ACTIVE_TX_HASH",
          payload: {
            kind: "banishToMintPool",
            hash: response,
            context: { tokenIdToUpdate, tokenIdFromPool: tokenIdFromMintPool },
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
            id: "banish-to-mint-pool-error",
            autoHideMs: 5000,
          });
        }
      } finally {
        if (!transactionState.activeTransactionHashList.length) {
          dispatch({ type: "CLOSE_MODAL" });
        }
      }
    },
    [
      address,
      writeBanishToMintPool,
      chainId,
      addNotification,
      transactionState.activeTransactionHashList.length,
    ],
  );

  // -----------------------------------------
  // Banish to Burn Pool
  // -----------------------------------------
  const banishToBurnPool = useCallback(
    async (tokenIdToUpdate: bigint, tokenIdFromBurnPool: bigint) => {
      if (!address) return;
      try {
        dispatch({ type: "OPEN_MODAL" });
        dispatch({
          type: "ADD_ACTIVE_TX",
          payload: { kind: "banishToBurnPool" },
        });

        const response = await writeBanishToBurnPool({
          address: creatorArtistMagicAddress(chainId),
          args: [tokenIdToUpdate, tokenIdFromBurnPool],
        });

        dispatch({
          type: "SET_ACTIVE_TX_HASH",
          payload: {
            kind: "banishToBurnPool",
            hash: response,
            context: { tokenIdToUpdate, tokenIdFromPool: tokenIdFromBurnPool },
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
            id: "banish-to-burn-pool-error",
            autoHideMs: 5000,
          });
        }
      } finally {
        if (!transactionState.activeTransactionHashList.length) {
          dispatch({ type: "CLOSE_MODAL" });
        }
      }
    },
    [
      address,
      writeBanishToBurnPool,
      chainId,
      addNotification,
      transactionState.activeTransactionHashList.length,
    ],
  );

  // -----------------------------------------
  // Handlers for the TransactionsModal
  // -----------------------------------------
  const closeTransactionModal = useCallback(() => {
    dispatch({ type: "CLOSE_MODAL" });
  }, []);

  const onTransactionConfirmed = useCallback((tx: Transaction<unknown>) => {
    dispatch({ type: "REMOVE_ACTIVE_TX", payload: { hash: tx.hash } });
  }, []);

  // -----------------------------------------
  // Banish to End of Mint Pool
  // -----------------------------------------
  const banishToEndOfMintPool = useCallback(
    async (tokenIdToUpdate: bigint, newMetadataUrl: string) => {
      if (!address) return;
      try {
        dispatch({ type: "OPEN_MODAL" });
        dispatch({
          type: "ADD_ACTIVE_TX",
          payload: { kind: "banishToEndOfMintPool" },
        });

        const response = await writeBanishToEndOfMintPool({
          address: creatorArtistMagicAddress(chainId),
          args: [tokenIdToUpdate, newMetadataUrl],
        });

        dispatch({
          type: "SET_ACTIVE_TX_HASH",
          payload: {
            kind: "banishToEndOfMintPool",
            hash: response,
            context: { tokenIdToUpdate, newMetadataUrl },
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
            id: "banish-to-end-of-mint-pool-error",
            autoHideMs: 5000,
          });
        }
      } finally {
        if (!transactionState.activeTransactionHashList.length) {
          dispatch({ type: "CLOSE_MODAL" });
        }
      }
    },
    [
      address,
      writeBanishToEndOfMintPool,
      chainId,
      addNotification,
      transactionState.activeTransactionHashList.length,
    ],
  );

  // -----------------------------------------
  // Update metadata (no pool consumption)
  // -----------------------------------------
  const updateMetadata = useCallback(
    async (tokenIdToUpdate: bigint, newMetadataUrl: string) => {
      if (!address) return;
      try {
        dispatch({ type: "OPEN_MODAL" });
        dispatch({
          type: "ADD_ACTIVE_TX",
          payload: { kind: "updateMetadata" },
        });

        const response = await writeUpdateMetadata({
          address: creatorArtistMagicAddress(chainId),
          args: [tokenIdToUpdate, newMetadataUrl],
        });

        dispatch({
          type: "SET_ACTIVE_TX_HASH",
          payload: {
            kind: "updateMetadata",
            hash: response,
            context: { tokenIdToUpdate, newMetadataUrl },
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
            id: "update-metadata-error",
            autoHideMs: 5000,
          });
        }
      } finally {
        if (!transactionState.activeTransactionHashList.length) {
          dispatch({ type: "CLOSE_MODAL" });
        }
      }
    },
    [
      address,
      writeUpdateMetadata,
      chainId,
      addNotification,
      transactionState.activeTransactionHashList.length,
    ],
  );

  return {
    transactionState,
    banishToArtPool,
    banishToMintPool,
    banishToBurnPool,
    banishToEndOfMintPool,
    updateMetadata,
    closeTransactionModal,
    onTransactionConfirmed,
  };
}
