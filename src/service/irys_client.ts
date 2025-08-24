"use client";

import { WebUploader } from "@irys/web-upload";
import { WebBaseEth } from "@irys/web-upload-ethereum";
import { ViemV2Adapter } from "@irys/web-upload-ethereum-viem-v2";
import { createPublicClient, createWalletClient, custom } from "viem";
import { base, sepolia } from "viem/chains";

export const getIrysUploader = async () => {
  const [account] = await window.ethereum.request({
    method: "eth_requestAccounts",
  });

  const provider = createWalletClient({
    account,
    chain: base,
    transport: custom(window.ethereum),
  });

  const publicClient = createPublicClient({
    chain: base,
    transport: custom(window.ethereum),
  });

  const sepoliaPublicClient = createPublicClient({
    chain: sepolia,
    transport: custom(window.ethereum),
  });

  const irysUploader = await WebUploader(WebBaseEth).withAdapter(
    ViemV2Adapter(provider, {
      publicClient: publicClient as unknown as typeof sepoliaPublicClient,
    }),
  );

  return irysUploader;
};
