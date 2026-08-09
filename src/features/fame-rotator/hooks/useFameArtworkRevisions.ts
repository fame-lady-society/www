"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getFameArtworkRevisions } from "@/service/fame";
import type { FameArtworkRevision } from "@/features/fame/metadata";

export function fameArtworkRevisionsQueryOptions(
  tokenIds: readonly number[],
  blockNumber?: string,
) {
  return {
    queryKey: [
      "fame-artwork-revisions",
      blockNumber ?? "current-page-load",
      tokenIds.join(","),
    ] as const,
    queryFn: () => getFameArtworkRevisions(tokenIds, blockNumber),
    enabled: tokenIds.length > 0,
    staleTime: blockNumber === undefined ? 0 : Infinity,
    gcTime: blockNumber === undefined ? 0 : 30 * 60 * 1000,
    refetchOnMount: blockNumber === undefined ? ("always" as const) : false,
    refetchOnWindowFocus: false,
  };
}

export function useFameArtworkRevisions(
  tokenIds: readonly number[],
  blockNumber?: string,
) {
  const query = useQuery(
    fameArtworkRevisionsQueryOptions(tokenIds, blockNumber),
  );
  const byTokenId = useMemo(
    () =>
      new Map<number, FameArtworkRevision>(
        (query.data?.revisions ?? []).map((revision) => [
          Number(revision.tokenId),
          revision,
        ]),
      ),
    [query.data?.revisions],
  );
  return { ...query, byTokenId };
}
