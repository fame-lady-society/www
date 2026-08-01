"use client";

import { useQuery } from "@tanstack/react-query";
import { decodeTestGalleryMetadata } from "../metadata/testMetadata";
import {
  GALLERY_METADATA_TIMEOUT_MS,
  loadGalleryMetadata,
} from "../metadata/galleryMetadata";
import { FAME_METADATA_FALLBACK_IMAGE } from "@/service/fameMetadata";
import { fameForkModeEnabled } from "@/viem/baseRpcUrls";

export function fameForkMetadataFallbackEnabled() {
  return (
    fameForkModeEnabled() &&
    process.env.NEXT_PUBLIC_FAME_FORK_METADATA_FALLBACK === "1"
  );
}

export function applyForkMetadataFallback(
  result: Awaited<ReturnType<typeof loadGalleryMetadata>>,
  enabled: boolean,
) {
  if (!enabled || result.status === "ready") return result;
  return {
    status: "ready" as const,
    image: FAME_METADATA_FALLBACK_IMAGE,
    name: "Fork test artwork",
    description: null,
    attributes: [],
    error: null,
  };
}

export function galleryMetadataQueryOptions(
  tokenUri: string,
  forkFallback = fameForkMetadataFallbackEnabled(),
) {
  const trimmedTokenUri = tokenUri.trim();
  let initialData:
    | (() => ReturnType<typeof decodeTestGalleryMetadata>)
    | undefined;
  if (trimmedTokenUri.startsWith("data:")) {
    initialData = () => decodeTestGalleryMetadata(tokenUri);
  } else if (forkFallback) {
    initialData = () =>
      applyForkMetadataFallback(decodeTestGalleryMetadata(""), true);
  }

  return {
    queryKey: ["fame-gallery", "metadata", tokenUri] as const,
    queryFn: async ({ signal }: { signal: AbortSignal }) =>
      applyForkMetadataFallback(
        await loadGalleryMetadata(
          tokenUri,
          fetch,
          GALLERY_METADATA_TIMEOUT_MS,
          signal,
        ),
        forkFallback,
      ),
    enabled: trimmedTokenUri.length > 0,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 30 * 60 * 1_000,
    retry: 1,
    initialData,
  };
}

export function useGalleryMetadata(tokenUri: string) {
  const query = useQuery(galleryMetadataQueryOptions(tokenUri));
  return {
    metadata: query.data ?? decodeTestGalleryMetadata(""),
    isLoading: query.isPending && query.fetchStatus === "fetching",
    retry: query.refetch,
  };
}
