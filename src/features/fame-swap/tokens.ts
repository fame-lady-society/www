import type { Address } from "viem";
import { NATIVE_ETH_ADDRESS } from "./router/types";

export const FAME =
  "0xf307e242bfe1ec1ff01a4cef2fdaa81b10a52418" as const satisfies Address;
export const USDC =
  "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913" as const satisfies Address;
export const WETH =
  "0x4200000000000000000000000000000000000006" as const satisfies Address;
export const NATIVE_ETH = NATIVE_ETH_ADDRESS;

export type FameSwapTokenSymbol = "FAME" | "USDC" | "WETH" | "ETH";

export interface FameSwapToken {
  symbol: FameSwapTokenSymbol;
  label: string;
  address: Address;
  decimals: number;
  native: boolean;
}

export const FAME_SWAP_TOKENS: readonly FameSwapToken[] = [
  {
    symbol: "FAME",
    label: "FAME",
    address: FAME,
    decimals: 18,
    native: false,
  },
  {
    symbol: "USDC",
    label: "USDC",
    address: USDC,
    decimals: 6,
    native: false,
  },
  {
    symbol: "WETH",
    label: "Wrapped ETH",
    address: WETH,
    decimals: 18,
    native: false,
  },
  {
    symbol: "ETH",
    label: "Native ETH",
    address: NATIVE_ETH,
    decimals: 18,
    native: true,
  },
] as const;

export function tokenForAddress(address: Address): FameSwapToken | undefined {
  const normalized = address.toLowerCase();
  return FAME_SWAP_TOKENS.find(
    (token) => token.address.toLowerCase() === normalized,
  );
}

export function tokenSymbolForAddress(address: Address): FameSwapTokenSymbol {
  return tokenForAddress(address)?.symbol ?? "FAME";
}
