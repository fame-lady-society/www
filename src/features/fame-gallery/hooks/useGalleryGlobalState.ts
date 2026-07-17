"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { usePublicClient } from "wagmi";
import { BASE_SEPOLIA_TEST_GALLERY_CONFIG } from "../config/baseSepoliaTestGallery";
import {
  GALLERY_CANONICAL_QUERY_OPTIONS,
  galleryQueryKeys,
} from "../queryKeys";
import { readGalleryGlobalState, type GalleryMulticallClient } from "../reads";
import type { GalleryGlobalState, GalleryHookProjection } from "../types";

const identity = {
  chainId: BASE_SEPOLIA_TEST_GALLERY_CONFIG.chainId,
  galleryAddress: BASE_SEPOLIA_TEST_GALLERY_CONFIG.addresses.gallery,
} as const;

export function useGalleryGlobalState({
  enabled = true,
}: { enabled?: boolean } = {}) {
  const publicClient = usePublicClient({
    chainId: BASE_SEPOLIA_TEST_GALLERY_CONFIG.chainId,
  });
  const query = useQuery({
    queryKey: galleryQueryKeys.global(identity),
    queryFn: () =>
      readGalleryGlobalState(publicClient as unknown as GalleryMulticallClient),
    enabled: enabled && Boolean(publicClient),
    ...GALLERY_CANONICAL_QUERY_OPTIONS,
  });
  const refresh = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const projection: GalleryHookProjection<GalleryGlobalState> = !enabled
    ? { status: "idle" }
    : !publicClient || query.isPending
      ? { status: "loading" }
      : query.data ?? {
          status: "failure",
          blockNumber: null,
          message: "Gallery global state is unavailable",
        };

  return {
    projection,
    isRefreshing: query.isFetching && !query.isPending,
    refresh,
  };
}
