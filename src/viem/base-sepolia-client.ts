import { claimToFameFromNetwork } from "@/features/claim-to-fame/contracts";
import {
  bulkMinterAddress,
} from "@/wagmi";
import { createPublicClient, http, fallback, createWalletClient } from "viem";
import { baseSepolia } from "viem/chains";

export const client = createPublicClient({
  transport: fallback([
    ...JSON.parse(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_JSON!).map((rpc) =>
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
    ...JSON.parse(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_JSON!).map((rpc) =>
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
