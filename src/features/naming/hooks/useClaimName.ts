"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { sepolia, mainnet, baseSepolia } from "viem/chains";
import { keccak256, encodePacked } from "viem";
import { useWaitForTransactionReceipt } from "wagmi";
import {
  useReadFlsNamingMinCommitAge,
  useReadFlsNamingMaxCommitAge,
  useWriteFlsNamingCommitName,
  useWriteFlsNamingClaimName,
} from "@/wagmi";
import { useAccount } from "@/hooks/useAccount";
import type { NetworkType } from "./useOwnedGateNftTokens";

export type ClaimStep = "idle" | "committing" | "waiting" | "claiming" | "complete" | "error";

function getChainId(network: NetworkType): number {
  switch (network) {
    case "sepolia":
      return sepolia.id;
    case "mainnet":
      return mainnet.id;
    case "base-sepolia":
      return baseSepolia.id;
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

  // Use refs to preserve claim data across re-renders (wagmi hooks can cause re-renders)
  const claimDataRef = useRef<{
    name: string;
    salt: `0x${string}` | null;
    primaryTokenId: bigint | null;
  }>({ name: "", salt: null, primaryTokenId: null });

  // Contract reads
  const { data: minCommitAge } = useReadFlsNamingMinCommitAge({ chainId });
  const { data: maxCommitAge } = useReadFlsNamingMaxCommitAge({ chainId });

  // Contract writes
  const {
    writeContract: writeCommitName,
    data: commitTxHash,
    isPending: isCommitPending,
    reset: resetCommit,
  } = useWriteFlsNamingCommitName();

  const {
    writeContract: writeClaimName,
    data: claimTxHash,
    isPending: isClaimPending,
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
        setError(err instanceof Error ? err.message : "Failed to commit");
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
      setError(err instanceof Error ? err.message : "Failed to claim");
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
    return step === "waiting" && secondsRemaining === 0;
  }, [step, secondsRemaining]);

  return {
    step,
    error,
    name,
    primaryTokenId,
    secondsRemaining,
    minCommitAge: minCommitAge ? Number(minCommitAge) : 10,
    maxCommitAge: maxCommitAge ? Number(maxCommitAge) : 86400,
    canClaim,
    isCommitPending: isCommitPending || isCommitConfirming,
    isClaimPending: isClaimPending || isClaimConfirming,
    startCommit,
    submitClaim,
    reset,
  };
}
