import { base } from "viem/chains";
import {
  BASE_GALLERY_ADDRESSES,
  BASE_GALLERY_CHECKOUT_DEPENDENCIES,
  type BaseGalleryContracts,
} from "../contracts";
import type { GalleryRuntimeConfig } from "./galleryRuntime";
import { baseLegacyUniversalMarketplaceAddress } from "@/features/fame/contract";
import {
  FAME_COLLECTION_FIRST_TOKEN_ID,
  FAME_COLLECTION_LAST_TOKEN_ID,
} from "@/features/fame/collection";

export { BASE_GALLERY_ADDRESSES } from "../contracts";

export function createBaseGalleryRuntime(
  contracts: BaseGalleryContracts,
  options: { forkMode: boolean },
): GalleryRuntimeConfig {
  return {
    schemaVersion: 1,
    chainId: base.id,
    forkMode: options.forkMode,
    addresses: {
      ...BASE_GALLERY_ADDRESSES,
      creatorMagic: contracts.creatorMagic,
      gallery: contracts.marketplace,
    },
    checkout: {
      address: contracts.checkout,
      ...BASE_GALLERY_CHECKOUT_DEPENDENCIES,
    },
    token: {
      name: "Society",
      symbol: "FAME",
    },
    collection: {
      firstTokenId: FAME_COLLECTION_FIRST_TOKEN_ID,
      lastTokenId: FAME_COLLECTION_LAST_TOKEN_ID,
    },
    deployment: {
      blockNumber: 0n,
    },
    explorerBaseUrl: base.blockExplorers.default.url,
    labels: {
      title: "FAME Marketplace",
      description:
        "Choose an artwork and buy it with FAME, ETH, or USDC. Wallet connection is only needed when you buy.",
      network: "Base",
    },
  };
}

export function createBaseLegacyGalleryRuntime(
  contracts: BaseGalleryContracts,
  options: { forkMode: boolean },
): GalleryRuntimeConfig {
  const active = createBaseGalleryRuntime(contracts, options);
  return {
    ...active,
    addresses: {
      ...active.addresses,
      gallery: baseLegacyUniversalMarketplaceAddress,
    },
    checkout: null,
    labels: {
      ...active.labels,
      title: "Legacy marketplace recovery",
      description:
        "Withdraw a credited provider position from the retired marketplace.",
    },
  };
}
