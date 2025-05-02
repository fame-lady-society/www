import { claimToFameFromNetwork } from "@/features/claim-to-fame/contracts";
import {
  wrappedNftAddress,
  namedLadyRendererAddress as namedLadyRendererAddressAll,
} from "@/wagmi";
import { createPublicClient, http, fallback, createWalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

export const client = createPublicClient({
  transport: fallback([
    ...JSON.parse(process.env.NEXT_PUBLIC_SEPOLIA_RPC_JSON!).map((rpc) =>
      http(rpc, { batch: true }),
    ),
    http(`https://sepolia.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_KEY}`, {
      batch: true,
    }),
    http(
      `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`,
      {
        batch: true,
      },
    ),
  ]),
  chain: sepolia,
});

export const walletClient = createWalletClient({
  transport: fallback([
    ...JSON.parse(process.env.NEXT_PUBLIC_SEPOLIA_RPC_JSON!).map((rpc) =>
      http(rpc, { batch: true }),
    ),
    http(`https://sepolia.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_KEY}`, {
      batch: true,
    }),
    http(
      `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`,
      {
        batch: true,
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
