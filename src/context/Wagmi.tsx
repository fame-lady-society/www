"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { FC, PropsWithChildren } from "react";
import { base, baseSepolia, mainnet, sepolia } from "viem/chains";
import { WagmiProvider } from "wagmi";

import { wagmiConfig } from "./appKit";
import { SiweSessionProvider } from "./SiweSession";

export const DEFAULT_SIWE_CHAIN_IDS = [
  mainnet.id,
  base.id,
  sepolia.id,
  baseSepolia.id,
] as const;

const queryClient = new QueryClient();

export const Web3Provider: FC<
  PropsWithChildren<{
    siwe?: boolean;
    authChains?: readonly number[];
  }>
> = ({ children, siwe = false, authChains = DEFAULT_SIWE_CHAIN_IDS }) => (
  <WagmiProvider config={wagmiConfig} reconnectOnMount>
    <QueryClientProvider client={queryClient}>
      <SiweSessionProvider enabled={siwe} authChains={authChains}>
        {children}
      </SiweSessionProvider>
    </QueryClientProvider>
  </WagmiProvider>
);
