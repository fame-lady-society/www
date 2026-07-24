import { getAddress, isAddress, type Address } from "viem";
import { base } from "viem/chains";
import {
  creatorArtistMagicAddress,
  fameFromNetwork,
  societyFromNetwork,
} from "@/features/fame/contract";
import type { GalleryRuntimeConfig } from "./galleryRuntime";

export const BASE_GALLERY_ADDRESSES = {
  fame: fameFromNetwork(base.id),
  mirror: societyFromNetwork(base.id),
  creatorMagic: creatorArtistMagicAddress(base.id),
} as const;

export function parseBaseMarketplaceAddress(
  value: string | undefined,
): Address | null {
  const candidate = value?.trim();
  return candidate && isAddress(candidate, { strict: false })
    ? getAddress(candidate)
    : null;
}

export function createBaseGalleryRuntime(
  marketplaceAddress: Address,
): GalleryRuntimeConfig {
  return {
    schemaVersion: 1,
    chainId: base.id,
    addresses: {
      ...BASE_GALLERY_ADDRESSES,
      gallery: marketplaceAddress,
    },
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
      description:
        "Choose an artwork and buy it with FAME. Wallet connection is only needed when you buy.",
      network: "Base",
    },
  };
}
