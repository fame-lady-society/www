"use client";

import { useQuery } from "@tanstack/react-query";
import {
  decodeFunctionResult,
  encodeFunctionData,
  isAddress,
  isAddressEqual,
  type Address,
  type Hex,
} from "viem";
import { base } from "viem/chains";
import { useBytecode, useConnectorClient } from "wagmi";
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
      reason:
        | "missing_code"
        | "runtime_mismatch"
        | "invalid_collection"
        | "collection_mismatch";
      message: string;
    };

export function evaluateAuctionExecutionIdentity({
  code,
  societyNft,
  expectedCode,
  expectedSocietyNft,
}: WalletAuctionIdentity & {
  expectedCode: Hex;
  expectedSocietyNft: string;
}): AuctionIdentityEvaluation {
  if (!/^0x0*[1-9a-f]/i.test(code)) {
    return {
      compatible: false,
      reason: "missing_code",
      message: "Your wallet provider cannot find this auction contract.",
    };
  }

  if (code.toLowerCase() !== expectedCode.toLowerCase()) {
    return {
      compatible: false,
      reason: "runtime_mismatch",
      message:
        "Your wallet provider is connected to a different auction environment.",
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

  if (!isAddressEqual(societyNft, expectedSocietyNft)) {
    return {
      compatible: false,
      reason: "collection_mismatch",
      message:
        "Your wallet provider is connected to a different auction environment.",
    };
  }

  return { compatible: true };
}

export async function readWalletAuctionIdentity(
  request: (
    input:
      | {
          method: "eth_getCode";
          params: [Address, "latest"];
        }
      | {
          method: "eth_call";
          params: [{ to: Address; data: Hex }, "latest"];
        },
  ) => Promise<unknown>,
  auctionAddress: Address,
  timeoutMs = 10_000,
): Promise<WalletAuctionIdentity> {
  const requestWithTimeout = <T>(request: Promise<T>) => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    return Promise.race([
      request,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error("Wallet provider verification timed out")),
          timeoutMs,
        );
      }),
    ]).finally(() => clearTimeout(timeout));
  };

  const code = await requestWithTimeout(
    request({
      method: "eth_getCode",
      params: [auctionAddress, "latest"],
    }),
  );
  if (typeof code !== "string" || !code.startsWith("0x")) {
    throw new Error("Wallet provider returned invalid contract code");
  }
  if (!/^0x0*[1-9a-f]/i.test(code)) {
    return { code: code as Hex, societyNft: null };
  }

  const callResult = await requestWithTimeout(
    request({
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
    }),
  );
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
  retry: () => Promise<void>;
  verify: () => Promise<boolean>;
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
  const appBytecode = useBytecode({
    address: auctionAddress ?? undefined,
    chainId: base.id,
    query: { enabled: auctionAddress !== null },
  });
  const walletIdentity = useQuery({
    queryKey: [
      "society-nft-auction",
      "wallet-identity",
      connectorClient.data?.key,
      connectorClient.data?.account.address,
      auctionAddress,
      appBytecode.data,
      expectedSocietyNft,
    ],
    enabled:
      canCheck &&
      connectorClient.data !== undefined &&
      appBytecode.data !== undefined,
    queryFn: async () => {
      if (
        !connectorClient.data ||
        !auctionAddress ||
        !appBytecode.data ||
        !expectedSocietyNft
      ) {
        throw new Error("Wallet auction identity is unavailable");
      }

      const identity = await readWalletAuctionIdentity(
        (request) => connectorClient.data!.request(request),
        auctionAddress,
      );
      return evaluateAuctionExecutionIdentity({
        ...identity,
        expectedCode: appBytecode.data,
        expectedSocietyNft,
      });
    },
    retry: false,
    staleTime: 15_000,
  });
  const identityError =
    connectorClient.error ?? appBytecode.error ?? walletIdentity.error;
  const environment = resolveAuctionExecutionEnvironment({
    isConnected,
    connectedChainId,
    hasExpectedIdentity:
      auctionAddress !== null &&
      expectedSocietyNft !== null &&
      appBytecode.data !== undefined,
    identityPending:
      canCheck &&
      (appBytecode.isPending ||
        connectorClient.isPending ||
        (connectorClient.data !== undefined && walletIdentity.isPending)),
    identity: walletIdentity.data ?? null,
    identityError,
  });

  return {
    environment,
    account,
    retry: async () => {
      await appBytecode.refetch();
      await connectorClient.refetch();
      await walletIdentity.refetch();
    },
    verify: async () => {
      try {
        const [codeResult, clientResult] = await Promise.all([
          appBytecode.refetch(),
          connectorClient.refetch(),
        ]);
        if (
          codeResult.error ||
          !codeResult.data ||
          clientResult.error ||
          !clientResult.data ||
          !auctionAddress ||
          !expectedSocietyNft
        ) {
          return false;
        }

        const identity = await readWalletAuctionIdentity(
          (request) => clientResult.data!.request(request),
          auctionAddress,
        );
        return evaluateAuctionExecutionIdentity({
          ...identity,
          expectedCode: codeResult.data,
          expectedSocietyNft,
        }).compatible;
      } catch {
        return false;
      }
    },
  };
}
