import { baseRpcUrls } from "@/viem/baseRpcUrls";
import { parseRpcUrls } from "@/viem/rpcUrls";
import { createPublicClient, http } from "viem";
import { base, baseSepolia, mainnet, sepolia } from "viem/chains";

const SIWE_RPC_TIMEOUT_MS = 5_000;

function firstConfiguredUrl(
  configured: string | undefined,
  fallbackUrl: string,
): string {
  return configured?.trim() || fallbackUrl;
}

function siweTransport(url: string) {
  return http(url, {
    batch: false,
    retryCount: 0,
    timeout: SIWE_RPC_TIMEOUT_MS,
  });
}

export const siweMainnetClient = createPublicClient({
  chain: mainnet,
  transport: siweTransport(
    firstConfiguredUrl(
      process.env.NEXT_PUBLIC_MAINNET_RPC_URL_1,
      mainnet.rpcUrls.default.http[0],
    ),
  ),
});

export const siweBaseClient = createPublicClient({
  chain: base,
  transport: siweTransport(baseRpcUrls()[0]),
});

export const siweSepoliaClient = createPublicClient({
  chain: sepolia,
  transport: siweTransport(
    parseRpcUrls(
      process.env.NEXT_PUBLIC_SEPOLIA_RPC_JSON,
      "NEXT_PUBLIC_SEPOLIA_RPC_JSON",
    )[0],
  ),
});

export const siweBaseSepoliaClient = createPublicClient({
  chain: baseSepolia,
  transport: siweTransport(
    parseRpcUrls(
      process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_JSON,
      "NEXT_PUBLIC_BASE_SEPOLIA_RPC_JSON",
    )[0],
  ),
});

export function getSiwePublicClient(chainId: number) {
  switch (chainId) {
    case mainnet.id:
      return siweMainnetClient;
    case base.id:
      return siweBaseClient;
    case sepolia.id:
      return siweSepoliaClient;
    case baseSepolia.id:
      return siweBaseSepoliaClient;
    default:
      return null;
  }
}
