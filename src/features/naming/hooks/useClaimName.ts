"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { sepolia, baseSepolia, mainnet } from "viem/chains";
import { keccak256, encodePacked, ContractFunctionRevertedError, ContractFunctionExecutionError, AbiEncodingLengthMismatchError } from "viem";
import { useWaitForTransactionReceipt } from "wagmi";
import {
  useWriteFlsNamingCommitName,
  useWriteFlsNamingClaimName,
  useSimulateFlsNamingClaimName,
} from "@/wagmi";
import { useAccount } from "@/hooks/useAccount";
import type { NetworkType } from "./useOwnedGateNftTokens";

export type ClaimStep = "idle" | "committing" | "waiting" | "claiming" | "complete" | "error";

function getChainId(network: NetworkType) {
  switch (network) {
    case "sepolia":
      return sepolia.id;
    case "mainnet":
      return mainnet.id;
    case "base-sepolia":
      return baseSepolia.id;
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
}

function generateSalt(): `0x${string}` {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  return `0x${Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}` as `0x${string}`;
}

function makeCommitment(
  name: string,
  salt: `0x${string}`,
  owner: `0x${string}`
): `0x${string}` {
  return keccak256(encodePacked(["string", "bytes32", "address"], [name, salt, owner]));
}

// Map contract revert errors to human-readable messages
function mapContractError(error: unknown) {
  if (error instanceof AbiEncodingLengthMismatchError) {
    return null;
  }
  if (error instanceof ContractFunctionRevertedError || error instanceof ContractFunctionExecutionError) {
    const errorString = error.shortMessage
    // Expected
    if (error.metaMessages?.includes("Error: CommitmentTooNew()")) {
      return null;
    }
    // Check for specific contract revert reasons
    if (errorString.includes("NameAlreadyTaken")) {
      return "This name is already taken. Please choose a different name.";
    }
    if (errorString.includes("InvalidCommitment")) {
      return "Invalid commitment. Please start the claim process again.";
    }
    if (errorString.includes("CommitmentExpired")) {
      return "Your commitment has expired. Please start the claim process again.";
    }
    if (errorString.includes("AddressAlreadyLinked")) {
      return "This address is already linked to another identity.";
    }
    if (errorString.includes("NoGateTokenOwned")) {
      return "You don't own the required gate NFT for this claim.";
    }
    if (errorString.includes("GateTokenAlreadyBound")) {
      return "This gate NFT is already bound to another identity.";
    }
    if (errorString.includes("AlreadyHasIdentity")) {
      return "You already have an identity. Each address can only have one identity.";
    }
    if (errorString.includes("User rejected the request.")) {
      return "Transaction was cancelled.";
    }
  }
  // Generic fallback
  return "Transaction failed. Please try again.";
}

export function useClaimName(network: NetworkType) {
  const chainId = getChainId(network);
  const { address } = useAccount();

  const [step, setStep] = useState<ClaimStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [salt, setSalt] = useState<`0x${string}` | null>(null);
  const [primaryTokenId, setPrimaryTokenId] = useState<bigint | null>(null);
  const [commitTimestamp, setCommitTimestamp] = useState<number | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const {
    data: simulateClaimData,
    isError: isSimulateClaimError,
    error: simulateClaimError,
    isLoading: isSimulating,
  } = useSimulateFlsNamingClaimName({
    chainId,
    args: salt && primaryTokenId !== null ? [name, salt, primaryTokenId] : undefined,
  })
  const errorMessage = isSimulateClaimError ? mapContractError(simulateClaimError) : null;
  useEffect(() => {
     setError(errorMessage);
  }, [errorMessage]);
  if (salt && primaryTokenId !== null) {
  console.log(simulateClaimError, simulateClaimData, errorMessage, isSimulating);
  }

  // Use refs to preserve claim data across re-renders (wagmi hooks can cause re-renders)
  const claimDataRef = useRef<{
    name: string;
    salt: `0x${string}` | null;
    primaryTokenId: bigint | null;
  }>({ name: "", salt: null, primaryTokenId: null });

  // Contract reads
  const { data: minCommitAge } = useReadFlsNamingMinCommitAge({ chainId });
  const { data: maxCommitAge } = useReadFlsNamingMaxCommitAge({ chainId });

  // Check if address already has an identity
  // const { data: existingTokenId } = useReadFlsNamingAddressToTokenId({
  //   chainId,
  //   args: address ? [address] : undefined,
  //   query: { enabled: !!address },
  // });

  // Contract writes
  const {
    writeContract: writeCommitName,
    data: commitTxHash,
    isPending: isCommitPending,
    error: commitError,
    reset: resetCommit,
  } = useWriteFlsNamingCommitName();

  const {
    writeContract: writeClaimName,
    data: claimTxHash,
    isPending: isClaimPending,
    error: claimError,
    reset: resetClaim,
  } = useWriteFlsNamingClaimName();

  // Transaction receipts
  const { isLoading: isCommitConfirming, isSuccess: isCommitConfirmed } =
    useWaitForTransactionReceipt({
      hash: commitTxHash,
    });

  const { isLoading: isClaimConfirming, isSuccess: isClaimConfirmed } =
    useWaitForTransactionReceipt({
      hash: claimTxHash,
    });

  // Handle commit errors (including user rejection)
  useEffect(() => {
    if (commitError && step === "committing") {
      const errorMsg = mapContractError(commitError);
      if (errorMsg === "Transaction was cancelled.") {
        // User cancelled - go back to idle
        setStep("idle");
        setError(null);
      } else {
        setError(errorMsg);
        setStep("error");
      }
      resetCommit();
    }
  }, [commitError, step, resetCommit]);

  // Handle claim errors (including user rejection)
  useEffect(() => {
    if (claimError && step === "claiming") {
      const errorMsg = mapContractError(claimError);
      if (errorMsg === "Transaction was cancelled.") {
        // User cancelled - go back to waiting state
        setStep("waiting");
        setError(null);
      } else {
        setError(errorMsg);
        setStep("error");
      }
      resetClaim();
    }
  }, [claimError, step, resetClaim]);

  // Countdown timer
  useEffect(() => {
    if (step !== "waiting" || !commitTimestamp || !minCommitAge) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor(Date.now() / 1000) - commitTimestamp;
      const remaining = Number(minCommitAge) - elapsed;
      setSecondsRemaining(Math.max(0, remaining));

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [step, commitTimestamp, minCommitAge]);

  // Handle commit confirmation
  useEffect(() => {
    if (isCommitConfirmed && step === "committing") {
      const timestamp = Math.floor(Date.now() / 1000);
      setCommitTimestamp(timestamp);
      setSecondsRemaining(Number(minCommitAge ?? 10n));
      setStep("waiting");
    }
  }, [isCommitConfirmed, step, minCommitAge]);

  // Handle claim confirmation
  useEffect(() => {
    if (isClaimConfirmed && step === "claiming") {
      setStep("complete");
    }
  }, [isClaimConfirmed, step]);

  const startCommit = useCallback(
    async (desiredName: string, tokenId: bigint) => {
      if (!address) {
        setError("Please connect your wallet");
        return;
      }

      try {
        setError(null);
        setStep("committing");
        setName(desiredName);
        setPrimaryTokenId(tokenId);

        const newSalt = generateSalt();
        setSalt(newSalt);

        // Store in ref as backup (state can be lost on re-renders from wagmi hooks)
        claimDataRef.current = {
          name: desiredName,
          salt: newSalt,
          primaryTokenId: tokenId,
        };

        const newCommitment = makeCommitment(desiredName, newSalt, address);

        writeCommitName({
          chainId,
          args: [newCommitment],
        });
      } catch (err) {
        setError(mapContractError(err));
        setStep("error");
      }
    },
    [address, chainId, writeCommitName]
  );

  const submitClaim = useCallback(async () => {
    // Use ref values as primary source (more stable than state during re-renders)
    const claimName = claimDataRef.current.name || name;
    const claimSalt = claimDataRef.current.salt || salt;
    const claimTokenId = claimDataRef.current.primaryTokenId ?? primaryTokenId;

    if (!claimSalt || claimTokenId === null || !claimName) {
      setError("Missing claim data. Please try the claim process again.");
      setStep("error");
      return;
    }

    try {
      setError(null);
      setStep("claiming");

      writeClaimName({
        chainId,
        args: [claimName, claimSalt, claimTokenId],
      });
    } catch (err) {
      setError(mapContractError(err));
      setStep("error");
    }
  }, [salt, primaryTokenId, name, chainId, writeClaimName]);

  const reset = useCallback(() => {
    setStep("idle");
    setError(null);
    setName("");
    setSalt(null);
    setPrimaryTokenId(null);
    setCommitTimestamp(null);
    setSecondsRemaining(0);
    claimDataRef.current = { name: "", salt: null, primaryTokenId: null };
    resetCommit();
    resetClaim();
  }, [resetCommit, resetClaim]);

  const canClaim = useMemo(() => {
    return step === "waiting" && secondsRemaining === 0 && !isSimulating;
  }, [step, secondsRemaining, isSimulating]);

  return {
    step,
    error,
    name,
    primaryTokenId,
    secondsRemaining,
    minCommitAge: minCommitAge ? Number(minCommitAge) : 10,
    maxCommitAge: maxCommitAge ? Number(maxCommitAge) : 86400,
    canClaim,
    isSimulating,
    isCommitPending: isCommitPending || isCommitConfirming,
    isClaimPending: isClaimPending || isClaimConfirming,
    startCommit,
    submitClaim,
    reset,
  };
}
