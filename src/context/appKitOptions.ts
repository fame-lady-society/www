import type { AppKitOptions } from "@reown/appkit/react";
import { Attribution } from "ox/erc8021";

export const APPKIT_METADATA = {
  name: "Fame Lady Society",
  description: "The good place",
  url: "https://www.fameladysociety.com",
  icons: ["https://www.fameladysociety.com/images/fame/bala.png"],
} satisfies NonNullable<AppKitOptions["metadata"]>;

export const BASE_BUILDER_DATA_SUFFIX = Attribution.toDataSuffix({
  codes: ["bc_4pvfg2zb"],
});

export function requireWalletConnectProjectId(
  value = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
): string {
  if (!value?.trim()) {
    throw new Error(
      "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is required to initialize Reown AppKit.",
    );
  }
  return value.trim();
}

export const appKitFeatures = {
  swaps: false,
  onramp: false,
  email: false,
  socials: false,
  analytics: false,
  history: false,
  connectMethodsOrder: ["wallet"],
} as const satisfies NonNullable<AppKitOptions["features"]>;
