import { polygonAmoy } from "viem/chains";

export function lingerieDreamsAddressForChain(chainId: typeof polygonAmoy.id) {
  switch (chainId) {
    case polygonAmoy.id:
      return "0xa6710a38d6b0a09036541e55c64aecf0a50fc8f1" as const;
    default:
      throw new Error(`Unsupported chainId: ${chainId}`);
  }
}
