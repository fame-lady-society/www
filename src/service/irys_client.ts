"use client";

import { WebUploader } from "@irys/web-upload";
import { WebBaseEth, WebEthereum } from "@irys/web-upload-ethereum";
import { ViemV2Adapter } from "@irys/web-upload-ethereum-viem-v2";
import type { PublicClient, WalletClient, Chain } from "viem";
import { sepolia } from "viem/chains";
import { createPublicClient, http } from "viem";

export const getIrysUploader = async (
  walletClient: WalletClient,
  publicClient: PublicClient,
) => {
  if (!walletClient.account) {
    throw new Error("Wallet client must have an account");
  }

  if (!walletClient.chain) {
    throw new Error("Wallet client must have a chain");
  }

  const chain = walletClient.chain;
  const chainId = chain.id;

  if (chainId !== 1 && chainId !== 8453) {
    throw new Error(
      `Unsupported chain: ${chain.name} (${chainId}). Irys supports Ethereum mainnet (1) and Base (8453)`,
    );
  }

  const sepoliaPublicClient = createPublicClient({
    chain: sepolia,
    transport: http(),
  });

  const WebEthClass = chainId === 1 ? WebEthereum : WebBaseEth;

  const irysUploader = await WebUploader(WebEthClass).withAdapter(
    ViemV2Adapter(walletClient, {
      publicClient: publicClient as unknown as typeof sepoliaPublicClient,
    }),
  );

  return irysUploader;
};
