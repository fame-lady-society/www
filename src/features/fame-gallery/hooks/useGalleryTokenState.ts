"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { usePublicClient } from "wagmi";
import { BASE_SEPOLIA_TEST_GALLERY_CONFIG } from "../config/baseSepoliaTestGallery";
import {
  GALLERY_CANONICAL_QUERY_OPTIONS,
  galleryQueryKeys,
} from "../queryKeys";
import {
  createGalleryTokenReadBatcher,
  type GalleryMulticallClient,
  type GalleryTokenReadBatcher,
} from "../reads";
import type { GalleryHookProjection, GalleryTokenState } from "../types";

const identity = {
  chainId: BASE_SEPOLIA_TEST_GALLERY_CONFIG.chainId,
  galleryAddress: BASE_SEPOLIA_TEST_GALLERY_CONFIG.addresses.gallery,
} as const;

const batchers = new WeakMap<object, GalleryTokenReadBatcher>();

function tokenBatcher(client: object) {
  const existing = batchers.get(client);
  if (existing) return existing;
  const batcher = createGalleryTokenReadBatcher(
    client as GalleryMulticallClient,
  );
  batchers.set(client, batcher);
  return batcher;
}

export function useGalleryTokenState(
  tokenId: bigint,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const publicClient = usePublicClient({
    chainId: BASE_SEPOLIA_TEST_GALLERY_CONFIG.chainId,
  });
  const batcher = useMemo(
    () => (publicClient ? tokenBatcher(publicClient) : null),
    [publicClient],
  );
  const query = useQuery({
    queryKey: galleryQueryKeys.token(identity, tokenId),
    queryFn: () => {
      if (!batcher)
        throw new Error("Base Sepolia public client is unavailable");
      return batcher.load(tokenId);
    },
    enabled: enabled && Boolean(batcher),
    ...GALLERY_CANONICAL_QUERY_OPTIONS,
  });
  const refresh = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const projection: GalleryHookProjection<GalleryTokenState> = !enabled
    ? { status: "idle" }
    : !batcher || query.isPending
      ? { status: "loading" }
      : query.data ?? {
          status: "failure",
          blockNumber: null,
          message: `Gallery token ${tokenId} state is unavailable`,
        };

  return {
    projection,
    isRefreshing: query.isFetching && !query.isPending,
    refresh,
  };
}
