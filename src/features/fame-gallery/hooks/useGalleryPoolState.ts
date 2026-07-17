"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { usePublicClient } from "wagmi";
import { BASE_SEPOLIA_TEST_GALLERY_CONFIG } from "../config/baseSepoliaTestGallery";
import {
  GALLERY_CANONICAL_QUERY_OPTIONS,
  galleryQueryKeys,
} from "../queryKeys";
import { readGalleryPoolState, type GalleryMulticallClient } from "../reads";
import type {
  GalleryHookProjection,
  GalleryPoolKind,
  GalleryPoolState,
} from "../types";

const identity = {
  chainId: BASE_SEPOLIA_TEST_GALLERY_CONFIG.chainId,
  galleryAddress: BASE_SEPOLIA_TEST_GALLERY_CONFIG.addresses.gallery,
} as const;

export function useGalleryPoolState({
  kind,
  tokenIds,
  enabled,
}: {
  kind: GalleryPoolKind;
  tokenIds: readonly bigint[];
  enabled: boolean;
}) {
  const publicClient = usePublicClient({
    chainId: BASE_SEPOLIA_TEST_GALLERY_CONFIG.chainId,
  });
  const normalizedTokenIds = useMemo(
    () =>
      [...new Set(tokenIds)].sort((left, right) =>
        left < right ? -1 : left > right ? 1 : 0,
      ),
    [tokenIds],
  );
  const query = useQuery({
    queryKey: galleryQueryKeys.pool(identity, kind, normalizedTokenIds),
    queryFn: () =>
      readGalleryPoolState(
        publicClient as unknown as GalleryMulticallClient,
        kind,
        normalizedTokenIds,
      ),
    enabled: enabled && Boolean(publicClient),
    ...GALLERY_CANONICAL_QUERY_OPTIONS,
  });
  const refresh = useCallback(async () => {
    if (!enabled) return;
    await query.refetch();
  }, [enabled, query]);

  const projection: GalleryHookProjection<GalleryPoolState> = !enabled
    ? { status: "idle" }
    : !publicClient || query.isPending
      ? { status: "loading" }
      : query.data ?? {
          status: "failure",
          blockNumber: null,
          message: "Gallery pool state is unavailable",
        };

  return {
    projection,
    isRefreshing: query.isFetching && !query.isPending,
    refresh,
  };
}
