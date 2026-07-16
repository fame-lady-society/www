"use client";

import { useAccount } from "@/hooks/useAccount";
import { needsConnectedChainSwitch } from "@/utils/connectedChain";
import {
  useReadFameBalanceOf,
  useReadFameGetSkipNft,
  useReadFameUnit,
  useWriteFameSetSkipNft,
} from "@/wagmi";
import { fameFromNetwork } from "@/features/fame/contract";
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { isAddressEqual, zeroAddress, type Address, type Hash } from "viem";
import { base } from "viem/chains";
import {
  useBytecode,
  useSwitchChain,
  useWaitForTransactionReceipt,
} from "wagmi";
import {
  bytecodeQueryReadState,
  contractQueryReadState,
  projectSocietyNftReadiness,
  projectVerifiedRepair,
  type RepairReceiptStatus,
  type SocietyNftReadinessProjection,
  type VerifiedRepairProjection,
} from "../state";
import {
  initialReadinessTransactionState,
  isReadinessTransactionPending,
  readinessTransactionError,
  readinessTransactionReducer,
  readinessTransactionStatusCopy,
  type ReadinessTransactionState,
  type ReadinessTransactionStatusCopy,
} from "../transactionState";

const fameAddress = fameFromNetwork(base.id);

export interface UseSocietyNftReadinessResult {
  account: Address | undefined;
  readiness: SocietyNftReadinessProjection;
  transactionState: ReadinessTransactionState;
  transactionStatusCopy: ReadinessTransactionStatusCopy | null;
  isRepairPending: boolean;
  verifiedRepair: VerifiedRepairProjection;
  transactionHash: Hash | null;
  transactionUrl: string | null;
  repair: () => Promise<Hash | null>;
  retryDetection: () => Promise<void>;
  retryVerification: () => Promise<void>;
  resetRepair: () => void;
}

export function useSocietyNftReadiness(): UseSocietyNftReadinessResult {
  const { address, chainId: connectedChainId, isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteFameSetSkipNft();
  const [transactionState, dispatch] = useReducer(
    readinessTransactionReducer,
    initialReadinessTransactionState,
  );
  const [initiatingAccount, setInitiatingAccount] = useState<Address | null>(
    null,
  );
  const detectionEnabled = isConnected && address !== undefined;

  const bytecode = useBytecode({
    address,
    chainId: base.id,
    query: { enabled: detectionEnabled },
  });
  const skipNft = useReadFameGetSkipNft({
    address: fameAddress,
    args: [address ?? zeroAddress],
    chainId: base.id,
    query: { enabled: detectionEnabled },
  });

  const codeRead = useMemo(
    () =>
      bytecodeQueryReadState(detectionEnabled, {
        data: bytecode.data,
        isError: bytecode.isError,
        isSuccess: bytecode.isSuccess,
      }),
    [bytecode.data, bytecode.isError, bytecode.isSuccess, detectionEnabled],
  );
  const skipNftRead = useMemo(
    () =>
      contractQueryReadState(detectionEnabled, {
        data: skipNft.data,
        isError: skipNft.isError,
        isSuccess: skipNft.isSuccess,
      }),
    [detectionEnabled, skipNft.data, skipNft.isError, skipNft.isSuccess],
  );
  const readiness = useMemo(
    () => projectSocietyNftReadiness({ code: codeRead, skipNft: skipNftRead }),
    [codeRead, skipNftRead],
  );

  const receipt = useWaitForTransactionReceipt({
    hash: transactionState.hash ?? undefined,
    chainId: base.id,
    query: { enabled: transactionState.hash !== null },
  });
  const receiptStatus: RepairReceiptStatus = receipt.isError
    ? "error"
    : receipt.data?.status === "reverted"
      ? "reverted"
      : receipt.data?.status === "success"
        ? "success"
        : transactionState.hash
          ? "pending"
          : "idle";
  const receiptBlockNumber = receipt.data?.blockNumber;
  const verificationEnabled =
    transactionState.status === "verifying" &&
    initiatingAccount !== null &&
    receiptStatus === "success" &&
    receiptBlockNumber !== undefined;
  const verificationAccount = initiatingAccount ?? zeroAddress;

  const verifiedSkipNft = useReadFameGetSkipNft({
    address: fameAddress,
    args: [verificationAccount],
    blockNumber: receiptBlockNumber,
    chainId: base.id,
    query: { enabled: verificationEnabled },
  });
  const verifiedBalance = useReadFameBalanceOf({
    address: fameAddress,
    args: [verificationAccount],
    blockNumber: receiptBlockNumber,
    chainId: base.id,
    query: { enabled: verificationEnabled },
  });
  const verifiedUnit = useReadFameUnit({
    address: fameAddress,
    blockNumber: receiptBlockNumber,
    chainId: base.id,
    query: { enabled: verificationEnabled },
  });
  const verificationFetching =
    verifiedSkipNft.isFetching ||
    verifiedBalance.isFetching ||
    verifiedUnit.isFetching;
  const refetchDetectionSkipNft = skipNft.refetch;

  const connectedForVerification = isConnected && address !== undefined;
  const verifiedSkipNftRead = useMemo(
    () =>
      contractQueryReadState(connectedForVerification, {
        data: verifiedSkipNft.data,
        isError: verifiedSkipNft.isError,
        isSuccess: verifiedSkipNft.isSuccess,
      }),
    [
      connectedForVerification,
      verifiedSkipNft.data,
      verifiedSkipNft.isError,
      verifiedSkipNft.isSuccess,
    ],
  );
  const verifiedBalanceRead = useMemo(
    () =>
      contractQueryReadState(connectedForVerification, {
        data: verifiedBalance.data,
        isError: verifiedBalance.isError,
        isSuccess: verifiedBalance.isSuccess,
      }),
    [
      connectedForVerification,
      verifiedBalance.data,
      verifiedBalance.isError,
      verifiedBalance.isSuccess,
    ],
  );
  const verifiedUnitRead = useMemo(
    () =>
      contractQueryReadState(connectedForVerification, {
        data: verifiedUnit.data,
        isError: verifiedUnit.isError,
        isSuccess: verifiedUnit.isSuccess,
      }),
    [
      connectedForVerification,
      verifiedUnit.data,
      verifiedUnit.isError,
      verifiedUnit.isSuccess,
    ],
  );
  const verifiedRepair = useMemo(
    () =>
      projectVerifiedRepair({
        receiptStatus,
        initiatingAccount,
        connectedAccount: isConnected && address ? address : null,
        skipNft: verifiedSkipNftRead,
        balance: verifiedBalanceRead,
        unit: verifiedUnitRead,
      }),
    [
      address,
      initiatingAccount,
      isConnected,
      receiptStatus,
      verifiedBalanceRead,
      verifiedSkipNftRead,
      verifiedUnitRead,
    ],
  );

  useEffect(() => {
    setInitiatingAccount(null);
    dispatch({ type: "reset" });
  }, [address, isConnected]);

  useEffect(() => {
    if (
      transactionState.status !== "confirming" ||
      !initiatingAccount ||
      !address ||
      !isAddressEqual(initiatingAccount, address)
    ) {
      return;
    }

    if (receipt.isError) {
      dispatch({
        type: "failed",
        error: readinessTransactionError("receipt_failed"),
      });
      return;
    }

    if (receipt.data?.status === "reverted") {
      dispatch({
        type: "failed",
        error: readinessTransactionError("receipt_reverted"),
      });
      return;
    }

    if (receipt.data?.status === "success") {
      dispatch({ type: "receipt_confirmed" });
    }
  }, [
    address,
    initiatingAccount,
    receipt.data?.status,
    receipt.isError,
    transactionState.status,
  ]);

  useEffect(() => {
    if (transactionState.status !== "verifying" || verificationFetching) {
      return;
    }

    if (verifiedRepair.status === "verified") {
      dispatch({ type: "verification_confirmed" });
      void refetchDetectionSkipNft();
      return;
    }

    if (verifiedRepair.status === "error") {
      dispatch({
        type: "failed",
        error: readinessTransactionError("verification_failed"),
      });
      return;
    }

    if (verifiedRepair.reason === "skip_enabled") {
      dispatch({
        type: "failed",
        error: readinessTransactionError("verification_mismatch"),
      });
    }
  }, [
    refetchDetectionSkipNft,
    transactionState.status,
    verificationFetching,
    verifiedRepair,
  ]);

  const repair = useCallback(async (): Promise<Hash | null> => {
    if (!isConnected || !address) return null;

    setInitiatingAccount(address);

    if (
      needsConnectedChainSwitch({
        isConnected,
        connectedChainId,
        targetChainId: base.id,
      })
    ) {
      dispatch({ type: "switch_requested" });
      try {
        await switchChainAsync({ chainId: base.id });
      } catch {
        dispatch({
          type: "failed",
          error: readinessTransactionError("switch_failed"),
        });
        return null;
      }
    }

    dispatch({ type: "wallet_requested" });
    try {
      const hash = await writeContractAsync({
        account: address,
        address: fameAddress,
        args: [false],
        chainId: base.id,
      });
      dispatch({ type: "broadcast", hash });
      return hash;
    } catch {
      dispatch({
        type: "failed",
        error: readinessTransactionError("wallet_request_failed"),
      });
      return null;
    }
  }, [
    address,
    connectedChainId,
    isConnected,
    switchChainAsync,
    writeContractAsync,
  ]);

  const retryDetection = useCallback(async () => {
    await Promise.all([bytecode.refetch(), skipNft.refetch()]);
  }, [bytecode, skipNft]);

  const retryVerification = useCallback(async () => {
    if (
      receiptStatus !== "success" ||
      !initiatingAccount ||
      !address ||
      !isAddressEqual(initiatingAccount, address)
    ) {
      return;
    }

    dispatch({ type: "receipt_confirmed" });
    await Promise.all([
      verifiedSkipNft.refetch(),
      verifiedBalance.refetch(),
      verifiedUnit.refetch(),
    ]);
  }, [
    address,
    initiatingAccount,
    receiptStatus,
    verifiedBalance,
    verifiedSkipNft,
    verifiedUnit,
  ]);

  const resetRepair = useCallback(() => {
    setInitiatingAccount(null);
    dispatch({ type: "reset" });
  }, []);

  const transactionHash = transactionState.hash;
  return {
    account: address,
    readiness,
    transactionState,
    transactionStatusCopy: readinessTransactionStatusCopy(transactionState),
    isRepairPending: isReadinessTransactionPending(transactionState),
    verifiedRepair,
    transactionHash,
    transactionUrl: transactionHash
      ? `${base.blockExplorers.default.url}/tx/${transactionHash}`
      : null,
    repair,
    retryDetection,
    retryVerification,
    resetRepair,
  };
}
