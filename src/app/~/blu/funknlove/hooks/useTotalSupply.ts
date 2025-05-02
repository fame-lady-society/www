"use client";

import {
  funknloveAbi,
  useWatchFunknloveTransferBatchEvent,
  useWatchFunknloveTransferSingleEvent,
} from "@/wagmi";
import { useReadContracts } from "wagmi";
import { funknloveAddressForChain } from "../contracts";
import { sepolia, mainnet } from "viem/chains";
import { zeroAddress } from "viem";

export function useTotalSupply(chainId: typeof sepolia.id | typeof mainnet.id) {
  const { refetch, data, ...rest } = useReadContracts({
    contracts: [
      {
        address: funknloveAddressForChain(chainId),
        abi: funknloveAbi,
        functionName: "getBronzeSupply",
        chainId,
      },
      {
        address: funknloveAddressForChain(chainId),
        abi: funknloveAbi,
        functionName: "getSilverSupply",
        chainId,
      },
      {
        address: funknloveAddressForChain(chainId),
        abi: funknloveAbi,
        functionName: "getGoldSupply",
        chainId,
      },
    ],
    allowFailure: false,
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
  return {
    ...rest,
    refetch,
    ...(data
      ? {
          data: {
            bronzeSupply: data[0],
            silverSupply: data[1],
            goldSupply: data[2],
          },
        }
      : {}),
  };
}
