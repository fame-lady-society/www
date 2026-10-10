import { fallback, http } from "wagmi";
import {
  base,
  mainnet,
  polygon,
  polygonAmoy,
  sepolia,
  baseSepolia,
} from "wagmi/chains";
import type { Chain, Transport } from "viem";
import { baseRpcUrls } from "@/viem/baseRpcUrls";

export const chains: readonly [Chain, ...Chain[]] = [
  mainnet,
  base,
  polygon,
  sepolia,
  baseSepolia,
  polygonAmoy,
] as const;

// This configuration also executes during SSR. Never read paid server RPC
// settings here: Reown and browser transports always use public endpoints.
export const transports: Record<number, Transport> = Object.fromEntries(
  chains.map((chain) => [
    chain.id,
    fallback(
      (chain.id === base.id ? baseRpcUrls() : chain.rpcUrls.default.http).map(
        (url) => http(url, { batch: true }),
      ),
    ),
  ]),
);
