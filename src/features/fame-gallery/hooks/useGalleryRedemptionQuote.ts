"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useConnection, usePublicClient } from "wagmi";
import { useGalleryRuntime } from "../config/galleryRuntime";
import { quoteGalleryRedemption } from "../redemption/quote";
import type { GalleryRedemptionOutputAsset } from "../types";

export function useGalleryRedemptionQuote(input: {
  tokenIds: readonly bigint[];
  outputAsset: GalleryRedemptionOutputAsset;
}) {
  const runtime = useGalleryRuntime();
  const connection = useConnection();
  const publicClient = usePublicClient({ chainId: runtime.chainId });
  const tokenIdsKey = input.tokenIds.join(",");
  const queryKey = useMemo(
    () => [
      "gallery-redemption-quote",
      runtime.chainId,
      connection.address?.toLowerCase() ?? null,
      runtime.checkout?.address.toLowerCase() ?? null,
      tokenIdsKey,
      input.outputAsset,
    ],
    [
      connection.address,
      input.outputAsset,
      runtime.chainId,
      runtime.checkout?.address,
      tokenIdsKey,
    ],
  );
  const enabled = Boolean(
    runtime.checkout &&
      publicClient &&
      connection.address &&
      connection.chainId === runtime.chainId &&
      input.tokenIds.length >= 1 &&
      input.tokenIds.length <= 32,
  );
  const query = useQuery({
    queryKey,
    enabled,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
    queryFn: ({ signal }) => {
      if (!runtime.checkout || !publicClient || !connection.address) {
        throw new Error("Society redemption quoting is unavailable.");
      }
      return quoteGalleryRedemption({
        client: publicClient,
        chainId: runtime.chainId,
        account: connection.address,
        checkout: runtime.checkout.address,
        fame: runtime.addresses.fame,
        router: runtime.checkout.router,
        tokenIds: input.tokenIds,
        outputAsset: input.outputAsset,
        signal,
      });
    },
  });

  return {
    quote: query.data ?? null,
    isLoading: enabled && query.isFetching,
    error: query.error instanceof Error ? query.error : null,
    refresh: query.refetch,
    enabled,
    queryKey,
  };
}
