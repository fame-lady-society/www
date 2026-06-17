"use client";

import { creatorArtistMagicAddress } from "@/features/fame/contract";
import {
  decodeCreatorPortalRoles,
  type CreatorPortalRoles,
} from "@/features/fame/creatorMetadata";
import { creatorArtistMagicAbi } from "@/wagmi";
import { base } from "viem/chains";
import { useReadContract } from "wagmi";

export { decodeCreatorPortalRoles };
export type { CreatorPortalRoles };

function redactUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    return `${url.protocol}//${url.host}/...`;
  } catch {
    return "[redacted url]";
  }
}

export function formatCreatorRoleReadError(error: unknown) {
  const maybeViemError = error as
    | {
        message?: unknown;
        shortMessage?: unknown;
      }
    | undefined;
  const message =
    typeof maybeViemError?.shortMessage === "string"
      ? maybeViemError.shortMessage
      : typeof maybeViemError?.message === "string"
        ? maybeViemError.message
        : typeof error === "string"
          ? error
          : undefined;

  if (!message) return undefined;

  return message
    .replace(/https?:\/\/[^\s)]+/g, redactUrl)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 280);
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
    errorMessage: formatCreatorRoleReadError(rolesRead.error),
    refetch: rolesRead.refetch,
  };
}
