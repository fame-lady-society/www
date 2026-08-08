"use client";

import { createContext, useContext, type PropsWithChildren } from "react";
import type { Address } from "viem";

export type GalleryRuntimeConfig = {
  schemaVersion: number;
  chainId: number;
  forkMode: boolean;
  addresses: {
    fame: Address;
    mirror: Address;
    creatorMagic: Address;
    gallery: Address;
  };
  checkout: null | {
    address: Address;
    router: Address;
    usdc: Address;
    weth: Address;
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

const GalleryRuntimeContext = createContext<GalleryRuntimeConfig | null>(null);

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
  const runtime = useContext(GalleryRuntimeContext);
  if (!runtime) {
    throw new Error(
      "Gallery runtime is not configured. Wrap marketplace consumers in GalleryRuntimeProvider.",
    );
  }
  return runtime;
}
