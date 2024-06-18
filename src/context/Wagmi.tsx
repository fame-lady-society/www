"use client";
import { siweClient } from "@/utils/siweClient";
import { SIWESession } from "connectkit";
import { WagmiProvider, createConfig, fallback, http } from "wagmi";
import { base, mainnet, sepolia, polygon as polygonChain } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FC, PropsWithChildren, useMemo } from "react";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { Chain, Transport } from "viem";

export const mainnetSepolia = {
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(
      `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`,
    ),
    [sepolia.id]: http(
      `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`,
    ),
  },
} as const;

export const baseSepolia = {
  chains: [base, sepolia],
  transports: {
    [base.id]: fallback([
      http(process.env.NEXT_PUBLIC_BASE_RPC_URL_1!, {
        batch: true,
      }),
      http(process.env.NEXT_PUBLIC_BASE_RPC_URL_2!, {
        batch: true,
      }),
    ]),
    [sepolia.id]: http(
      `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`,
    ),
  },
} as const;

export const polygonOnly = {
  chains: [polygonChain],
  transports: {
    [polygonChain.id]: fallback([
      http(process.env.NEXT_PUBLIC_POLYGON_RPC_URL_1!, {
        batch: true,
      }),
      http(process.env.NEXT_PUBLIC_POLYGON_RPC_URL_2!, {
        batch: true,
      }),
    ]),
  },
} as const;

export const defaultConfig = {
  ...mainnetSepolia,
  // Required API Keys
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  multiInjectedProviderDiscovery: true,

  // Required App Info
  appName: "Fame Lady Society",

  // Optional App Info
  appDescription: "The good place",
  appUrl: "https://www.fameladysociety.com", // your app's url
  appIcon: "https://www.fameladysociety.com/images/fame/bala.png",

  ssr: true,
};

const queryClient = new QueryClient();

export const Web3Provider: FC<
  PropsWithChildren<{
    siwe?: boolean;
    transports?: Record<number, Transport>;
    chains: readonly [Chain, ...Chain[]];
  }>
> = ({ children, siwe = false, transports, chains }) => {
  const config = useMemo(
    () =>
      createConfig(
        getDefaultConfig({
          ...defaultConfig,
          ...(chains && chains.length && { chains }),
          ...(transports && { transports }),
        }),
      ),
    [chains, transports],
  );
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <siweClient.Provider
          enabled={siwe}
          nonceRefetchInterval={300000} // in milliseconds, defaults to 5 minutes
          sessionRefetchInterval={300000} // in milliseconds, defaults to 5 minutes
          signOutOnDisconnect={true} // defaults true
          signOutOnAccountChange={true} // defaults true
          signOutOnNetworkChange={true} // defaults true
          onSignIn={(session?: SIWESession) => void 0}
          onSignOut={() => void 0}
        >
          <ConnectKitProvider>{children}</ConnectKitProvider>
        </siweClient.Provider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
