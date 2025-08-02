"use client";

import { creatorArtistMagicAddress } from "@/features/fame/contract";
import { creatorArtistMagicAbi } from "@/wagmi";
import { base } from "viem/chains";
import { useReadContract } from "wagmi";

export function useHasCreatorRole(address?: `0x${string}`) {
  const { data: role } = useReadContract({
    address: creatorArtistMagicAddress(base.id),
    abi: creatorArtistMagicAbi,
    functionName: "hasAllRoles",
    args: address ? [address, 3n] : undefined,
  });

  return role;
}
