import { getAddress, isAddress, type Address } from "viem";
import type { GalleryRuntimeConfig } from "./galleryRuntime";

export const BASE_GALLERY_ADDRESSES = {
  fame: "0xf307e242BfE1EC1fF01a4Cef2fdaa81b10A52418",
  mirror: "0xBB5ED04dD7B207592429eb8d599d103CCad646c4",
  creatorMagic: "0xC8268c2aa571F3C88044C2959F73DdB8eB9e139F",
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
    chainId: 8_453,
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
    explorerBaseUrl: "https://basescan.org",
    labels: {
      title: "FAME gallery",
      description:
        "Choose an artwork and buy it with FAME. Wallet connection is only needed when you buy.",
      network: "Base",
    },
  };
}
