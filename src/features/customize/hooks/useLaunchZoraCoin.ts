"use client";

import { useMutation } from "@tanstack/react-query";
import { useWalletClient, useWriteContract } from "wagmi";
import {
  Address,
  encodeAbiParameters,
  encodeFunctionData,
  Hex,
  zeroAddress,
} from "viem";
import { base, mainnet } from "viem/chains";
import { useWriteZoraFactoryImplDeploy } from "@/wagmi";
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
import {
  baseCommunityMultiSigAddress,
  fameFromNetwork,
} from "@/features/fame/contract";

type LaunchParams = {
  tokenId: bigint | number;
  symbol: string;
  name: string;
};

export function useLaunchZoraCoin() {
  const { address, isSignedIn, signIn } = useAccount();

  const { mutateAsync: deploy } = useWriteContract();

  return useMutation({
    mutationFn: async ({
      tokenId,
      symbol,
      name,
    }: LaunchParams): Promise<Transaction[]> => {
      if (!address) {
        throw new Error("Connect a wallet to launch a coin.");
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

      try {
        const hash = await deploy({
          address: "0x777777751622c0d3258f214F9DF38E35BF45baF3",
          abi: zoraFactoryImplAbi,
          functionName: "deploy",
          args: [
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
            baseCommunityMultiSigAddress,
            // postDeployHook,
            zeroAddress,
            // postDeployHookData,
            "0x",
            // coinSalt  (bytes32),
            "0x0000000000000000000000000000000000000000000000000000000000000000",
          ],
          chainId: base.id,
          account: address,
        });

        return [
          {
            kind: "launch zora coin",
            hash,
          },
        ];
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
  });
}
