"use client";

import { useReadLingerieDreamsGetStartTime } from "@/wagmi";
import { lingerieDreamsAddressForChain } from "./contracts";
import { polygonAmoy } from "viem/chains";

export function useIsMintOpen(chainId: typeof polygonAmoy.id) {
  return useReadLingerieDreamsGetStartTime({
    address: lingerieDreamsAddressForChain(chainId),
  });
}
