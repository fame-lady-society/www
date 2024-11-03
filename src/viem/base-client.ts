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

export const client = createPublicClient({
  transport: fallback([
    http(process.env.NEXT_PUBLIC_BASE_RPC_URL_1, {
      batch: true,
      retryCount: 10,
    }),
    http(process.env.NEXT_PUBLIC_BASE_RPC_URL_2, {
      batch: true,
      retryCount: 10,
    }),
  ]),
  chain: base,
});

export const walletClient = createWalletClient({
  transport: fallback([
    http(process.env.NEXT_PUBLIC_BASE_RPC_URL_1, {
      batch: true,
      retryCount: 10,
    }),
    http(process.env.NEXT_PUBLIC_BASE_RPC_URL_2, {
      batch: true,
      retryCount: 10,
    }),
  ]),
  chain: base,
});

export const createSignerAccount = () =>
  privateKeyToAccount(process.env.BASE_SIGNER_PRIVATE_KEY! as `0x${string}`);

export const claimToFameAddress = claimToFameFromNetwork(base.id);
