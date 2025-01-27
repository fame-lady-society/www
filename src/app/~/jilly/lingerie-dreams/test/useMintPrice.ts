import { useReadLingerieDreamsMintPrice } from "@/wagmi";
import { lingerieDreamsAddressForChain } from "./contracts";
import { polygonAmoy } from "viem/chains";

export const useMintPrice = (chainId: typeof polygonAmoy.id) => {
  return useReadLingerieDreamsMintPrice({
    chainId,
    address: lingerieDreamsAddressForChain(chainId),
  });
};
