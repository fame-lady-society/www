"use client";
import { siweClient } from "@/utils/siweClient";
import { SIWESession } from "connectkit";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FC, PropsWithChildren } from "react";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";

const config = createConfig(
  getDefaultConfig({
    // Your dApps chains
    chains: [mainnet, sepolia],
    transports: {
      // RPC URL for each chain
      [mainnet.id]: http(
        `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`,
      ),
      [sepolia.id]: http(
        `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`,
      ),
    },

    // Required API Keys
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,

    // Required App Info
    appName: "Fame Lady Society",

    // Optional App Info
    appDescription: "The good place",
    appUrl: "https://fameladysociety.com", // your app's url
    appIcon: "https://fameladysociety.com/images/fls-wrap.gif",

    ssr: typeof window === "undefined",
  }),
);

const queryClient = new QueryClient();

export const Web3Provider: FC<PropsWithChildren> = ({ children }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <siweClient.Provider
          enabled={true} // defaults true
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
