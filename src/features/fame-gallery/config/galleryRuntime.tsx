"use client";

import { createContext, useContext, type PropsWithChildren } from "react";
import type { Address } from "viem";
import { BASE_SEPOLIA_TEST_GALLERY_CONFIG } from "./baseSepoliaTestGallery";

export type GalleryRuntimeConfig = {
  schemaVersion: number;
  chainId: number;
  addresses: {
    fame: Address;
    mirror: Address;
    creatorMagic: Address;
    gallery: Address;
  };
  token: {
    name: string;
    symbol: string;
  };
  collection: {
    firstTokenId: number;
    lastTokenId: number;
  };
  deployment: {
    blockNumber: bigint;
  };
  explorerBaseUrl: string;
  labels: {
    title: string;
    description: string;
    network: string;
  };
};

export const BASE_SEPOLIA_GALLERY_RUNTIME: GalleryRuntimeConfig = {
  ...BASE_SEPOLIA_TEST_GALLERY_CONFIG,
  token: {
    name: BASE_SEPOLIA_TEST_GALLERY_CONFIG.testToken.name,
    symbol: BASE_SEPOLIA_TEST_GALLERY_CONFIG.testToken.symbol,
  },
  labels: {
    title: "TEST gallery",
    description:
      "Choose an artwork and buy it with TEST. Wallet connection is only needed when you buy.",
    network: "Base Sepolia",
  },
};

const GalleryRuntimeContext = createContext<GalleryRuntimeConfig>(
  BASE_SEPOLIA_GALLERY_RUNTIME,
);

export function GalleryRuntimeProvider({
  config,
  children,
}: PropsWithChildren<{ config: GalleryRuntimeConfig }>) {
  return (
    <GalleryRuntimeContext.Provider value={config}>
      {children}
    </GalleryRuntimeContext.Provider>
  );
}

export function useGalleryRuntime() {
  return useContext(GalleryRuntimeContext);
}
