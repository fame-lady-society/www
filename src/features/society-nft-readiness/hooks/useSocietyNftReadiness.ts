"use client";

import { useAccount } from "@/hooks/useAccount";
import { needsConnectedChainSwitch } from "@/utils/connectedChain";
import {
  useReadFameBalanceOf,
  useReadFameGetSkipNft,
  useReadFameUnit,
  useWriteFameSetSkipNft,
} from "@/wagmi";
import { fameFromNetwork, societyFromNetwork } from "@/features/fame/contract";
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import {
  erc721Abi,
  isAddressEqual,
  zeroAddress,
  type Address,
  type Hash,
} from "viem";
import { base } from "viem/chains";
import {
  useBytecode,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
} from "wagmi";
import {
  bytecodeQueryReadState,
  contractQueryReadState,
  hasNonEmptyRuntimeCode,
  projectSocietyNftReadiness,
  projectVerifiedRepair,
  skipNftForGenerationEnabled,
  type RepairReceiptStatus,
  type SocietyNftReadinessProjection,
  type VerifiedRepairProjection,
} from "../state";
import {
  initialReadinessTransactionState,
  readinessTransactionError,
  readinessTransactionReducer,
  type ReadinessTransactionState,
} from "../transactionState";

const fameAddress = fameFromNetwork(base.id);
const societyAddress = societyFromNetwork(base.id);

export interface UseSocietyNftReadinessResult {
  account: Address | undefined;
  codeBearingWallet: boolean;
  generationEnabled: boolean | null;
  generationRefreshing: boolean;
  readiness: SocietyNftReadinessProjection;
  transactionState: ReadinessTransactionState;
  verifiedRepair: VerifiedRepairProjection;
  repair: () => Promise<Hash | null>;
  setGenerationEnabled: (enabled: boolean) => Promise<Hash | null>;
  retryDetection: () => Promise<void>;
  retryVerification: () => Promise<void>;
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
  const [initiatingSkipNft, setInitiatingSkipNft] = useState<boolean | null>(
    null,
  );
  const detectionEnabled = isConnected && address !== undefined;

  const bytecode = useBytecode({
    address,
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
  const skipDetectionEnabled =
    codeRead.status === "success" && hasNonEmptyRuntimeCode(codeRead.data);
  const skipNft = useReadFameGetSkipNft({
    address: fameAddress,
    args: [address ?? zeroAddress],
    chainId: base.id,
    query: { enabled: skipDetectionEnabled },
  });
  const skipNftRead = useMemo(
    () =>
      contractQueryReadState(detectionEnabled, {
        data: skipNft.data,
        isError: skipNft.isError,
        isSuccess: skipNft.isSuccess,
      }),
    [detectionEnabled, skipNft.data, skipNft.isError, skipNft.isSuccess],
  );
  const codeBearingWallet = skipDetectionEnabled;
  const generationEnabled =
    skipNftRead.status === "success" ? !skipNftRead.data : null;
  const generationRefreshing =
    transactionState.status === "confirmed" &&
    initiatingSkipNft !== null &&
    (skipNftRead.status !== "success" ||
      skipNftRead.data !== initiatingSkipNft);
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
    initiatingSkipNft !== null &&
    receiptStatus === "success" &&
    receiptBlockNumber !== undefined;
  const repairVerificationEnabled =
    verificationEnabled && initiatingSkipNft === false;
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
    query: { enabled: repairVerificationEnabled },
  });
  const verifiedUnit = useReadFameUnit({
    address: fameAddress,
    blockNumber: receiptBlockNumber,
    chainId: base.id,
    query: { enabled: repairVerificationEnabled },
  });
  const verifiedNftBalance = useReadContract({
    abi: erc721Abi,
    address: societyAddress,
    args: [verificationAccount],
    blockNumber: receiptBlockNumber,
    chainId: base.id,
    functionName: "balanceOf",
    query: { enabled: repairVerificationEnabled },
  });
  const verificationFetching =
    verifiedSkipNft.isFetching ||
    (initiatingSkipNft === false &&
      (verifiedBalance.isFetching ||
        verifiedUnit.isFetching ||
        verifiedNftBalance.isFetching));
  const refetchDetectionSkipNft = skipNft.refetch;

  const verifiedSkipNftRead = useMemo(
    () =>
      contractQueryReadState(detectionEnabled, {
        data: verifiedSkipNft.data,
        isError: verifiedSkipNft.isError,
        isSuccess: verifiedSkipNft.isSuccess,
      }),
    [
      detectionEnabled,
      verifiedSkipNft.data,
      verifiedSkipNft.isError,
      verifiedSkipNft.isSuccess,
    ],
  );
  const verifiedBalanceRead = useMemo(
    () =>
      contractQueryReadState(detectionEnabled, {
        data: verifiedBalance.data,
        isError: verifiedBalance.isError,
        isSuccess: verifiedBalance.isSuccess,
      }),
    [
      detectionEnabled,
      verifiedBalance.data,
      verifiedBalance.isError,
      verifiedBalance.isSuccess,
    ],
  );
  const verifiedUnitRead = useMemo(
    () =>
      contractQueryReadState(detectionEnabled, {
        data: verifiedUnit.data,
        isError: verifiedUnit.isError,
        isSuccess: verifiedUnit.isSuccess,
      }),
    [
      detectionEnabled,
      verifiedUnit.data,
      verifiedUnit.isError,
      verifiedUnit.isSuccess,
    ],
  );
  const verifiedNftBalanceRead = useMemo(
    () =>
      contractQueryReadState(detectionEnabled, {
        data: verifiedNftBalance.data,
        isError: verifiedNftBalance.isError,
        isSuccess: verifiedNftBalance.isSuccess,
      }),
    [
      detectionEnabled,
      verifiedNftBalance.data,
      verifiedNftBalance.isError,
      verifiedNftBalance.isSuccess,
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
        nftBalance: verifiedNftBalanceRead,
      }),
    [
      address,
      initiatingAccount,
      isConnected,
      receiptStatus,
      verifiedBalanceRead,
      verifiedNftBalanceRead,
      verifiedSkipNftRead,
      verifiedUnitRead,
    ],
  );

  useEffect(() => {
    setInitiatingAccount(null);
    setInitiatingSkipNft(null);
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
    if (
      transactionState.status !== "verifying" ||
      verificationFetching ||
      initiatingSkipNft === null
    ) {
      return;
    }

    if (verifiedSkipNftRead.status === "error") {
      dispatch({
        type: "failed",
        error: readinessTransactionError("verification_failed"),
      });
      return;
    }

    if (verifiedSkipNftRead.status !== "success") return;

    if (verifiedSkipNftRead.data !== initiatingSkipNft) {
      dispatch({
        type: "failed",
        error: readinessTransactionError("verification_mismatch"),
      });
      return;
    }

    if (initiatingSkipNft) {
      dispatch({ type: "verification_confirmed" });
      void refetchDetectionSkipNft();
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
    initiatingSkipNft,
    transactionState.status,
    verificationFetching,
    verifiedSkipNftRead,
    verifiedRepair,
  ]);

  const setSkipNftValue = useCallback(
    async (skipNftValue: boolean): Promise<Hash | null> => {
      if (!isConnected || !address) return null;

      setInitiatingAccount(address);
      setInitiatingSkipNft(skipNftValue);

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
          args: [skipNftValue],
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
    },
    [
      address,
      connectedChainId,
      isConnected,
      switchChainAsync,
      writeContractAsync,
    ],
  );

  const repair = useCallback(() => setSkipNftValue(false), [setSkipNftValue]);
  const setGenerationEnabled = useCallback(
    (enabled: boolean) => setSkipNftValue(skipNftForGenerationEnabled(enabled)),
    [setSkipNftValue],
  );

  const retryDetection = useCallback(async () => {
    if (skipDetectionEnabled) {
      await Promise.all([bytecode.refetch(), skipNft.refetch()]);
      return;
    }

    await bytecode.refetch();
  }, [bytecode, skipDetectionEnabled, skipNft]);

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
  }, [address, initiatingAccount, receiptStatus]);

  return {
    account: address,
    codeBearingWallet,
    generationEnabled,
    generationRefreshing,
    readiness,
    transactionState,
    verifiedRepair,
    repair,
    setGenerationEnabled,
    retryDetection,
    retryVerification,
  };
}
