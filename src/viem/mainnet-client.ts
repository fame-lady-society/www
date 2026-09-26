import {
  fameLadySocietyAddress,
  namedLadyRendererAddress as namedLadyRendererAddressAll,
} from "@/wagmi";
import { createPublicClient, createWalletClient, http, fallback } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";
import { rpcUrls } from "./rpcUrls";

function transport() {
  return fallback(
    rpcUrls(mainnet).map((url) =>
      http(url, {
        batch: true,
        fetchOptions: { next: { revalidate: 60 } },
      }),
    ),
  );
}

export const client = createPublicClient({
  chain: mainnet,
  transport: transport(),
});
export const walletClient = createWalletClient({
  chain: mainnet,
  transport: transport(),
});

export const createSignerAccount = () =>
  privateKeyToAccount(process.env.MAINNET_SIGNER_PRIVATE_KEY! as `0x${string}`);

export const flsTokenAddress = fameLadySocietyAddress[mainnet.id];
export const namedLadyRendererAddress = namedLadyRendererAddressAll[mainnet.id];
