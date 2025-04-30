import { polygonAmoy, polygon } from "viem/chains";

export function funknloveAddressForChain(
  chainId: typeof polygonAmoy.id | typeof polygon.id,
) {
  switch (chainId) {
    case polygonAmoy.id:
      return "0x800131bDC1120Ace92bA34c47cB5f01f928aB6E7" as const;
    case polygon.id:
      return "0xB86F5836A97DEc296a4bAdE3c79d01d2E7D8Fb48" as const;
    default:
      throw new Error(`Unsupported chainId: ${chainId}`);
  }
}
