"use client";

import { creatorArtistMagicAddress } from "@/features/fame/contract";
import { creatorArtistMagicAbi } from "@/wagmi";
import { base } from "viem/chains";
import { useReadContract } from "wagmi";

// Role bit masks (OwnableRoles uses _ROLE_0 = 1 << 0, _ROLE_1 = 1 << 1, ...)
const ROLE_CREATOR = 1n << 1n; // _ROLE_1
const ROLE_BANISHER = 1n << 2n; // _ROLE_2
const ROLE_ART_POOL_MANAGER = 1n << 3n; // _ROLE_3

export type CreatorPortalRoles = {
  isCreator: boolean;
  isBanisher: boolean;
  isArtPoolManager: boolean;
  hasAnyRole: boolean;
  raw: number;
};

export function decodeCreatorPortalRoles(roles?: bigint): CreatorPortalRoles {
  const bitmask = roles ?? 0n;
  const isCreator = (bitmask & ROLE_CREATOR) !== 0n;
  const isBanisher = (bitmask & ROLE_BANISHER) !== 0n;
  const isArtPoolManager = (bitmask & ROLE_ART_POOL_MANAGER) !== 0n;

  return {
    isCreator,
    isBanisher,
    isArtPoolManager,
    hasAnyRole: isCreator || isBanisher || isArtPoolManager,
    raw: Number(bitmask),
  };
}

export function useHasCreatorRole(address?: `0x${string}`) {
  // read raw roles bitmask from contract
  const rolesRead = useReadContract({
    chainId: base.id,
    address: creatorArtistMagicAddress(base.id),
    abi: creatorArtistMagicAbi,
    functionName: "rolesOf",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address),
    },
  });

  return {
    ...decodeCreatorPortalRoles(rolesRead.data),
    isLoading: rolesRead.isLoading,
    isPending: rolesRead.isPending,
    isError: rolesRead.isError,
    isSuccess: rolesRead.isSuccess,
    error: rolesRead.error,
    refetch: rolesRead.refetch,
  };
}
