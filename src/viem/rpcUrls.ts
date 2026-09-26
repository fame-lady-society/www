import type { Chain } from "viem";

// Non-public environment variables are read only during server execution.
// Browser callers always use the chain's credential-free public endpoints.
export function rpcUrls(chain: Chain): readonly string[] {
  if (typeof window !== "undefined") return chain.rpcUrls.default.http;
  const configured: Record<number, string | undefined> = {
    1: process.env.MAINNET_RPC_URL,
    8453: process.env.BASE_RPC_URL,
    137: process.env.POLYGON_RPC_URL,
    11155111: process.env.SEPOLIA_RPC_URL,
    84532: process.env.BASE_SEPOLIA_RPC_URL,
    80002: process.env.POLYGON_AMOY_RPC_URL,
  };
  const url = configured[chain.id]?.trim();
  return url ? [url] : chain.rpcUrls.default.http;
}
