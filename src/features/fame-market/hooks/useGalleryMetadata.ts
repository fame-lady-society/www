"use client";

import { useQuery } from "@tanstack/react-query";
import {
  FAME_METADATA_CLIENT_GC_TIME_MS,
  fameMetadataClientQueryKey,
  loadFameMetadataClient,
} from "@/features/fame/metadata/client";
import { decodeInlineFameMetadata } from "@/features/fame/metadata/inline";
import { fameMetadataFailure } from "@/features/fame/metadata/loader";
import type {
  FameArtworkRevision,
  FameMetadataResult,
} from "@/features/fame/metadata/types";

export function galleryMetadataQueryOptions(revision: FameArtworkRevision) {
  const trimmedTokenUri = revision.tokenUri.trim();
  let initialData: (() => FameMetadataResult) | undefined;
  if (trimmedTokenUri.startsWith("data:")) {
    const inlineMetadata = decodeInlineFameMetadata(revision.tokenUri);
    if (inlineMetadata.status === "ready") {
      initialData = () => inlineMetadata;
    }
  }

  return {
    queryKey: fameMetadataClientQueryKey(revision),
    queryFn: async ({ signal }: { signal: AbortSignal }) =>
      loadFameMetadataClient(revision, signal),
    enabled: trimmedTokenUri.length > 0,
    staleTime: Infinity,
    gcTime: FAME_METADATA_CLIENT_GC_TIME_MS,
    retry: 1,
    initialData,
  };
}

export function useGalleryMetadata(revision: FameArtworkRevision) {
  const query = useQuery(galleryMetadataQueryOptions(revision));
  return {
    metadata:
      query.data ?? fameMetadataFailure("Token metadata is unavailable"),
    isLoading: query.isPending && query.fetchStatus === "fetching",
    retry: query.refetch,
  };
}
