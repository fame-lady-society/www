import { useReadLingerieDreamsMintLimit } from "@/wagmi";
import { lingerieDreamsAddressForChain } from "./contracts";
import { polygonAmoy, polygon } from "viem/chains";

export const useMintLimit = (
  chainId: typeof polygonAmoy.id | typeof polygon.id,
) => {
  return useReadLingerieDreamsMintLimit({
    chainId,
    address: lingerieDreamsAddressForChain(chainId),
  });
};
