"use client";

import {
  useReadFunknloveTotalSupply,
  useWatchFunknloveTransferBatchEvent,
  useWatchFunknloveTransferSingleEvent,
} from "@/wagmi";
import { funknloveAddressForChain } from "../contracts";
import { polygonAmoy, polygon } from "viem/chains";
import { zeroAddress } from "viem";

export function useTotalSupply(
  chainId: typeof polygonAmoy.id | typeof polygon.id,
) {
  const { refetch, ...rest } = useReadFunknloveTotalSupply({
    chainId,
    address: funknloveAddressForChain(chainId),
  });
  useWatchFunknloveTransferSingleEvent({
    chainId,
    address: funknloveAddressForChain(chainId),
    batch: true,
    pollingInterval: 5000,
    onLogs: (logs) => {
      let wasMinted = false;
      for (const log of logs) {
        if (log.args.from === zeroAddress) {
          wasMinted = true;
          break;
        }
      }
      if (wasMinted) {
        refetch();
      }
    },
  });

  useWatchFunknloveTransferBatchEvent({
    chainId,
    address: funknloveAddressForChain(chainId),
    batch: true,
    pollingInterval: 5000,
    onLogs: (logs) => {
      let wasMinted = false;
      for (const log of logs) {
        if (log.args.from === zeroAddress) {
          wasMinted = true;
          break;
        }
      }
      if (wasMinted) {
        refetch();
      }
    },
  });
  return { ...rest, refetch };
}
