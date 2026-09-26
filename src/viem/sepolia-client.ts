import { claimToFameFromNetwork } from "@/features/claim-to-fame/contracts";
import {
  wrappedNftAddress,
  namedLadyRendererAddress as namedLadyRendererAddressAll,
} from "@/wagmi";
import { createPublicClient, createWalletClient, http, fallback } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { rpcUrls } from "./rpcUrls";

function transport() {
  return fallback(
    rpcUrls(sepolia).map((url) =>
      http(url, {
        batch: true,
        fetchOptions: { next: { revalidate: 60 } },
      }),
    ),
  );
}

export const client = createPublicClient({
  chain: sepolia,
  transport: transport(),
});
export const walletClient = createWalletClient({
  chain: sepolia,
  transport: transport(),
});

export const createSignerAccount = () =>
  privateKeyToAccount(process.env.SEPOLIA_SIGNER_PRIVATE_KEY! as `0x${string}`);

export const flsTokenAddress = wrappedNftAddress[sepolia.id];
export const namedLadyRendererAddress = namedLadyRendererAddressAll[sepolia.id];
export const claimToFameAddress = claimToFameFromNetwork(sepolia.id);
