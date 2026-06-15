import { claimToFameFromNetwork } from "@/features/claim-to-fame/contracts";
import {
  createPublicClient,
  http,
  fallback,
  createWalletClient,
  HttpTransportConfig,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { baseRpcUrls } from "./baseRpcUrls";

const baseRpcTransportConfig = {
  batch: true,
  retryCount: 10,
  fetchOptions: {
    next: {
      revalidate: 60,
    },
  },
} satisfies HttpTransportConfig;

function createBaseRpcTransports() {
  return baseRpcUrls().map((rpc) => http(rpc, baseRpcTransportConfig));
}

export const client = createPublicClient({
  transport: fallback(createBaseRpcTransports()),
  chain: base,
  batch: {
    multicall: true,
  },
});

export const walletClient = createWalletClient({
  transport: fallback(createBaseRpcTransports()),
  chain: base,
});

export const createSignerAccount = () =>
  privateKeyToAccount(process.env.BASE_SIGNER_PRIVATE_KEY! as `0x${string}`);

export const claimToFameAddress = claimToFameFromNetwork(base.id);
