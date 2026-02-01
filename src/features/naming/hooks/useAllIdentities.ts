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
import {
  SOCIAL_PROVIDERS,
  decodeAttestationV1,
  getSocialAttestationKey,
  type SocialProviderId,
} from "@/features/naming/attestations";

export interface Identity {
  tokenId: bigint;
  name: string;
  primaryAddress: `0x${string}`;
  primaryTokenId: bigint;
  socialHandles: Partial<Record<SocialProviderId, string>>;
}

function getChainId(network: NetworkType) {
  switch (network) {
    case "sepolia":
      return sepolia.id;
    case "mainnet":
      return mainnet.id;
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

  const metadataContracts = useMemo(() => {
    if (!contractAddress) return [];
    return tokenIds.flatMap((tokenId) =>
      SOCIAL_PROVIDERS.map((provider) => ({
        address: contractAddress,
        abi: flsNamingAbi,
        functionName: "getMetadata" as const,
        args: [tokenId, getSocialAttestationKey(provider)] as const,
        chainId,
      })),
    );
  }, [tokenIds, contractAddress, chainId]);

  const { data: identitiesData, isLoading: isLoadingIdentities } =
    useReadContracts({
      contracts,
      query: {
        enabled: contracts.length > 0,
      },
    });

  const { data: metadataResults, isLoading: isLoadingMetadata } =
    useReadContracts({
      contracts: metadataContracts,
      query: {
        enabled: metadataContracts.length > 0,
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

        const socialHandles: Partial<Record<SocialProviderId, string>> = {};
        const offset = index * SOCIAL_PROVIDERS.length;
        SOCIAL_PROVIDERS.forEach((provider, providerIndex) => {
          const metadataResult = metadataResults?.[offset + providerIndex];
          if (!metadataResult || metadataResult.status !== "success") return;
          if (typeof metadataResult.result !== "string") return;

          const attestation = decodeAttestationV1(metadataResult.result);
          if (attestation?.handle) {
            socialHandles[provider] = attestation.handle;
          }
        });

        return {
          tokenId: tokenIds[index],
          name,
          primaryAddress,
          primaryTokenId,
          socialHandles,
        };
      })
      .filter((identity): identity is Identity => identity !== null);
  }, [identitiesData, tokenIds, metadataResults]);

  return {
    identities,
    isLoading: isLoadingNextTokenId || isLoadingIdentities || isLoadingMetadata,
    totalCount: nextTokenId ? Number(nextTokenId) - 1 : 0,
  };
}
