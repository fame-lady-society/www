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
  readGalleryTokenState,
  type GalleryMulticallClient,
} from "../reads";
import type { GalleryHookProjection, GalleryTokenState } from "../types";

export function useGalleryTokenState(
  tokenId: bigint,
  { enabled = true }: { enabled?: boolean; refetchOnMount?: boolean } = {},
) {
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
  }, [client, enabled, tokenId]);

  const query = useQuery({
    queryKey: galleryQueryKeys.token(identity, blockNumber ?? 0n, tokenId),
    queryFn: () => {
      if (!client || blockNumber === null) {
        throw new Error("Gallery public client is unavailable");
      }
      return readGalleryTokenState(
        client,
        blockNumber,
        tokenId,
        galleryReadAddresses(config.addresses),
      );
    },
    enabled: enabled && Boolean(client) && blockNumber !== null,
    ...GALLERY_CANONICAL_QUERY_OPTIONS,
  });

  const projection: GalleryHookProjection<GalleryTokenState> = !enabled
    ? { status: "idle" }
    : !client || blockNumber === null || query.isPending
      ? { status: "loading" }
      : query.data ?? {
          status: "failure",
          blockNumber,
          message: `Gallery token ${tokenId} state is unavailable`,
        };

  return {
    projection,
    blockNumber,
    isRefreshing: query.isFetching && !query.isPending,
    refresh: capture,
  };
}
