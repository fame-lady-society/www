import { base } from "viem/chains";
import {
  BASE_GALLERY_ADDRESSES,
  BASE_GALLERY_CHECKOUT_DEPENDENCIES,
  type BaseGalleryForkContracts,
} from "../contracts";
import type { GalleryRuntimeConfig } from "./galleryRuntime";
import {
  FAME_COLLECTION_FIRST_TOKEN_ID,
  FAME_COLLECTION_LAST_TOKEN_ID,
} from "@/features/fame/collection";

export { BASE_GALLERY_ADDRESSES } from "../contracts";

export function createBaseGalleryRuntime(
  contracts: BaseGalleryForkContracts,
): GalleryRuntimeConfig {
  return {
    schemaVersion: 1,
    chainId: base.id,
    addresses: {
      ...BASE_GALLERY_ADDRESSES,
      gallery: contracts.marketplace,
    },
    checkout: contracts.checkout
      ? {
          mode: "fork",
          address: contracts.checkout,
          ...BASE_GALLERY_CHECKOUT_DEPENDENCIES,
        }
      : null,
    token: {
      name: "Society",
      symbol: "FAME",
    },
    collection: {
      firstTokenId: FAME_COLLECTION_FIRST_TOKEN_ID,
      lastTokenId: FAME_COLLECTION_LAST_TOKEN_ID,
    },
    deployment: {
      // The fork deployment is intentionally temporary. Its address is the
      // only deployment fact the app needs; no manifest or proof is persisted.
      blockNumber: 0n,
    },
    explorerBaseUrl: base.blockExplorers.default.url,
    labels: {
      title: "FAME Marketplace",
      description: contracts.checkout
        ? "Choose an artwork and buy it with FAME, ETH, USDC, or WETH. Wallet connection is only needed when you buy."
        : "Choose an artwork and buy it with FAME. Wallet connection is only needed when you buy.",
      network: "Base",
    },
  };
}
