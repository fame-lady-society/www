import { useReadLingerieDreamsMintLimit } from "@/wagmi";
import { lingerieDreamsAddressForChain } from "./contracts";
import { polygonAmoy } from "viem/chains";

export const useMintLimit = (chainId: typeof polygonAmoy.id) => {
  return useReadLingerieDreamsMintLimit({
    chainId,
    address: lingerieDreamsAddressForChain(chainId),
  });
};
