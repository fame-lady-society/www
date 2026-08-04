"use client";

import { useQuery } from "@tanstack/react-query";
import { decodeTestGalleryMetadata } from "../metadata/testMetadata";
import {
  GALLERY_METADATA_TIMEOUT_MS,
  loadGalleryMetadata,
} from "../metadata/galleryMetadata";

export function galleryMetadataQueryOptions(tokenUri: string) {
  const trimmedTokenUri = tokenUri.trim();
  let initialData:
    | (() => ReturnType<typeof decodeTestGalleryMetadata>)
    | undefined;
  if (trimmedTokenUri.startsWith("data:")) {
    initialData = () => decodeTestGalleryMetadata(tokenUri);
  }

  return {
    queryKey: ["fame-market", "metadata", tokenUri] as const,
    queryFn: async ({ signal }: { signal: AbortSignal }) =>
      loadGalleryMetadata(
        tokenUri,
        fetch,
        GALLERY_METADATA_TIMEOUT_MS,
        signal,
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
