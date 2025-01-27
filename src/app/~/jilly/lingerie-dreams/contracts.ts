import { polygonAmoy } from "viem/chains";

export function lingerieDreamsAddressForChain(chainId: typeof polygonAmoy.id) {
  switch (chainId) {
    case polygonAmoy.id:
      return "0x800131bDC1120Ace92bA34c47cB5f01f928aB6E7" as const;
    default:
      throw new Error(`Unsupported chainId: ${chainId}`);
  }
}
