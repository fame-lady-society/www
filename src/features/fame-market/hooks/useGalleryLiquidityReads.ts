"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useConnection, usePublicClient } from "wagmi";
import { useGalleryRuntime } from "../config/galleryRuntime";
import {
  readLiquidityInventory,
  readLiquidityProviderPosition,
  readWalletOwnedSociety,
  type GalleryLiquidityProviderPosition,
  type GalleryLiquidityReadClient,
  type GalleryLiquidityToken,
} from "../liquidity/reads";
import { galleryCollectionTokenIds, galleryReadAddresses } from "../reads";
import type { GalleryHookProjection } from "../types";

function liquidityQueryOptions() {
  return {
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: Number.POSITIVE_INFINITY,
  } as const;
}

export function useGalleryLiquidityPosition(blockNumber: bigint | null) {
  const runtime = useGalleryRuntime();
  const connection = useConnection();
  const publicClient = usePublicClient({ chainId: runtime.chainId });
  const account = connection.address;
  const client = publicClient as unknown as
    | GalleryLiquidityReadClient
    | undefined;
  const enabled = Boolean(client && account && blockNumber !== null);
  const query = useQuery({
    queryKey: [
      "gallery-liquidity",
      "position",
      runtime.chainId,
      runtime.addresses.gallery.toLowerCase(),
      account?.toLowerCase() ?? null,
      blockNumber?.toString() ?? null,
    ],
    enabled,
    queryFn: () => {
      if (!client || !account || blockNumber === null) {
        throw new Error("Provider position is unavailable.");
      }
      return readLiquidityProviderPosition(
        client,
        blockNumber,
        account,
        galleryReadAddresses(runtime.addresses),
      );
    },
    ...liquidityQueryOptions(),
  });
  const projection: GalleryHookProjection<GalleryLiquidityProviderPosition> =
    !account
      ? { status: "idle" }
      : !enabled || query.isPending
        ? { status: "loading" }
        : query.data ?? {
            status: "failure",
            blockNumber,
            message: "Provider position is unavailable.",
          };
  return { projection, refresh: query.refetch, account };
}

export function useGalleryOwnedSociety(blockNumber: bigint | null) {
  const runtime = useGalleryRuntime();
  const connection = useConnection();
  const publicClient = usePublicClient({ chainId: runtime.chainId });
  const account = connection.address;
  const client = publicClient as unknown as
    | GalleryLiquidityReadClient
    | undefined;
  const tokenIds = useMemo(
    () => galleryCollectionTokenIds(runtime.collection),
    [runtime.collection],
  );
  const enabled = Boolean(client && account && blockNumber !== null);
  const query = useQuery({
    queryKey: [
      "gallery-liquidity",
      "owned-society",
      runtime.chainId,
      account?.toLowerCase() ?? null,
      blockNumber?.toString() ?? null,
    ],
    enabled,
    queryFn: () => {
      if (!client || !account || blockNumber === null) {
        throw new Error("Society ownership is unavailable.");
      }
      return readWalletOwnedSociety(
        client,
        blockNumber,
        account,
        tokenIds,
        galleryReadAddresses(runtime.addresses),
      );
    },
    ...liquidityQueryOptions(),
  });
  const projection: GalleryHookProjection<readonly GalleryLiquidityToken[]> =
    !account
      ? { status: "idle" }
      : !enabled || query.isPending
        ? { status: "loading" }
        : query.data ?? {
            status: "failure",
            blockNumber,
            message: "Society ownership is unavailable.",
          };
  return { projection, refresh: query.refetch, account };
}

export function useGalleryLiquidityInventory(blockNumber: bigint | null) {
  const runtime = useGalleryRuntime();
  const publicClient = usePublicClient({ chainId: runtime.chainId });
  const client = publicClient as unknown as
    | GalleryLiquidityReadClient
    | undefined;
  const tokenIds = useMemo(
    () => galleryCollectionTokenIds(runtime.collection),
    [runtime.collection],
  );
  const enabled = Boolean(client && blockNumber !== null);
  const query = useQuery({
    queryKey: [
      "gallery-liquidity",
      "inventory",
      runtime.chainId,
      runtime.addresses.gallery.toLowerCase(),
      blockNumber?.toString() ?? null,
    ],
    enabled,
    queryFn: () => {
      if (!client || blockNumber === null) {
        throw new Error("Marketplace Society inventory is unavailable.");
      }
      return readLiquidityInventory(
        client,
        blockNumber,
        tokenIds,
        galleryReadAddresses(runtime.addresses),
      );
    },
    ...liquidityQueryOptions(),
  });
  const projection: GalleryHookProjection<readonly GalleryLiquidityToken[]> =
    !enabled || query.isPending
      ? { status: "loading" }
      : query.data ?? {
          status: "failure",
          blockNumber,
          message: "Marketplace Society inventory is unavailable.",
        };
  return { projection, refresh: query.refetch };
}
