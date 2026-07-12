import { isAddress, zeroAddress, type Address } from "viem";

export type SocietyNftAuctionConfig =
  | {
      status: "configured";
      address: Address;
    }
  | {
      status: "not_configured";
      address: null;
    };

export function getSocietyNftAuctionConfig(
  rawAddress: string | undefined = process.env
    .NEXT_PUBLIC_SOCIETY_NFT_AUCTION_ADDRESS,
): SocietyNftAuctionConfig {
  const address = rawAddress?.trim();

  if (!address || !isAddress(address) || address === zeroAddress) {
    return {
      status: "not_configured",
      address: null,
    };
  }

  return {
    status: "configured",
    address,
  };
}
