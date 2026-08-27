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
  readGalleryTokenAvailability,
  type GalleryMulticallClient,
} from "../reads";
import type { GalleryHookProjection, GalleryTokenAvailability } from "../types";

export function useGalleryTokenAvailability(tokenId: bigint) {
  const config = useGalleryRuntime();
  const identity: GalleryQueryIdentity = {
    chainId: config.chainId,
    manifestVersion: config.schemaVersion,
    marketplaceAddress: config.addresses.gallery,
    deploymentBlock: config.deployment.blockNumber,
  };
  const publicClient = usePublicClient({ chainId: config.chainId });
  const client = publicClient as unknown as GalleryMulticallClient | undefined;
  const [blockNumber, setBlockNumber] = useState<bigint | null>(null);
  const [blockCaptureFailed, setBlockCaptureFailed] = useState(false);

  const capture = useCallback(async () => {
    if (!client) return null;
    setBlockCaptureFailed(false);
    try {
      const capturedBlock = await captureGalleryBlock(client);
      setBlockNumber(capturedBlock);
      return capturedBlock;
    } catch {
      setBlockNumber(null);
      setBlockCaptureFailed(true);
      return null;
    }
  }, [client]);

  useEffect(() => {
    let active = true;
    if (!client) {
      setBlockNumber(null);
      setBlockCaptureFailed(false);
      return;
    }
    setBlockCaptureFailed(false);
    void captureGalleryBlock(client).then(
      (block) => {
        if (active) setBlockNumber(block);
      },
      () => {
        if (!active) return;
        setBlockNumber(null);
        setBlockCaptureFailed(true);
      },
    );
    return () => {
      active = false;
    };
  }, [client, tokenId]);

  const query = useQuery({
    queryKey: galleryQueryKeys.tokenAvailability(
      identity,
      blockNumber ?? 0n,
      tokenId,
    ),
    queryFn: () => {
      if (!client || blockNumber === null) {
        throw new Error("Gallery public client is unavailable");
      }
      return readGalleryTokenAvailability(
        client,
        blockNumber,
        tokenId,
        galleryReadAddresses(config.addresses),
      );
    },
    enabled: Boolean(client) && blockNumber !== null,
    ...GALLERY_CANONICAL_QUERY_OPTIONS,
  });

  const projection: GalleryHookProjection<GalleryTokenAvailability> =
    blockCaptureFailed
      ? {
          status: "failure",
          blockNumber: null,
          message: `Gallery token ${tokenId} availability is unavailable`,
        }
      : !client || blockNumber === null || query.isPending
        ? { status: "loading" }
        : query.data ?? {
            status: "failure",
            blockNumber,
            message: `Gallery token ${tokenId} availability is unavailable`,
          };

  const refresh = useCallback(async () => {
    const previousBlock = blockNumber;
    const capturedBlock = await capture();
    if (capturedBlock !== null && capturedBlock === previousBlock) {
      await query.refetch();
    }
  }, [blockNumber, capture, query]);

  return { projection, refresh };
}
