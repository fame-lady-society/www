import { baseServerRpcUrl } from "@/viem/baseRpcUrls";
import { rpcUrls } from "@/viem/rpcUrls";
import { createPublicClient, http } from "viem";
import { base, baseSepolia, mainnet, sepolia } from "viem/chains";

const SIWE_RPC_TIMEOUT_MS = 5_000;

function siweTransport(url: string) {
  return http(url, {
    batch: false,
    retryCount: 0,
    timeout: SIWE_RPC_TIMEOUT_MS,
  });
}

export const siweMainnetClient = createPublicClient({
  chain: mainnet,
  transport: siweTransport(rpcUrls(mainnet)[0]),
});
export const siweBaseClient = createPublicClient({
  chain: base,
  transport: siweTransport(baseServerRpcUrl() ?? base.rpcUrls.default.http[0]),
});
export const siweSepoliaClient = createPublicClient({
  chain: sepolia,
  transport: siweTransport(rpcUrls(sepolia)[0]),
});
export const siweBaseSepoliaClient = createPublicClient({
  chain: baseSepolia,
  transport: siweTransport(rpcUrls(baseSepolia)[0]),
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
