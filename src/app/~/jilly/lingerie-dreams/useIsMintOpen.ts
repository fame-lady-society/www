"use client";

import { useReadLingerieDreamsGetStartTime } from "@/wagmi";
import { lingerieDreamsAddressForChain } from "./contracts";
import { polygonAmoy, polygon } from "viem/chains";

export function useIsMintOpen(
  chainId: typeof polygonAmoy.id | typeof polygon.id,
) {
  return useReadLingerieDreamsGetStartTime({
    chainId,
    address: lingerieDreamsAddressForChain(chainId),
  });
}
