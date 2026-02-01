import { sepolia, mainnet, baseSepolia } from "viem/chains";
import type { NetworkType } from "../hooks/useOwnedGateNftTokens";

export function getChainId(network: NetworkType) {
  switch (network) {
    case "sepolia":
      return sepolia.id;
    case "mainnet":
      return mainnet.id;
    case "base-sepolia":
      return baseSepolia.id;
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
}

export function resolveNetwork(
  network: string
): NetworkType | null {
  switch (network) {
    case "sepolia":
      return "sepolia";
    case "mainnet":
      return "mainnet";
    case "base-sepolia":
      return "base-sepolia";
    default:
      return null;
  }
}

export function parseIdentifier(identifier: string): string {
  return decodeURIComponent(identifier);
}

export function encodeIdentifier(name: string): string {
  return encodeURIComponent(name);
}
