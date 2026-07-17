"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import type { Address } from "viem";
import { usePublicClient } from "wagmi";
import { BASE_SEPOLIA_TEST_GALLERY_CONFIG } from "../config/baseSepoliaTestGallery";
import {
  GALLERY_CANONICAL_QUERY_OPTIONS,
  galleryQueryKeys,
} from "../queryKeys";
import { readGalleryAuthority, type GalleryMulticallClient } from "../reads";
import type { GalleryAuthorityState, GalleryHookProjection } from "../types";

const identity = {
  chainId: BASE_SEPOLIA_TEST_GALLERY_CONFIG.chainId,
  galleryAddress: BASE_SEPOLIA_TEST_GALLERY_CONFIG.addresses.gallery,
} as const;

export function useGalleryAuthority(account: Address | null) {
  const publicClient = usePublicClient({
    chainId: BASE_SEPOLIA_TEST_GALLERY_CONFIG.chainId,
  });
  const query = useQuery({
    queryKey: account
      ? galleryQueryKeys.authority(identity, account)
      : [...galleryQueryKeys.authorities(identity), "disconnected"],
    queryFn: () => {
      if (!account) throw new Error("Wallet account is unavailable");
      return readGalleryAuthority(
        publicClient as unknown as GalleryMulticallClient,
        account,
      );
    },
    enabled: Boolean(publicClient && account),
    ...GALLERY_CANONICAL_QUERY_OPTIONS,
  });
  const refresh = useCallback(async () => {
    if (!account) return;
    await query.refetch();
  }, [account, query]);

  const projection: GalleryHookProjection<GalleryAuthorityState> = !account
    ? { status: "idle" }
    : !publicClient || query.isPending
      ? { status: "loading" }
      : query.data ?? {
          status: "failure",
          blockNumber: null,
          message: "Gallery authority is unavailable",
        };

  return {
    projection,
    isRefreshing: query.isFetching && !query.isPending,
    refresh,
  };
}
