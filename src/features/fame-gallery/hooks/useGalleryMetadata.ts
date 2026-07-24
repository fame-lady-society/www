"use client";

import { useQuery } from "@tanstack/react-query";
import { decodeTestGalleryMetadata } from "../metadata/testMetadata";
import { loadGalleryMetadata } from "../metadata/galleryMetadata";

export function galleryMetadataQueryOptions(tokenUri: string) {
  return {
    queryKey: ["fame-gallery", "metadata", tokenUri] as const,
    queryFn: () => loadGalleryMetadata(tokenUri),
    enabled: tokenUri.trim().length > 0,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 30 * 60 * 1_000,
    retry: 1,
    initialData: tokenUri.trim().startsWith("data:")
      ? () => decodeTestGalleryMetadata(tokenUri)
      : undefined,
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
