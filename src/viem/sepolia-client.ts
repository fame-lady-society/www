import { claimToFameFromNetwork } from "@/features/claim-to-fame/contracts";
import {
  wrappedNftAddress,
  namedLadyRendererAddress as namedLadyRendererAddressAll,
} from "@/wagmi";
import { createPublicClient, http, fallback, createWalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { parseRpcUrls } from "./rpcUrls";

const sepoliaRpcUrls = parseRpcUrls(
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_JSON,
  "NEXT_PUBLIC_SEPOLIA_RPC_JSON",
);

export const client = createPublicClient({
  transport: fallback([
    ...sepoliaRpcUrls.map((rpc) =>
      http(rpc, {
        batch: true,
        fetchOptions: {
          next: {
            revalidate: 60,
          },
        },
      }),
    ),
    http(`https://sepolia.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_KEY}`, {
      batch: true,
      fetchOptions: {
        next: {
          revalidate: 60,
        },
      },
    }),
    http(
      `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`,
      {
        batch: true,
        fetchOptions: {
          next: {
            revalidate: 60,
          },
        },
      },
    ),
  ]),
  chain: sepolia,
});

export const walletClient = createWalletClient({
  transport: fallback([
    ...sepoliaRpcUrls.map((rpc) =>
      http(rpc, {
        batch: true,
        fetchOptions: {
          next: {
            revalidate: 60,
          },
        },
      }),
    ),
    http(`https://sepolia.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_KEY}`, {
      batch: true,
      fetchOptions: {
        next: {
          revalidate: 60,
        },
      },
    }),
    http(
      `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`,
      {
        batch: true,
        fetchOptions: {
          next: {
            revalidate: 60,
          },
        },
      },
    ),
  ]),
  chain: sepolia,
});

export const createSignerAccount = () =>
  privateKeyToAccount(process.env.SEPOLIA_SIGNER_PRIVATE_KEY! as `0x${string}`);

export const flsTokenAddress = wrappedNftAddress[sepolia.id];
export const namedLadyRendererAddress = namedLadyRendererAddressAll[sepolia.id];
export const claimToFameAddress = claimToFameFromNetwork(sepolia.id);
