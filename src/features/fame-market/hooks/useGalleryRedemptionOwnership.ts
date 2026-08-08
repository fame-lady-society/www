"use client";

import { useQuery } from "@tanstack/react-query";
import { useConnection, usePublicClient } from "wagmi";
import { useGalleryRuntime } from "../config/galleryRuntime";
import { readOwnedSocietyIds } from "../redemption/ownedSociety";

export function useGalleryRedemptionOwnership() {
  const runtime = useGalleryRuntime();
  const connection = useConnection();
  const publicClient = usePublicClient({ chainId: runtime.chainId });
  const account = connection.address;
  const enabled = Boolean(
    runtime.checkout &&
      account &&
      connection.chainId === runtime.chainId &&
      publicClient,
  );
  const query = useQuery({
    queryKey: [
      "gallery-redemption-owned",
      runtime.chainId,
      account?.toLowerCase() ?? null,
      runtime.checkout?.address.toLowerCase() ?? null,
      runtime.addresses.mirror.toLowerCase(),
    ],
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
