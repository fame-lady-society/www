"use client";
import { useCallback, useState } from "react";
import { useAccount } from "@/hooks/useAccount";
import { useChainId, useSwitchChain, useWriteContract } from "wagmi";
import {
  WaitForTransactionReceiptErrorType,
  type WriteContractErrorType,
} from "@wagmi/core";
import {
  saveLadyAbi,
  saveLadyAddress,
  useReadFameLadySocietyWrapCost,
} from "@/wagmi";
import { mainnet } from "viem/chains";
import { prepareSweepPayload } from "@/lib/seaport/prepareSweepPayload";
import type { Listing } from "opensea-js";
import { waitForTransactionReceipt } from "viem/actions";
import { client as mainnetClient } from "@/viem/mainnet-client";

const FEE_BPS = 250n;

export function useSweepAndWrap() {
  const [status, setStatus] = useState<
    "idle" | "building" | "submitting" | "submitted" | "confirmed" | "error"
  >("idle");
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  const { data: wrapCostData } = useReadFameLadySocietyWrapCost();
  const { mutateAsync: switchChainAsync } = useSwitchChain();
  const { address: receiver } = useAccount();
  const { mutateAsync: writeContractAsync } = useWriteContract();
  const chainId = useChainId();

  const submitSweep = useCallback(
    async (selectedListings: Listing[]) => {
      if (!receiver) {
        throw new Error("No connected wallet");
      }
      try {
        setStatus("building");
        const payload = await prepareSweepPayload(receiver, selectedListings);
        const wrapCostEach = BigInt(wrapCostData ?? 0n);
        const totalWrapCost = wrapCostEach * BigInt(payload.tokenIds.length);
        const totalPrice = payload.totalPrice;
        const feeAmount = ((totalPrice + totalWrapCost) * FEE_BPS) / 10000n;
        const value = totalPrice + totalWrapCost + feeAmount;
        try {
          setStatus("submitting");
          const txHash = await writeContractAsync({
            abi: saveLadyAbi,
            address: saveLadyAddress[mainnet.id],
            functionName: "sweepAndWrap",
            args: [
              payload.advancedOrders,
              payload.fulfillerConduitKey,
              payload.tokenIds,
              payload.ethAmounts,
            ],
            value,
          });
          try {
            setStatus("submitted");
            setTxHash(txHash);
            const receipt = await waitForTransactionReceipt(mainnetClient, {
              hash: txHash,
            });
            if (receipt.status === "success") {
              setStatus("confirmed");
              return { success: true, hash: txHash };
            } else {
              setStatus("error");
              setError("Transaction failed");
              return { success: false, error: "Transaction failed" };
            }
          } catch (e: unknown) {
            setStatus("error");
            console.error("Error waiting for transaction confirmation", e);
            const error = e as WaitForTransactionReceiptErrorType;
            if ("shortMessage" in error) {
              setError(error.shortMessage);
              return { success: false, error: error.shortMessage };
            }
            setError(error?.name);
            return { success: false, error: error.name };
          }
        } catch (e: unknown) {
          setStatus("error");
          const error = e as WriteContractErrorType;
          console.error("Error submitting transaction", error);
          if ("shortMessage" in error) {
            setError(error.shortMessage);
            return { success: false, error: error.shortMessage };
          }
          setError(error?.name || String(error));
          return { success: false, error: error?.name || String(error) };
        }
      } catch (e: unknown) {
        setStatus("error");
        if (e instanceof Error) {
          setError(e.message);
          return { success: false, error: e.message };
        } else {
          setError(String(e));
          return { success: false, error: String(e) };
        }
      }
    },
    [receiver, wrapCostData, writeContractAsync],
  );
  const executeSweep = useCallback(
    async (selectedListings: Listing[]) => {
      if (chainId === mainnet.id) {
        return await submitSweep(selectedListings);
      } else {
        return await switchChainAsync({ chainId: mainnet.id }).then(() =>
          submitSweep(selectedListings),
        );
      }
    },
    [submitSweep, switchChainAsync, chainId],
  );

  return {
    executeSweep,
    status,
    txHash,
    error,
  } as const;
}
