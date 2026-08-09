"use client";

import { useQuery, type QueryClient } from "@tanstack/react-query";
import { isAddressEqual, type Address } from "viem";
import { useConnection, usePublicClient } from "wagmi";
import { useGalleryRuntime } from "../config/galleryRuntime";
import {
  readOwnedSocietyIds,
  type OwnedSocietyProjection,
} from "../redemption/ownedSociety";

export function galleryRedemptionOwnedQueryKey(
  chainId: number,
  account: Address | undefined,
  checkout: Address | undefined,
  mirror: Address,
) {
  return [
    "gallery-redemption-owned",
    chainId,
    account?.toLowerCase() ?? null,
    checkout?.toLowerCase() ?? null,
    mirror.toLowerCase(),
  ] as const;
}

export async function cacheConfirmedGalleryRedemption(
  queryClient: Pick<QueryClient, "cancelQueries" | "setQueryData">,
  input: Readonly<{
    chainId: number;
    account: Address;
    checkout: Address;
    mirror: Address;
    tokenIds: readonly bigint[];
    blockNumber: bigint;
  }>,
) {
  const queryKey = galleryRedemptionOwnedQueryKey(
    input.chainId,
    input.account,
    input.checkout,
    input.mirror,
  );
  await queryClient.cancelQueries({ queryKey, exact: true });
  const redeemedIds = new Set(input.tokenIds);
  queryClient.setQueryData<OwnedSocietyProjection>(queryKey, (current) => {
    if (
      !current ||
      current.status !== "ready" ||
      !isAddressEqual(current.account, input.account)
    ) {
      return current;
    }
    const tokenIds = current.tokenIds.filter(
      (tokenId) => !redeemedIds.has(tokenId),
    );
    if (tokenIds.length === current.tokenIds.length) return current;
    return {
      ...current,
      blockNumber: input.blockNumber,
      balance: BigInt(tokenIds.length),
      tokenIds,
    };
  });
}

export function useGalleryRedemptionOwnership() {
  const runtime = useGalleryRuntime();
  const connection = useConnection();
  const publicClient = usePublicClient({ chainId: runtime.chainId });
  const account = connection.address;
  const queryKey = galleryRedemptionOwnedQueryKey(
    runtime.chainId,
    account,
    runtime.checkout?.address,
    runtime.addresses.mirror,
  );
  const enabled = Boolean(
    runtime.checkout &&
      account &&
      connection.chainId === runtime.chainId &&
      publicClient,
  );
  const query = useQuery({
    queryKey,
    enabled,
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: () => {
      if (!runtime.checkout || !account || !publicClient) {
        throw new Error("Owned Society discovery is unavailable.");
      }
      return readOwnedSocietyIds({
        client: publicClient,
        account,
        checkout: runtime.checkout.address,
        mirror: runtime.addresses.mirror,
      });
    },
  });

  if (!account || connection.chainId !== runtime.chainId) {
    return {
      state: { status: "disconnected" as const },
      refresh: query.refetch,
      account: undefined,
    };
  }
  if (!enabled || query.isPending) {
    return {
      state: { status: "loading" as const },
      refresh: query.refetch,
      account,
    };
  }
  if (query.error) {
    return {
      state: {
        status: "error" as const,
        message:
          query.error instanceof Error
            ? query.error.message
            : "Owned Society discovery failed.",
      },
      refresh: query.refetch,
      account,
    };
  }
  if (!query.data || query.data.status === "error") {
    return {
      state: {
        status: "error" as const,
        message:
          query.data?.message ?? "Owned Society discovery did not complete.",
      },
      refresh: query.refetch,
      account,
    };
  }
  if (query.data.tokenIds.length === 0) {
    return {
      state: { status: "empty" as const },
      refresh: query.refetch,
      account,
    };
  }
  return {
    state: {
      status: "ready" as const,
      tokenIds: query.data.tokenIds,
      blockNumber: query.data.blockNumber,
    },
    refresh: query.refetch,
    account,
  };
}
