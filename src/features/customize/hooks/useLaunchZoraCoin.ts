"use client";

import { useMutation } from "@tanstack/react-query";
import { useWalletClient } from "wagmi";
import {
  Address,
  encodeAbiParameters,
  encodeFunctionData,
  Hex,
  zeroAddress,
} from "viem";
import { base, mainnet } from "viem/chains";

import { useAccount } from "@/hooks/useAccount";
import { Transaction } from "@/features/wrap/types";
import { readContract } from "viem/actions";
import {
  fameLadySocietyAbi,
  fameLadySocietyAddress,
  zoraFactoryImplAbi,
} from "@/wagmi";
import { client } from "@/viem/mainnet-client";
import { IMetadata } from "@/utils/metadata";
import { fetchJson } from "@/ipfs/client";
import { createMetadataBuilder } from "@zoralabs/coins-sdk";
import { encodeDopplerMultiCurveUniV4 } from "@/service/zora/utils";
import { fameFromNetwork } from "@/features/fame/contract";

type LaunchParams = {
  tokenId: bigint | number;
  description: string;
  symbol: string;
  name: string;
};

type SerializedTx = {
  to: Address;
  data: Hex;
  value?: string | number | bigint;
};

export function useLaunchZoraCoin() {
  const { address, isSignedIn, signIn } = useAccount();
  const { data: walletClient } = useWalletClient({
    chainId: base.id,
  });

  return useMutation({
    mutationFn: async ({
      tokenId,
      description,
      symbol,
      name,
    }: LaunchParams): Promise<Transaction[]> => {
      if (!address) {
        throw new Error("Connect a wallet to launch a coin.");
      }

      if (!walletClient) {
        throw new Error("Wallet client unavailable. Please reconnect.");
      }

      if (!isSignedIn) {
        const signedIn = await signIn();
        if (!signedIn) {
          throw new Error("Sign-in required to launch a coin.");
        }
      }

      const tickLower = [-328_000, -200_000];
      const tickUpper = [-300_000, -100_000];
      const numDiscoveryPositions = [2, 2];
      const maxDiscoverySupplyShare = [0.1e18, 0.1e18].map((val) =>
        BigInt(val.toString()),
      );

      const args = [
        address,
        [address],
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/coin-it/metadata/${tokenId}`,
        name,
        symbol,
        encodeDopplerMultiCurveUniV4(
          fameFromNetwork(base.id),
          tickLower,
          tickUpper,
          numDiscoveryPositions,
          maxDiscoverySupplyShare,
        ),
        // platformReferrer,
        zeroAddress,
        // postDeployHook,
        zeroAddress,
        // postDeployHookData (bytes32),
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        // coinSalt,
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      ] as const;

      console.log(
        encodeFunctionData({
          abi: [
            {
              type: "function",
            },
          ],
          functionName: "deploy",
          args,
        }),
      );
      console.log(args);

      const hash = await walletClient.sendTransaction({
        to: "0x777777751622c0d3258f214F9DF38E35BF45baF3",
        data: encodeFunctionData({
          abi: [
            {
              type: "function",
              inputs: [
                {
                  name: "payoutRecipient",
                  internalType: "address",
                  type: "address",
                },
                {
                  name: "owners",
                  internalType: "address[]",
                  type: "address[]",
                },
                { name: "uri", internalType: "string", type: "string" },
                { name: "name", internalType: "string", type: "string" },
                { name: "symbol", internalType: "string", type: "string" },
                {
                  name: "poolConfig",
                  internalType: "bytes",
                  type: "bytes",
                },
                {
                  name: "platformReferrer",
                  internalType: "address",
                  type: "address",
                },
                {
                  name: "postDeployHook",
                  internalType: "address",
                  type: "address",
                },
                {
                  name: "postDeployHookData",
                  internalType: "bytes",
                  type: "bytes",
                },
                {
                  name: "coinSalt",
                  internalType: "bytes32",
                  type: "bytes32",
                },
              ],
              name: "deploy",
              outputs: [
                { name: "coin", internalType: "address", type: "address" },
                {
                  name: "postDeployHookDataOut",
                  internalType: "bytes",
                  type: "bytes",
                },
              ],
              value: 1_000_000n,
              stateMutability: "payable",
            },
          ],
          functionName: "deploy",
          args,
        }),
        chain: base,
        account: address,
      });

      return [
        {
          kind: "launch zora coin",
          hash,
        },
      ];

      // let result = await walletClient.getCallsStatus({
      //   id: batch.id,
      // });
      // while (result.status === "pending" || result.receipts?.length === 0) {
      //   await new Promise((resolve) => setTimeout(resolve, 500));
      //   result = await walletClient.getCallsStatus({
      //     id: batch.id,
      //   });
      // }
      // if (result.status !== "success") {
      //   throw new Error("Failed to launch zora coin.");
      // }
      // return (
      //   result.receipts?.map((transaction) => ({
      //     kind: "launch zora coin",
      //     hash: transaction.transactionHash,
      //   })) ?? []
      // );
    },
  });
}
