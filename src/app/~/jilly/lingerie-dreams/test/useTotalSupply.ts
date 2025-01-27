"use client";

import {
  useReadLingerieDreamsTotalSupply,
  useWatchLingerieDreamsTransferEvent,
} from "@/wagmi";
import { lingerieDreamsAddressForChain } from "./contracts";
import { polygonAmoy } from "viem/chains";
import { zeroAddress } from "viem";

export function useTotalSupply(chainId: typeof polygonAmoy.id) {
  const { refetch, ...rest } = useReadLingerieDreamsTotalSupply({
    chainId,
    address: lingerieDreamsAddressForChain(chainId),
  });
  useWatchLingerieDreamsTransferEvent({
    chainId,
    address: lingerieDreamsAddressForChain(chainId),
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
