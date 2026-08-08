"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import type { Address } from "viem";
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
  readGalleryAccountState,
  type GalleryMulticallClient,
} from "../reads";
import type { GalleryAccountState, GalleryHookProjection } from "../types";

export function useGalleryAccountState(account: Address | null) {
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
    if (!client || !account) return;
    setBlockNumber(await captureGalleryBlock(client));
  }, [account, client]);

  useEffect(() => {
    let active = true;
    if (!client || !account) {
      setBlockNumber(null);
      return;
    }
    void captureGalleryBlock(client).then((block) => {
      if (active) setBlockNumber(block);
    });
    return () => {
      active = false;
    };
  }, [account, client]);

  const query = useQuery({
    queryKey: account
      ? galleryQueryKeys.account(identity, blockNumber ?? 0n, account)
      : [...galleryQueryKeys.stack(identity), "account", "disconnected"],
    queryFn: () => {
      if (!client || !account || blockNumber === null) {
        throw new Error("Wallet account is unavailable");
      }
      return readGalleryAccountState(
        client,
        blockNumber,
        account,
        galleryReadAddresses(config.addresses),
      );
    },
    enabled: Boolean(client && account && blockNumber !== null),
    ...GALLERY_CANONICAL_QUERY_OPTIONS,
  });

  const projection: GalleryHookProjection<GalleryAccountState> = !account
    ? { status: "idle" }
    : !client || blockNumber === null || query.isPending
      ? { status: "loading" }
      : query.data ?? {
          status: "failure",
          blockNumber,
          message: "Gallery account state is unavailable",
        };

  return {
    projection,
    blockNumber,
    isRefreshing: query.isFetching && !query.isPending,
    refresh: capture,
  };
}
