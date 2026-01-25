"use client";

import { useMemo } from "react";
import { useReadContracts } from "wagmi";
import { sepolia, mainnet, baseSepolia } from "viem/chains";
import { keccak256, toHex } from "viem";
import {
  flsNamingAbi,
  flsNamingAddress,
  useReadFlsNamingResolveName,
  useReadFlsNamingGetIdentity,
  useReadFlsNamingGetVerifiedAddresses,
  useReadFlsNamingGetMetadata,
} from "@/wagmi";
import type { NetworkType } from "./useOwnedGateNftTokens";

export interface FullIdentity {
  tokenId: bigint;
  name: string;
  primaryAddress: `0x${string}`;
  primaryTokenId: bigint;
  verifiedAddresses: readonly `0x${string}`[];
  description: string;
  website: string;
}

// Standard metadata keys
export const METADATA_KEYS = {
  description: keccak256(toHex("description")),
  website: keccak256(toHex("website")),
} as const;

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

export function useIdentity(
  network: NetworkType,
  identifier: string | bigint | undefined
) {
  const chainId = getChainId(network);
  const contractAddress = flsNamingAddress[chainId as keyof typeof flsNamingAddress];

  // Determine if identifier is a name (string) or tokenId (bigint/number)
  const isNameLookup =
    typeof identifier === "string" && !/^\d+$/.test(identifier);
  const nameToResolve = isNameLookup ? identifier : undefined;
  const directTokenId =
    !isNameLookup && identifier !== undefined
      ? BigInt(identifier)
      : undefined;

  // Resolve name to tokenId if needed
  const { data: resolvedTokenId, isLoading: isResolvingName } =
    useReadFlsNamingResolveName({
      chainId,
      args: nameToResolve ? [nameToResolve] : undefined,
      query: {
        enabled: !!nameToResolve,
      },
    });

  const tokenId = directTokenId ?? resolvedTokenId;

  // Fetch identity data
  const { data: identityData, isLoading: isLoadingIdentity } =
    useReadFlsNamingGetIdentity({
      chainId,
      args: tokenId ? [tokenId] : undefined,
      query: {
        enabled: !!tokenId && tokenId !== 0n,
      },
    });

  // Fetch verified addresses
  const { data: verifiedAddresses, isLoading: isLoadingVerified } =
    useReadFlsNamingGetVerifiedAddresses({
      chainId,
      args: tokenId ? [tokenId] : undefined,
      query: {
        enabled: !!tokenId && tokenId !== 0n,
      },
    });

  // Fetch metadata (description and website)
  const metadataContracts = useMemo(() => {
    if (!contractAddress || !tokenId || tokenId === 0n) return [];
    return [
      {
        address: contractAddress,
        abi: flsNamingAbi,
        functionName: "getMetadata" as const,
        args: [tokenId, METADATA_KEYS.description] as const,
        chainId,
      },
      {
        address: contractAddress,
        abi: flsNamingAbi,
        functionName: "getMetadata" as const,
        args: [tokenId, METADATA_KEYS.website] as const,
        chainId,
      },
    ];
  }, [contractAddress, tokenId, chainId]);

  const { data: metadataResults, isLoading: isLoadingMetadata } =
    useReadContracts({
      contracts: metadataContracts,
      query: {
        enabled: metadataContracts.length > 0,
      },
    });

  const identity = useMemo<FullIdentity | null>(() => {
    if (!identityData || !tokenId) return null;

    const [name, primaryAddress, primaryTokenId] = identityData;

    // Check if identity exists (non-zero primary address)
    if (primaryAddress === "0x0000000000000000000000000000000000000000") {
      return null;
    }

    const description =
      metadataResults?.[0]?.status === "success"
        ? (metadataResults[0].result as string)
        : "";
    const website =
      metadataResults?.[1]?.status === "success"
        ? (metadataResults[1].result as string)
        : "";

    return {
      tokenId,
      name,
      primaryAddress,
      primaryTokenId,
      verifiedAddresses: verifiedAddresses ?? [],
      description,
      website,
    };
  }, [identityData, tokenId, verifiedAddresses, metadataResults]);

  return {
    identity,
    isLoading:
      isResolvingName ||
      isLoadingIdentity ||
      isLoadingVerified ||
      isLoadingMetadata,
    notFound: !isResolvingName && !isLoadingIdentity && !identity && !!identifier,
  };
}
