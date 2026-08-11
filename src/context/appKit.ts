"use client";

import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { cookieStorage, createStorage } from "wagmi";

import { baseRpcUrls, fameForkModeEnabled } from "@/viem/baseRpcUrls";
import { withFameForkRpc } from "./fameForkHarness";
import { chains, transports } from "./wagmiConfig";
import {
  APPKIT_METADATA,
  appKitFeatures,
  BASE_BUILDER_DATA_SUFFIX,
  requireWalletConnectProjectId,
} from "./appKitOptions";

export const appKitNetworks = withFameForkRpc(
  chains,
  fameForkModeEnabled() ? baseRpcUrls()[0] : null,
);

const projectId = requireWalletConnectProjectId();

export const wagmiAdapter = new WagmiAdapter({
  networks: [...appKitNetworks],
  projectId,
  transports,
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  multiInjectedProviderDiscovery: true,
  dataSuffix: BASE_BUILDER_DATA_SUFFIX,
});

export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks: [...appKitNetworks],
  defaultNetwork: appKitNetworks[0],
  projectId,
  metadata: APPKIT_METADATA,
  features: appKitFeatures,
  allWallets: "SHOW",
  enableWallets: true,
  enableEIP6963: true,
  enableCoinbase: true,
  enableBaseAccount: true,
  enableInjected: true,
  enableReconnect: true,
  enableNetworkSwitch: true,
  allowUnsupportedChain: false,
  coinbasePreference: "all",
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
