"use client";

import { creatorArtistMagicAddress } from "@/features/fame/contract";
import { creatorArtistMagicAbi } from "@/wagmi";
import { base } from "viem/chains";
import { useReadContract } from "wagmi";

// Role bit masks (OwnableRoles uses _ROLE_0 = 1 << 0, _ROLE_1 = 1 << 1, ...)
const ROLE_CREATOR = 1 << 1; // _ROLE_1
const ROLE_BANISHER = 1 << 2; // _ROLE_2
const ROLE_ART_POOL_MANAGER = 1 << 3; // _ROLE_3

export function useHasCreatorRole(address?: `0x${string}`) {
  // read raw roles bitmask from contract
  const { data: roles } = useReadContract({
    address: creatorArtistMagicAddress(base.id),
    abi: creatorArtistMagicAbi,
    functionName: "rolesOf",
    args: address ? [address] : undefined,
  });

  const bitmask =
    typeof roles === "bigint" ? Number(roles) : Number(roles ?? 0);

  return {
    isCreator: Boolean(bitmask & ROLE_CREATOR),
    isBanisher: Boolean(bitmask & ROLE_BANISHER),
    isArtPoolManager: Boolean(bitmask & ROLE_ART_POOL_MANAGER),
    raw: bitmask,
  };
}
