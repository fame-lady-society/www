import { isAddress, isAddressEqual, zeroAddress, type Address } from "viem";

export type FameGalleryStatus = "available" | "owned" | "not_available" | "unknown";

export function classifyFameGalleryStatus(input: {
  owner: Address | null;
  marketplace: Address | null;
  available: boolean | null;
  /**
   * Market-wide identity, pause, and inventory reads are an authority gate.
   * An owner read alone must not create a public ownership claim.
   */
  authorityVerified?: boolean;
}): FameGalleryStatus {
  if (input.authorityVerified === false) return "unknown";
  if (input.available === true) return "available";
  if (input.available === null || !input.marketplace || !input.owner) return "unknown";
  if (!isAddress(input.owner) || !isAddress(input.marketplace)) return "unknown";
  if (!isAddressEqual(input.owner, zeroAddress) && !isAddressEqual(input.owner, input.marketplace)) {
    return "owned";
  }
  return "not_available";
}
