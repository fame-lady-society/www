import { societyNftAuctionAddress } from "@/features/fame/contract";
import { isAddress, zeroAddress, type Address } from "viem";
import { base } from "viem/chains";

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
  rawAddress: string | undefined = societyNftAuctionAddress(base.id),
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
