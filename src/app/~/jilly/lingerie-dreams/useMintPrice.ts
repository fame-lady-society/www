import { useReadLingerieDreamsMintPrice } from "@/wagmi";
import { lingerieDreamsAddressForChain } from "./contracts";
import { polygonAmoy, polygon } from "viem/chains";

export const useMintPrice = (
  chainId: typeof polygonAmoy.id | typeof polygon.id,
) => {
  return useReadLingerieDreamsMintPrice({
    chainId,
    address: lingerieDreamsAddressForChain(chainId),
  });
};
