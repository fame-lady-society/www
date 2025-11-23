"use client";
import { useCallback, useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import {
  saveLadyAbi,
  saveLadyProxyAddress,
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
  const { address: receiver } = useAccount();

  const { writeContractAsync } = useWriteContract();

  const executeSweep = useCallback(
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

        setStatus("submitting");
        const txHash = await writeContractAsync({
          abi: saveLadyAbi,
          address: saveLadyProxyAddress[mainnet.id],
          functionName: "sweepAndWrap",
          args: [
            payload.advancedOrders,
            payload.fulfillerConduitKey,
            payload.tokenIds,
            payload.ethAmounts,
          ],
          value,
        });
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
      } catch (e: any) {
        setStatus("error");
        setError(e?.message || String(e));
        return { success: false, error: e?.message || String(e) };
      }
    },
    [receiver, wrapCostData, writeContractAsync],
  );

  return {
    executeSweep,
    status,
    txHash,
    error,
  } as const;
}
