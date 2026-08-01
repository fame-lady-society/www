import { base } from "viem/chains";
import {
  BASE_GALLERY_ADDRESSES,
  BASE_GALLERY_CHECKOUT_DEPENDENCIES,
  type BaseGalleryForkContracts,
} from "../contracts";
import type { GalleryRuntimeConfig } from "./galleryRuntime";

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
      firstTokenId: 1,
      lastTokenId: 888,
    },
    deployment: {
      // The fork deployment is intentionally temporary. Its address is the
      // only deployment fact the app needs; no manifest or proof is persisted.
      blockNumber: 0n,
    },
    explorerBaseUrl: base.blockExplorers.default.url,
    labels: {
      title: "FAME gallery",
      description: contracts.checkout
        ? "Choose an artwork and buy it with FAME, ETH, USDC, or WETH. Wallet connection is only needed when you buy."
        : "Choose an artwork and buy it with FAME. Wallet connection is only needed when you buy.",
      network: "Base",
    },
  };
}
