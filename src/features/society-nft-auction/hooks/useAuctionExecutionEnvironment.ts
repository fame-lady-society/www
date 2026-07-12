"use client";

import { useQuery } from "@tanstack/react-query";
import {
  decodeFunctionResult,
  encodeFunctionData,
  isAddress,
  type Address,
  type Hex,
} from "viem";
import { base } from "viem/chains";
import { useConnectorClient } from "wagmi";
import { useAccount } from "../../../hooks/useAccount";
import { needsConnectedChainSwitch } from "../../../utils/connectedChain";
import { societyNftAuctionAbi } from "../../../wagmi";

export interface WalletAuctionIdentity {
  code: Hex;
  societyNft: Address | null;
}

export type AuctionIdentityEvaluation =
  | { compatible: true }
  | {
      compatible: false;
      reason: "missing_code" | "invalid_collection" | "collection_mismatch";
      message: string;
    };

export function evaluateAuctionExecutionIdentity({
  code,
  societyNft,
  expectedSocietyNft,
}: WalletAuctionIdentity & {
  expectedSocietyNft: string;
}): AuctionIdentityEvaluation {
  if (!/^0x0*[1-9a-f]/i.test(code)) {
    return {
      compatible: false,
      reason: "missing_code",
      message: "Your wallet provider cannot find this auction contract.",
    };
  }

  if (
    typeof societyNft !== "string" ||
    !isAddress(societyNft) ||
    !isAddress(expectedSocietyNft)
  ) {
    return {
      compatible: false,
      reason: "invalid_collection",
      message: "Your wallet provider returned an invalid auction collection.",
    };
  }

  if (societyNft.toLowerCase() !== expectedSocietyNft.toLowerCase()) {
    return {
      compatible: false,
      reason: "collection_mismatch",
      message:
        "Your wallet provider is connected to a different auction environment.",
    };
  }

  return { compatible: true };
}

export type WalletRpcRequest = (input: {
  method: string;
  params?: readonly unknown[];
}) => Promise<unknown>;

export async function readWalletAuctionIdentity(
  request: WalletRpcRequest,
  auctionAddress: Address,
): Promise<WalletAuctionIdentity> {
  const code = await request({
    method: "eth_getCode",
    params: [auctionAddress, "latest"],
  });
  if (typeof code !== "string" || !code.startsWith("0x")) {
    throw new Error("Wallet provider returned invalid contract code");
  }
  if (!/^0x0*[1-9a-f]/i.test(code)) {
    return { code: code as Hex, societyNft: null };
  }

  const callResult = await request({
    method: "eth_call",
    params: [
      {
        to: auctionAddress,
        data: encodeFunctionData({
          abi: societyNftAuctionAbi,
          functionName: "SOCIETY_NFT",
        }),
      },
      "latest",
    ],
  });
  if (typeof callResult !== "string" || !callResult.startsWith("0x")) {
    throw new Error("Wallet provider returned an invalid auction identity");
  }

  const societyNft = decodeFunctionResult({
    abi: societyNftAuctionAbi,
    functionName: "SOCIETY_NFT",
    data: callResult as Hex,
  });

  return { code: code as Hex, societyNft };
}

export type AuctionExecutionEnvironment =
  | {
      status: "disconnected";
      canExecute: false;
      message: "Connect your wallet to bid.";
    }
  | {
      status: "wrong_chain";
      canExecute: false;
      message: "Switch your wallet to Base.";
    }
  | {
      status: "checking";
      canExecute: false;
      message: "Checking wallet auction environment…";
    }
  | {
      status: "incompatible" | "error";
      canExecute: false;
      message: string;
    }
  | {
      status: "ready";
      canExecute: true;
      message: "Wallet is ready.";
    };

export interface ResolveAuctionExecutionEnvironmentInput {
  isConnected: boolean;
  connectedChainId?: number;
  hasExpectedIdentity: boolean;
  identityPending: boolean;
  identity: AuctionIdentityEvaluation | null;
  identityError: unknown;
}

export function resolveAuctionExecutionEnvironment({
  isConnected,
  connectedChainId,
  hasExpectedIdentity,
  identityPending,
  identity,
  identityError,
}: ResolveAuctionExecutionEnvironmentInput): AuctionExecutionEnvironment {
  if (!isConnected) {
    return {
      status: "disconnected",
      canExecute: false,
      message: "Connect your wallet to bid.",
    };
  }
  if (
    needsConnectedChainSwitch({
      isConnected,
      connectedChainId,
      targetChainId: base.id,
    })
  ) {
    return {
      status: "wrong_chain",
      canExecute: false,
      message: "Switch your wallet to Base.",
    };
  }
  if (!hasExpectedIdentity || identityPending) {
    return {
      status: "checking",
      canExecute: false,
      message: "Checking wallet auction environment…",
    };
  }
  if (identityError) {
    return {
      status: "error",
      canExecute: false,
      message: "Your wallet provider could not verify this auction. Try again.",
    };
  }
  if (identity === null) {
    return {
      status: "checking",
      canExecute: false,
      message: "Checking wallet auction environment…",
    };
  }
  if (!identity.compatible) {
    return {
      status: "incompatible",
      canExecute: false,
      message: identity.message,
    };
  }

  return { status: "ready", canExecute: true, message: "Wallet is ready." };
}

export interface UseAuctionExecutionEnvironmentInput {
  auctionAddress: Address | null;
  expectedSocietyNft: Address | null;
}

export interface UseAuctionExecutionEnvironmentResult {
  environment: AuctionExecutionEnvironment;
  account: Address | undefined;
  connectedChainId: number | undefined;
  retry: () => Promise<void>;
}

export function useAuctionExecutionEnvironment({
  auctionAddress,
  expectedSocietyNft,
}: UseAuctionExecutionEnvironmentInput): UseAuctionExecutionEnvironmentResult {
  const {
    address: account,
    isConnected,
    chainId: connectedChainId,
  } = useAccount();
  const correctChain =
    isConnected &&
    !needsConnectedChainSwitch({
      isConnected,
      connectedChainId,
      targetChainId: base.id,
    });
  const canCheck =
    correctChain && auctionAddress !== null && expectedSocietyNft !== null;
  const connectorClient = useConnectorClient({
    chainId: base.id,
    query: { enabled: canCheck },
  });
  const walletIdentity = useQuery({
    queryKey: [
      "society-nft-auction",
      "wallet-identity",
      connectorClient.data?.key,
      connectorClient.data?.account.address,
      auctionAddress,
      expectedSocietyNft,
    ],
    enabled: canCheck && connectorClient.data !== undefined,
    queryFn: async () => {
      if (!connectorClient.data || !auctionAddress || !expectedSocietyNft) {
        throw new Error("Wallet auction identity is unavailable");
      }

      const identity = await readWalletAuctionIdentity(
        (request) => connectorClient.data!.request(request as never),
        auctionAddress,
      );
      return evaluateAuctionExecutionIdentity({
        ...identity,
        expectedSocietyNft,
      });
    },
    retry: false,
    staleTime: 15_000,
  });
  const identityError = connectorClient.error ?? walletIdentity.error;
  const environment = resolveAuctionExecutionEnvironment({
    isConnected,
    connectedChainId,
    hasExpectedIdentity: auctionAddress !== null && expectedSocietyNft !== null,
    identityPending:
      canCheck &&
      (connectorClient.isPending ||
        (connectorClient.data !== undefined && walletIdentity.isPending)),
    identity: walletIdentity.data ?? null,
    identityError,
  });

  return {
    environment,
    account,
    connectedChainId,
    retry: async () => {
      await connectorClient.refetch();
      await walletIdentity.refetch();
    },
  };
}
