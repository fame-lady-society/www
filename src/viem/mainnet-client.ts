import {
  fameLadySocietyAddress,
  namedLadyRendererAddress as namedLadyRendererAddressAll,
} from "@/wagmi";
import { createPublicClient, http, fallback, createWalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";

export const client = createPublicClient({
  transport: fallback([
    http(`https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`, {
      batch: true,
    }),
    http(
      `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`,
      {
        batch: true,
      },
    ),
  ]),
  chain: mainnet,
});

export const walletClient = createWalletClient({
  transport: fallback([
    http(`https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`, {
      batch: true,
    }),
    http(
      `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`,
      {
        batch: true,
      },
    ),
  ]),
  chain: mainnet,
});

export const createSignerAccount = () =>
  privateKeyToAccount(process.env.MAINNET_SIGNER_PRIVATE_KEY! as `0x${string}`);

export const flsTokenAddress = fameLadySocietyAddress[mainnet.id];
export const namedLadyRendererAddress = undefined; //namedLadyRendererAddressAll[mainnet.id];
