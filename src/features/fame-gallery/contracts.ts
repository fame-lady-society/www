import { getAddress, isAddress, type Address } from "viem";
import { base } from "viem/chains";
import {
  creatorArtistMagicAddress,
  fameFromNetwork,
  societyFromNetwork,
} from "@/features/fame/contract";
import { DEFAULT_FAME_ROUTER_ADDRESS } from "@/features/fame-swap/config";
import { USDC, WETH } from "@/features/fame-swap/tokens";

export const BASE_GALLERY_ADDRESSES = {
  fame: fameFromNetwork(base.id),
  mirror: societyFromNetwork(base.id),
  creatorMagic: creatorArtistMagicAddress(base.id),
} as const;

export const BASE_GALLERY_CHECKOUT_DEPENDENCIES = {
  router: DEFAULT_FAME_ROUTER_ADDRESS,
  usdc: USDC,
  weth: WETH,
} as const;

export type BaseGalleryForkContracts = Readonly<{
  marketplace: Address;
  checkout: Address | null;
}>;

function parseAddress(value: string | undefined): Address | null {
  const candidate = value?.trim();
  return candidate && isAddress(candidate, { strict: false })
    ? getAddress(candidate)
    : null;
}

export function parseBaseGalleryForkContracts(input: {
  marketplace: string | undefined;
  checkout: string | undefined;
  forkMode?: boolean;
}): BaseGalleryForkContracts | null {
  const marketplace = parseAddress(input.marketplace);
  if (!marketplace) return null;
  return {
    marketplace,
    checkout: input.forkMode ? parseAddress(input.checkout) : null,
  };
}
