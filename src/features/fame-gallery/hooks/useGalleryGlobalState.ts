"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { BASE_SEPOLIA_TEST_GALLERY_CONFIG } from "../config/baseSepoliaTestGallery";
import {
  GALLERY_CANONICAL_QUERY_OPTIONS,
  galleryQueryKeys,
  type GalleryQueryIdentity,
} from "../queryKeys";
import {
  captureGalleryBlock,
  readGalleryGlobalState,
  type GalleryMulticallClient,
} from "../reads";
import type { GalleryGlobalState, GalleryHookProjection } from "../types";

const identity: GalleryQueryIdentity = {
  chainId: BASE_SEPOLIA_TEST_GALLERY_CONFIG.chainId,
  manifestVersion: BASE_SEPOLIA_TEST_GALLERY_CONFIG.schemaVersion,
  marketplaceAddress: BASE_SEPOLIA_TEST_GALLERY_CONFIG.addresses.gallery,
  deploymentBlock: BASE_SEPOLIA_TEST_GALLERY_CONFIG.deployment.blockNumber,
};

export function useGalleryGlobalState({
  enabled = true,
}: { enabled?: boolean } = {}) {
  const publicClient = usePublicClient({
    chainId: BASE_SEPOLIA_TEST_GALLERY_CONFIG.chainId,
  });
  const client = publicClient as unknown as GalleryMulticallClient | undefined;
  const [blockNumber, setBlockNumber] = useState<bigint | null>(null);

  const capture = useCallback(async () => {
    if (!client || !enabled) return;
    setBlockNumber(await captureGalleryBlock(client));
  }, [client, enabled]);

  useEffect(() => {
    let active = true;
    if (!client || !enabled) {
      setBlockNumber(null);
      return;
    }
    void captureGalleryBlock(client).then((block) => {
      if (active) setBlockNumber(block);
    });
    return () => {
      active = false;
    };
  }, [client, enabled]);

  const query = useQuery({
    queryKey: galleryQueryKeys.global(identity, blockNumber ?? 0n),
    queryFn: () => {
      if (!client || blockNumber === null) {
        throw new Error("Base Sepolia public client is unavailable");
      }
      return readGalleryGlobalState(client, blockNumber);
    },
    enabled: enabled && Boolean(client) && blockNumber !== null,
    ...GALLERY_CANONICAL_QUERY_OPTIONS,
  });

  const projection: GalleryHookProjection<GalleryGlobalState> = !enabled
    ? { status: "idle" }
    : !client || blockNumber === null || query.isPending
      ? { status: "loading" }
      : query.data ?? {
          status: "failure",
          blockNumber,
          message: "Gallery global state is unavailable",
        };

  return {
    projection,
    blockNumber,
    isRefreshing: query.isFetching && !query.isPending,
    refresh: capture,
  };
}
