"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePublicClient } from "wagmi";
import { useGalleryRuntime } from "../config/galleryRuntime";
import {
  GALLERY_CANONICAL_QUERY_OPTIONS,
  galleryQueryKeys,
  type GalleryQueryIdentity,
} from "../queryKeys";
import {
  captureGalleryBlock,
  galleryCollectionTokenIds,
  galleryReadAddresses,
  readGalleryPoolState,
  type GalleryMulticallClient,
} from "../reads";
import type { GalleryHookProjection, GalleryPoolState } from "../types";

export function useGalleryPoolState({
  tokenIds,
  enabled = true,
}: {
  tokenIds?: readonly bigint[];
  enabled?: boolean;
} = {}) {
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
  const normalizedTokenIds = useMemo(
    () =>
      tokenIds
        ? [...new Set(tokenIds)].sort((left, right) =>
            left < right ? -1 : left > right ? 1 : 0,
          )
        : undefined,
    [tokenIds],
  );

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
    queryKey: galleryQueryKeys.pool(
      identity,
      blockNumber ?? 0n,
      normalizedTokenIds,
    ),
    queryFn: () => {
      if (!client || blockNumber === null) {
        throw new Error("Gallery public client is unavailable");
      }
      const collectionTokenIds =
        normalizedTokenIds ?? galleryCollectionTokenIds(config.collection);
      return readGalleryPoolState(
        client,
        blockNumber,
        collectionTokenIds,
        galleryReadAddresses(config.addresses),
      );
    },
    enabled: enabled && Boolean(client) && blockNumber !== null,
    ...GALLERY_CANONICAL_QUERY_OPTIONS,
  });

  const projection: GalleryHookProjection<GalleryPoolState> = !enabled
    ? { status: "idle" }
    : !client || blockNumber === null || query.isPending
      ? { status: "loading" }
      : query.data ?? {
          status: "failure",
          blockNumber,
          message: "Gallery pool state is unavailable",
        };

  return {
    projection,
    blockNumber,
    isRefreshing: query.isFetching && !query.isPending,
    refresh: capture,
  };
}
