import { bulkMinterAddress } from "@/wagmi";
import { createPublicClient, createWalletClient, http, fallback } from "viem";
import { baseSepolia } from "viem/chains";
import { rpcUrls } from "./rpcUrls";

function transport() {
  return fallback(
    rpcUrls(baseSepolia).map((url) =>
      http(url, {
        batch: true,
        fetchOptions: { next: { revalidate: 60 } },
      }),
    ),
  );
}

export const client = createPublicClient({
  chain: baseSepolia,
  transport: transport(),
});
export const walletClient = createWalletClient({
  chain: baseSepolia,
  transport: transport(),
});

export const flsTokenAddress = bulkMinterAddress[baseSepolia.id];
