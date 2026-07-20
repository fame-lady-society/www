"use client";

import { useQuery } from "@tanstack/react-query";
import {
  decodeFunctionResult,
  encodeFunctionData,
  isHex,
  type Address,
  type Hex,
} from "viem";
import { base } from "viem/chains";
import { useConnectorClient } from "wagmi";
import { useAccount } from "../../../hooks/useAccount";
import { needsConnectedChainSwitch } from "../../../utils/connectedChain";
import { fameBurnPoolRotatorAbi } from "../../../wagmi";
import {
  evaluateRotatorExecutionIdentity,
  type RotatorIdentityEvaluation,
  type WalletRotatorIdentity,
} from "../config";

export type { RotatorIdentityEvaluation, WalletRotatorIdentity };

export type WalletProviderRequest = (
  input:
    | {
        method: "eth_getCode";
        params: [Address, "latest"];
      }
    | {
        method: "eth_call";
        params: [{ to: Address; data: Hex }, "latest"];
      },
) => Promise<unknown>;

/**
 * Read rotator runtime code plus immutable `fame()` / `mirror()` getters
 * exclusively through the wallet connector provider.
 */
export async function readWalletRotatorIdentity(
  request: WalletProviderRequest,
  rotatorAddress: Address,
  timeoutMs = 10_000,
): Promise<WalletRotatorIdentity> {
  const requestWithTimeout = <T>(pending: Promise<T>): Promise<T> => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    return Promise.race([
      pending,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error("Wallet provider verification timed out")),
          timeoutMs,
        );
      }),
    ]).finally(() => {
      if (timeout !== undefined) clearTimeout(timeout);
    });
  };

  const code = await requestWithTimeout(
    request({
      method: "eth_getCode",
      params: [rotatorAddress, "latest"],
    }),
  );
  if (typeof code !== "string" || !isHex(code)) {
    throw new Error("Wallet provider returned invalid contract code");
  }

  if (!/^0x0*[1-9a-f]/i.test(code)) {
    return { code, fame: null, mirror: null };
  }

  const fameCall = await requestWithTimeout(
    request({
      method: "eth_call",
      params: [
        {
          to: rotatorAddress,
          data: encodeFunctionData({
            abi: fameBurnPoolRotatorAbi,
            functionName: "fame",
          }),
        },
        "latest",
      ],
    }),
  );
  if (typeof fameCall !== "string" || !isHex(fameCall)) {
    throw new Error("Wallet provider returned an invalid FAME identity");
  }

  const mirrorCall = await requestWithTimeout(
    request({
      method: "eth_call",
      params: [
        {
          to: rotatorAddress,
          data: encodeFunctionData({
            abi: fameBurnPoolRotatorAbi,
            functionName: "mirror",
          }),
        },
        "latest",
      ],
    }),
  );
  if (typeof mirrorCall !== "string" || !isHex(mirrorCall)) {
    throw new Error("Wallet provider returned an invalid Society identity");
  }

  const fame = decodeFunctionResult({
    abi: fameBurnPoolRotatorAbi,
    functionName: "fame",
    data: fameCall,
  });
  const mirror = decodeFunctionResult({
    abi: fameBurnPoolRotatorAbi,
    functionName: "mirror",
    data: mirrorCall,
  });

  return { code, fame, mirror };
}

export type FameRotatorExecutionEnvironment =
  | {
      status: "disconnected";
      canExecute: false;
      message: "Connect your wallet to rotate.";
    }
  | {
      status: "wrong_chain";
      canExecute: false;
      message: "Switch your wallet to Base.";
    }
  | {
      status: "checking";
      canExecute: false;
      message: "Checking wallet rotator environment…";
    }
  | {
      status: "incompatible" | "error";
      canExecute: false;
      message: string;
    }
  | {
      status: "ready";
      canExecute: true;
      message: undefined;
    };

export interface ResolveFameRotatorExecutionEnvironmentInput {
  isConnected: boolean;
  connectedChainId?: number;
  hasExpectedIdentity: boolean;
  identityPending: boolean;
  identity: RotatorIdentityEvaluation | null;
  identityError: unknown;
}

export function resolveFameRotatorExecutionEnvironment({
  isConnected,
  connectedChainId,
  hasExpectedIdentity,
  identityPending,
  identity,
  identityError,
}: ResolveFameRotatorExecutionEnvironmentInput): FameRotatorExecutionEnvironment {
  if (!isConnected) {
    return {
      status: "disconnected",
      canExecute: false,
      message: "Connect your wallet to rotate.",
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
      message: "Checking wallet rotator environment…",
    };
  }
  if (identityError) {
    return {
      status: "error",
      canExecute: false,
      message:
        "Your wallet provider could not verify this rotator. Try again.",
    };
  }
  if (identity === null) {
    return {
      status: "checking",
      canExecute: false,
      message: "Checking wallet rotator environment…",
    };
  }
  if (!identity.compatible) {
    return {
      status: "incompatible",
      canExecute: false,
      message: identity.message,
    };
  }

  return { status: "ready", canExecute: true, message: undefined };
}

export interface UseFameRotatorExecutionEnvironmentInput {
  rotatorAddress: Address | null;
  expectedRuntimeBytecode: Hex | null;
  expectedFame: Address | null;
  expectedMirror: Address | null;
}

export interface UseFameRotatorExecutionEnvironmentResult {
  environment: FameRotatorExecutionEnvironment;
  account: Address | undefined;
  retry: () => Promise<void>;
  verify: () => Promise<boolean>;
}

/**
 * Wallet-provider identity gate for approval and rotation writes.
 * Compares connector-read code + fame()/mirror() against the pinned Base
 * deployment fingerprint and expected immutable getters (R25 / KTD15).
 */
export function useFameRotatorExecutionEnvironment({
  rotatorAddress,
  expectedRuntimeBytecode,
  expectedFame,
  expectedMirror,
}: UseFameRotatorExecutionEnvironmentInput): UseFameRotatorExecutionEnvironmentResult {
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
    correctChain &&
    rotatorAddress !== null &&
    expectedRuntimeBytecode !== null &&
    expectedFame !== null &&
    expectedMirror !== null;

  const connectorClient = useConnectorClient({
    chainId: base.id,
    query: { enabled: canCheck },
  });

  const walletIdentity = useQuery({
    queryKey: [
      "fame-rotator",
      "wallet-identity",
      connectorClient.data?.key,
      connectorClient.data?.account.address,
      rotatorAddress,
      expectedRuntimeBytecode,
      expectedFame,
      expectedMirror,
    ],
    enabled: canCheck && connectorClient.data !== undefined,
    queryFn: async (): Promise<RotatorIdentityEvaluation> => {
      const client = connectorClient.data;
      if (
        !client ||
        !rotatorAddress ||
        !expectedRuntimeBytecode ||
        !expectedFame ||
        !expectedMirror
      ) {
        throw new Error("Wallet rotator identity is unavailable");
      }

      const identity = await readWalletRotatorIdentity(
        (input) => client.request(input),
        rotatorAddress,
      );
      return evaluateRotatorExecutionIdentity({
        ...identity,
        expectedRuntimeBytecode,
        expectedFame,
        expectedMirror,
      });
    },
    retry: false,
    staleTime: 15_000,
  });

  const identityError = connectorClient.error ?? walletIdentity.error;
  const environment = resolveFameRotatorExecutionEnvironment({
    isConnected,
    connectedChainId,
    hasExpectedIdentity:
      rotatorAddress !== null &&
      expectedRuntimeBytecode !== null &&
      expectedFame !== null &&
      expectedMirror !== null,
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
    retry: async () => {
      await connectorClient.refetch();
      await walletIdentity.refetch();
    },
    verify: async () => {
      try {
        const clientResult = await connectorClient.refetch();
        const client = clientResult.data;
        if (
          clientResult.error ||
          !client ||
          !rotatorAddress ||
          !expectedRuntimeBytecode ||
          !expectedFame ||
          !expectedMirror
        ) {
          return false;
        }

        const identity = await readWalletRotatorIdentity(
          (input) => client.request(input),
          rotatorAddress,
        );
        return evaluateRotatorExecutionIdentity({
          ...identity,
          expectedRuntimeBytecode,
          expectedFame,
          expectedMirror,
        }).compatible;
      } catch {
        return false;
      }
    },
  };
}
