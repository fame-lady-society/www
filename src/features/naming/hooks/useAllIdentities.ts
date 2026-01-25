"use client";

import { useMemo } from "react";
import { useReadContracts } from "wagmi";
import { sepolia, mainnet, baseSepolia } from "viem/chains";
import {
  flsNamingAbi,
  flsNamingAddress,
  useReadFlsNamingNextTokenId,
} from "@/wagmi";
import type { NetworkType } from "./useOwnedGateNftTokens";

export interface Identity {
  tokenId: bigint;
  name: string;
  primaryAddress: `0x${string}`;
  primaryTokenId: bigint;
}

function getChainId(network: NetworkType) {
  switch (network) {
    case "sepolia":
      return sepolia.id;
    // case "mainnet":
    //   return mainnet.id;
    case "base-sepolia":
      return baseSepolia.id;
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
}

export function useAllIdentities(network: NetworkType) {
  const chainId = getChainId(network);
  const contractAddress = flsNamingAddress[chainId as keyof typeof flsNamingAddress];

  const { data: nextTokenId, isLoading: isLoadingNextTokenId } =
    useReadFlsNamingNextTokenId({
      chainId,
    });

  const tokenIds = useMemo(() => {
    if (!nextTokenId || nextTokenId <= 1n) return [];
    const ids: bigint[] = [];
    for (let i = 1n; i < nextTokenId; i++) {
      ids.push(i);
    }
    return ids;
  }, [nextTokenId]);

  const contracts = useMemo(() => {
    if (!contractAddress) return [];
    return tokenIds.map((tokenId) => ({
      address: contractAddress,
      abi: flsNamingAbi,
      functionName: "getIdentity" as const,
      args: [tokenId] as const,
      chainId,
    }));
  }, [tokenIds, contractAddress, chainId]);

  const { data: identitiesData, isLoading: isLoadingIdentities } =
    useReadContracts({
      contracts,
      query: {
        enabled: contracts.length > 0,
      },
    });

  const identities = useMemo<Identity[]>(() => {
    if (!identitiesData) return [];

    return identitiesData
      .map((result, index) => {
        if (result.status !== "success" || !result.result) return null;
        const [name, primaryAddress, primaryTokenId] = result.result as [
          string,
          `0x${string}`,
          bigint
        ];
        // Filter out burned identities (primaryAddress is zero)
        if (primaryAddress === "0x0000000000000000000000000000000000000000") {
          return null;
        }
        return {
          tokenId: tokenIds[index],
          name,
          primaryAddress,
          primaryTokenId,
        };
      })
      .filter((identity): identity is Identity => identity !== null);
  }, [identitiesData, tokenIds]);

  return {
    identities,
    isLoading: isLoadingNextTokenId || isLoadingIdentities,
    totalCount: nextTokenId ? Number(nextTokenId) - 1 : 0,
  };
}
