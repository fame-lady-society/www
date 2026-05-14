import type { Address } from "viem";
import { FAME, NATIVE_ETH, USDC, WETH, tokenForAddress } from "../tokens";
import {
  routeTokenVisualAssetForAddress,
  type FameSwapRouteAssetStatus,
} from "./routeAssets";

export interface FameRouteTokenMetadata {
  address: Address;
  symbol: string;
  label: string;
  iconLabel: string;
  iconBackground: string;
  iconForeground: string;
  imageSrc: string | null;
  imageAlt: string | null;
  imageStatus: FameSwapRouteAssetStatus;
  imageProvenance: string;
  known: boolean;
}

type FameKnownRouteTokenMetadata = Omit<
  FameRouteTokenMetadata,
  | "address"
  | "imageAlt"
  | "imageProvenance"
  | "imageSrc"
  | "imageStatus"
  | "known"
>;

export const ZORA =
  "0x1111111111166b7fe7bd91427724b487980afc69" as const satisfies Address;
export const BASEDFLICK =
  "0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926" as const satisfies Address;
export const FRXUSD =
  "0xe5020a6d073a794b6e7f05678707de47986fb0b6" as const satisfies Address;
export const SCALE =
  "0x54016a4848a38f257b6e96331f7404073fd9c32c" as const satisfies Address;

const ROUTE_TOKEN_METADATA = {
  [FAME.toLowerCase()]: {
    symbol: "FAME",
    label: "FAME",
    iconLabel: "FM",
    iconBackground: "#ec4899",
    iconForeground: "#ffffff",
  },
  [USDC.toLowerCase()]: {
    symbol: "USDC",
    label: "USD Coin",
    iconLabel: "US",
    iconBackground: "#2775ca",
    iconForeground: "#ffffff",
  },
  [WETH.toLowerCase()]: {
    symbol: "WETH",
    label: "Wrapped ETH",
    iconLabel: "WE",
    iconBackground: "#627eea",
    iconForeground: "#ffffff",
  },
  [NATIVE_ETH.toLowerCase()]: {
    symbol: "ETH",
    label: "Native ETH",
    iconLabel: "ET",
    iconBackground: "#3c3c3d",
    iconForeground: "#ffffff",
  },
  [ZORA.toLowerCase()]: {
    symbol: "ZORA",
    label: "ZORA",
    iconLabel: "ZO",
    iconBackground: "#111111",
    iconForeground: "#ffffff",
  },
  [BASEDFLICK.toLowerCase()]: {
    symbol: "basedflick",
    label: "basedflick",
    iconLabel: "BF",
    iconBackground: "#008a5c",
    iconForeground: "#ffffff",
  },
  [FRXUSD.toLowerCase()]: {
    symbol: "frxUSD",
    label: "Frax USD",
    iconLabel: "FX",
    iconBackground: "#f4b400",
    iconForeground: "#111111",
  },
  [SCALE.toLowerCase()]: {
    symbol: "SCALE",
    label: "Scale",
    iconLabel: "SC",
    iconBackground: "#4f46e5",
    iconForeground: "#ffffff",
  },
} as const satisfies Record<string, FameKnownRouteTokenMetadata>;

function shortAddress(address: Address): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function routeTokenMetadataForAddress(
  address: Address,
): FameRouteTokenMetadata {
  const normalized = address.toLowerCase();
  const known = ROUTE_TOKEN_METADATA[normalized];
  if (known) {
    const visualAsset = routeTokenVisualAssetForAddress(address);

    return {
      ...known,
      ...visualAsset,
      address,
      known: true,
    };
  }

  const appToken = tokenForAddress(address);
  if (appToken) {
    const visualAsset = routeTokenVisualAssetForAddress(address);

    return {
      address,
      symbol: appToken.symbol,
      label: appToken.label,
      iconLabel: appToken.symbol.slice(0, 2),
      iconBackground: "#64748b",
      iconForeground: "#ffffff",
      ...visualAsset,
      known: true,
    };
  }

  const visualAsset = routeTokenVisualAssetForAddress(address);

  return {
    address,
    symbol: shortAddress(address),
    label: shortAddress(address),
    iconLabel: "??",
    iconBackground: "#64748b",
    iconForeground: "#ffffff",
    ...visualAsset,
    known: false,
  };
}
