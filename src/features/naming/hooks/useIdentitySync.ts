"use client";

import { useEffect, useRef, useState } from "react";
import { getConnection } from "@wagmi/core";
import {
  useConfig,
  useConnection,
  usePublicClient,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import type { Hash } from "viem";
import { flsNamingAbi, flsNamingAddress } from "@/wagmi";
import { getChainId } from "../utils/networkUtils";
import type { NetworkType } from "./useOwnedGateNftTokens";
import {
  previewIdentityBurn,
  sameIdentityBurn,
  waitForIdentitySync,
  identitySyncError,
  SettledSyncError,
  type PendingIdentityBurn,
} from "../services/identitySync";

export type SyncStage =
  | "idle"
  | "checking"
  | "review"
  | "preparing"
  | "signing"
  | "confirming"
  | "refreshing"
  | "error";

export function useIdentitySync(
  network: NetworkType,
  tokenId: bigint,
  refreshProfile: (minimumBlock?: bigint) => Promise<void>,
) {
  const chainId = getChainId(network);
  const contractAddress =
    flsNamingAddress[chainId as keyof typeof flsNamingAddress];
  const client = usePublicClient({ chainId });
  const config = useConfig();
  const { address } = useConnection();
  const { mutateAsync: switchChain } = useSwitchChain();
  const { mutateAsync: writeContract } = useWriteContract();
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<SyncStage>("idle");
  const [burn, setBurn] = useState<PendingIdentityBurn | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hash, setHash] = useState<Hash>();
  const [confirmedBlock, setConfirmedBlock] = useState<bigint>();
  const operation = useRef(0);
  const running = useRef(false);
  useEffect(
    () => () => {
      operation.current++;
    },
    [],
  );
  const busy = [
    "checking",
    "preparing",
    "signing",
    "confirming",
    "refreshing",
  ].includes(stage);

  async function start() {
    if (running.current) {
      setOpen(true);
      return;
    }
    // A receipt error does not prove a submitted transaction failed. Reopen
    // its recovery dialog instead of asking the wallet to send it again.
    if (
      (hash && confirmedBlock === undefined) ||
      (confirmedBlock !== undefined && error)
    ) {
      setOpen(true);
      setStage("error");
      return;
    }
    const id = ++operation.current;
    running.current = true;
    setOpen(true);
    setStage("checking");
    setError(null);
    setHash(undefined);
    setConfirmedBlock(undefined);
    setBurn(null);
    try {
      if (!client) throw new Error("Network unavailable. Please try again.");
      const pending = await previewIdentityBurn(
        client,
        contractAddress,
        tokenId,
      );
      if (id !== operation.current) return;
      if (!pending) {
        setStage("refreshing");
        await refreshProfile();
        if (id !== operation.current) return;
        setOpen(false);
        setStage("idle");
      } else {
        setBurn(pending);
        setStage("review");
      }
    } catch (cause) {
      if (id !== operation.current) return;
      setError(identitySyncError(cause));
      setStage("error");
    } finally {
      if (id === operation.current) running.current = false;
    }
  }

  function cancel() {
    // Dismissal does not cancel a wallet request or a submitted transaction.
    // Keep watching its receipt and refresh on success, even with the dialog shut.
    if (running.current && stage !== "checking") {
      setOpen(false);
      return;
    }
    operation.current++;
    running.current = false;
    setOpen(false);
    setStage("idle");
  }

  async function submit() {
    if (running.current || !client || !burn) return;
    const id = ++operation.current;
    running.current = true;
    setError(null);
    const active = () => id === operation.current;
    const finish = async (blockNumber: bigint) => {
      if (active()) setStage("refreshing");
      await refreshProfile(blockNumber);
      if (!active()) return;
      setOpen(false);
      setStage("idle");
    };
    try {
      if (confirmedBlock !== undefined) {
        await finish(confirmedBlock);
        return;
      }
      let pendingHash = hash;
      if (!pendingHash) {
        const connection = getConnection(config);
        const account = connection.address;
        if (!account)
          throw new Error("Connect your wallet to confirm this sync.");
        setStage("preparing");
        if (connection.chainId !== chainId) await switchChain({ chainId });
        if (!active()) return;
        const current = await previewIdentityBurn(
          client,
          contractAddress,
          tokenId,
          account,
        );
        if (!active()) return;
        const wallet = getConnection(config);
        if (
          wallet.address?.toLowerCase() !== account.toLowerCase() ||
          wallet.chainId !== chainId
        ) {
          throw new Error("Your wallet or network changed. Please try again.");
        }
        if (!current) {
          await finish(await client.getBlockNumber({ cacheTime: 0 }));
          return;
        }
        if (!sameIdentityBurn(burn, current)) {
          setBurn(current);
          setError(
            "Ownership changed. Review the updated identity before confirming.",
          );
          setStage("review");
          return;
        }
        setStage("signing");
        pendingHash = await writeContract({
          address: contractAddress,
          abi: flsNamingAbi,
          functionName: "sync",
          args: [current.primaryAddress],
          account,
          chainId,
        });
        if (active()) setHash(pendingHash);
      }
      if (active()) setStage("confirming");
      const receipt = await waitForIdentitySync(
        client,
        pendingHash,
        (replacementHash) => {
          if (active()) setHash(replacementHash);
        },
      );
      // Complete cache refresh even if the user navigated away after signing.
      if (active()) setConfirmedBlock(receipt.blockNumber);
      await finish(receipt.blockNumber);
    } catch (cause) {
      if (!active()) return;
      if (cause instanceof SettledSyncError) setHash(undefined);
      setError(identitySyncError(cause));
      setStage("error");
    } finally {
      if (active()) running.current = false;
    }
  }

  return {
    open,
    stage,
    busy,
    burn,
    error,
    hash,
    confirmedBlock,
    address,
    start,
    cancel,
    submit,
  };
}
