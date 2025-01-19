import { polygonAmoy } from "viem/chains";

export function lingerieDreamsAddressForChain(chainId: typeof polygonAmoy.id) {
  switch (chainId) {
    case polygonAmoy.id:
      return "0x7FFaC7328616d0C9a533D720caAc89157779A0e2" as const;
    default:
      throw new Error(`Unsupported chainId: ${chainId}`);
  }
}
