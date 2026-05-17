import { claimToFameFromNetwork } from "@/features/claim-to-fame/contracts";
import {
  bulkMinterAddress,
} from "@/wagmi";
import { createPublicClient, http, fallback, createWalletClient } from "viem";
import { baseSepolia } from "viem/chains";
import { parseRpcUrls } from "./rpcUrls";

const baseSepoliaRpcUrls = parseRpcUrls(
  process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_JSON,
  "NEXT_PUBLIC_BASE_SEPOLIA_RPC_JSON",
);

export const client = createPublicClient({
  transport: fallback([
    ...baseSepoliaRpcUrls.map((rpc) =>
      http(rpc, {
        batch: true,
        fetchOptions: {
          next: {
            revalidate: 60,
          },
        },
      }),
    ),
  ]),
  chain: baseSepolia,
});

export const walletClient = createWalletClient({
  transport: fallback([
    ...baseSepoliaRpcUrls.map((rpc) =>
      http(rpc, {
        batch: true,
        fetchOptions: {
          next: {
            revalidate: 60,
          },
        },
      }),
    ),
  ]),
  chain: baseSepolia,
});


export const flsTokenAddress = bulkMinterAddress[baseSepolia.id];
