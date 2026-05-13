"use client";

import { useMemo } from "react";
import type { Address } from "viem";
import { base } from "viem/chains";
import { useBalance, useReadContract } from "wagmi";
import type { FameSwapToken } from "../tokens";

const BALANCE_STALE_MS = 60_000;

const erc20BalanceAbi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const;

export type FameSwapBalanceStatus =
  | "disconnected"
  | "loading"
  | "ready"
  | "stale"
  | "error";

export interface FameSwapBalanceState {
  status: FameSwapBalanceStatus;
  balance: bigint | null;
  message: string | null;
}

export function useFameSwapBalance(
  address: Address | undefined,
  token: FameSwapToken,
): FameSwapBalanceState {
  const enabled = Boolean(address);
  const nativeBalance = useBalance({
    address,
    chainId: base.id,
    query: {
      enabled: enabled && token.native,
    },
  });
  const erc20Balance = useReadContract({
    address: token.native ? undefined : token.address,
    abi: erc20BalanceAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: base.id,
    query: {
      enabled: enabled && !token.native,
    },
  });

  return useMemo(() => {
    if (!address) {
      return {
        status: "disconnected",
        balance: null,
        message: null,
      };
    }

    const loading = token.native
      ? nativeBalance.isLoading
      : erc20Balance.isLoading;
    if (loading) {
      return {
        status: "loading",
        balance: null,
        message: "Checking balance.",
      };
    }

    const error = token.native ? nativeBalance.isError : erc20Balance.isError;
    if (error) {
      return {
        status: "error",
        balance: null,
        message: "Balance unavailable.",
      };
    }

    const balance = token.native ? nativeBalance.data?.value : erc20Balance.data;
    if (typeof balance !== "bigint") {
      return {
        status: "error",
        balance: null,
        message: "Balance unavailable.",
      };
    }

    const updatedAt = token.native
      ? nativeBalance.dataUpdatedAt
      : erc20Balance.dataUpdatedAt;
    const stale = updatedAt > 0 && Date.now() - updatedAt > BALANCE_STALE_MS;

    return {
      status: stale ? "stale" : "ready",
      balance,
      message: stale ? "Balance may be stale." : null,
    };
  }, [
    address,
    erc20Balance.data,
    erc20Balance.dataUpdatedAt,
    erc20Balance.isError,
    erc20Balance.isLoading,
    nativeBalance.data?.value,
    nativeBalance.dataUpdatedAt,
    nativeBalance.isError,
    nativeBalance.isLoading,
    token.native,
  ]);
}
