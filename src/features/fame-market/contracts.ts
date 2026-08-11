import { base } from "viem/chains";
import { fameFromNetwork, societyFromNetwork } from "@/features/fame/contract";
import type { BaseFameV3Stack } from "@/features/fame/contract";
import { DEFAULT_FAME_ROUTER_ADDRESS } from "@/features/fame-swap/config";
import { USDC, WETH } from "@/features/fame-swap/tokens";

export const BASE_GALLERY_ADDRESSES = {
  fame: fameFromNetwork(base.id),
  mirror: societyFromNetwork(base.id),
} as const;

export const BASE_GALLERY_CHECKOUT_DEPENDENCIES = {
  router: DEFAULT_FAME_ROUTER_ADDRESS,
  usdc: USDC,
  weth: WETH,
} as const;

export type BaseGalleryContracts = BaseFameV3Stack;
