"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { useGalleryRuntime } from "../config/galleryRuntime";
import {
  GALLERY_CANONICAL_QUERY_OPTIONS,
  galleryQueryKeys,
  type GalleryQueryIdentity,
} from "../queryKeys";
import {
  captureGalleryBlock,
  galleryReadAddresses,
  readGalleryGlobalState,
  type GalleryMulticallClient,
} from "../reads";
import type { GalleryGlobalState, GalleryHookProjection } from "../types";

export function useGalleryGlobalState({
  enabled = true,
}: { enabled?: boolean } = {}) {
  const config = useGalleryRuntime();
  const identity: GalleryQueryIdentity = {
    chainId: config.chainId,
    manifestVersion: config.schemaVersion,
    marketplaceAddress: config.addresses.gallery,
    deploymentBlock: config.deployment.blockNumber,
  };
  const publicClient = usePublicClient({
    chainId: config.chainId,
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
      return readGalleryGlobalState(
        client,
        blockNumber,
        galleryReadAddresses(config.addresses),
      );
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
