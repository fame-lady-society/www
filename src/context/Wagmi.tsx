"use client";

import { siweClient } from "@/utils/siweClient";
import { SIWEConfig } from "connectkit";
import {
  WagmiProvider,
  createConfig,
  cookieStorage,
  createStorage,
} from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FC, PropsWithChildren, useMemo } from "react";
import { SiweMessage } from "siwe";
import {
  ConnectKitProvider,
  getDefaultConfig,
  getDefaultConnectors,
} from "connectkit";
import { Attribution } from "ox/erc8021";
import { Chain, Transport } from "viem";
import { chains as defaultChains } from "./wagmiConfig";
import {
  clearAuthSession,
  setAuthSession,
  withAuthHeaders,
} from "@/utils/authToken";

const SIWE_API_PATH = "/siwe";
const BASE_BUILDER_DATA_SUFFIX = Attribution.toDataSuffix({
  codes: ["bc_4pvfg2zb"],
});

export const defaultConfig = {
  // ...mainnetSepolia,
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

  storage: createStorage({
    storage: cookieStorage,
  }),
};

export const chains: readonly [Chain, ...Chain[]] = defaultChains;

const siweConfig = {
  getNonce: async () => {
    const res = await fetch(SIWE_API_PATH, { method: "PUT" });
    if (!res.ok) throw new Error("Failed to fetch SIWE nonce");
    return res.json().then((data) => data.nonce);
  },
  createMessage: ({ nonce, address, chainId }) => {
    return new SiweMessage({
      nonce,
      chainId,
      address,
      version: "1",
      uri: window.location.origin,
      domain: window.location.host,
      statement: "Sign In With Ethereum to prove you control this wallet.",
    }).prepareMessage();
  },
  verifyMessage: async ({ message, signature }) => {
    const res = await fetch(SIWE_API_PATH, {
      method: "POST",
      body: JSON.stringify({ message, signature }),
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return false;
    const body = (await res.json()) as {
      address: string;
      chainId: number;
      token?: string;
      expiresAt?: number;
    };
    if (body.token && body.expiresAt) {
      setAuthSession({ token: body.token, expiresAt: body.expiresAt });
    }
    return true;
  },
  getSession: async () => {
    const res = await fetch(SIWE_API_PATH, {
      headers: withAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch SIWE session");
    const { address, chainId, token, expiresAt } = await res.json();
    if (token && expiresAt) {
      setAuthSession({ token, expiresAt });
    }
    return address && chainId ? { address, chainId } : null;
  },
  signOut: async () => {
    const res = await fetch(SIWE_API_PATH, { method: "DELETE" });
    clearAuthSession();
    return res.ok;
  },
  signOutOnNetworkChange: false,
} satisfies SIWEConfig;

const queryClient = new QueryClient();

export const Web3Provider: FC<
  PropsWithChildren<{
    siwe?: boolean;
    transports?: Record<number, Transport>;
    chains: readonly [Chain, ...Chain[]];
  }>
> = ({ children, siwe = false, transports, chains }) => {
  const config = useMemo(() => {
    const connectors =
      typeof window === "undefined"
        ? []
        : [
            ...getDefaultConnectors({
              app: {
                name: defaultConfig.appName,
                icon: defaultConfig.appIcon,
                description: defaultConfig.appDescription,
                url: defaultConfig.appUrl,
              },
              walletConnectProjectId: defaultConfig.walletConnectProjectId,
            }),
          ];
    const config = getDefaultConfig({
      ...defaultConfig,
      multiInjectedProviderDiscovery: typeof window !== "undefined",
      ...(chains && chains.length && { chains }),
      ...(transports && { transports }),
      connectors,
    });

    return createConfig(
      Object.assign(config, {
        dataSuffix: BASE_BUILDER_DATA_SUFFIX,
      }),
    );
  }, [chains, transports]);
  // const initialState = cookieToInitialState(config, headers().get("cookie"));
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <siweClient.Provider
          enabled={siwe}
          nonceRefetchInterval={300000} // in milliseconds, defaults to 5 minutes
          sessionRefetchInterval={300000} // in milliseconds, defaults to 5 minutes
          signOutOnDisconnect={true} // defaults true
          signOutOnAccountChange={true} // defaults true
          {...siweConfig}
        >
          <ConnectKitProvider>{children}</ConnectKitProvider>
        </siweClient.Provider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
