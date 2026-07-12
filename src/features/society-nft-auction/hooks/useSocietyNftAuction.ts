"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { erc721Abi, isAddress, type Address } from "viem";
import { base } from "viem/chains";
import { useBlock, useReadContract, useReadContracts } from "wagmi";
import {
  societyNftAuctionAbi,
  useWatchSocietyNftAuctionAuctionSettledEvent,
  useWatchSocietyNftAuctionAuctionStartedEvent,
  useWatchSocietyNftAuctionBidAcceptedEvent,
} from "../../../wagmi";
import { FAME_METADATA_FALLBACK_IMAGE } from "../../../service/fameMetadata";
import {
  getSocietyNftAuctionConfig,
  type SocietyNftAuctionConfig,
} from "../config";
import { loadSocietyNftMetadata } from "../metadata";
import { buildAuctionSnapshot, projectAuctionPage } from "../state";
import type {
  SocietyNftAuctionMetadata,
  SocietyNftAuctionPageProjection,
  SocietyNftAuctionSnapshotResult,
} from "../types";

export const AUCTION_SNAPSHOT_FUNCTIONS = [
  "SOCIETY_NFT",
  "lifecycle",
  "tokenId",
  "startTime",
  "endTime",
  "highestBidder",
  "highestBid",
  "settledRecipient",
] as const;

type AuctionSnapshotReadContract = {
  abi: typeof societyNftAuctionAbi;
  address: Address;
  chainId: typeof base.id;
  functionName: (typeof AUCTION_SNAPSHOT_FUNCTIONS)[number];
};

export function createSocietyNftAuctionReadContracts(
  address: Address | null,
): readonly AuctionSnapshotReadContract[] {
  if (address === null) return [];

  return [
    {
      abi: societyNftAuctionAbi,
      address,
      chainId: base.id,
      functionName: "SOCIETY_NFT",
    },
    {
      abi: societyNftAuctionAbi,
      address,
      chainId: base.id,
      functionName: "lifecycle",
    },
    {
      abi: societyNftAuctionAbi,
      address,
      chainId: base.id,
      functionName: "tokenId",
    },
    {
      abi: societyNftAuctionAbi,
      address,
      chainId: base.id,
      functionName: "startTime",
    },
    {
      abi: societyNftAuctionAbi,
      address,
      chainId: base.id,
      functionName: "endTime",
    },
    {
      abi: societyNftAuctionAbi,
      address,
      chainId: base.id,
      functionName: "highestBidder",
    },
    {
      abi: societyNftAuctionAbi,
      address,
      chainId: base.id,
      functionName: "highestBid",
    },
    {
      abi: societyNftAuctionAbi,
      address,
      chainId: base.id,
      functionName: "settledRecipient",
    },
  ] as const;
}

function failedSnapshot(message: string): SocietyNftAuctionSnapshotResult {
  return {
    status: "failure",
    message,
    retryable: true,
  };
}

export function mapSocietyNftAuctionReads(
  auctionAddress: Address,
  values: readonly unknown[] | undefined,
): SocietyNftAuctionSnapshotResult {
  if (!values || values.length !== AUCTION_SNAPSHOT_FUNCTIONS.length) {
    return failedSnapshot(
      "Auction data is unavailable: required reads are incomplete",
    );
  }

  return buildAuctionSnapshot({
    auctionAddress,
    societyNft: values[0],
    lifecycle: values[1],
    tokenId: values[2],
    startTime: values[3],
    endTime: values[4],
    highestBidder: values[5],
    highestBid: values[6],
    settledRecipient: values[7],
  });
}

export interface AuctionMetadataTarget {
  societyNft: Address;
  tokenId: bigint;
}

export function metadataTargetFromProjection(
  projection: unknown,
): AuctionMetadataTarget | null {
  if (projection === null || typeof projection !== "object") return null;

  const candidate = projection as {
    kind?: unknown;
    societyNft?: unknown;
    lot?: { tokenId?: unknown };
    tokenId?: unknown;
  };
  if (
    candidate.kind !== "active" &&
    candidate.kind !== "ended_unsettled" &&
    candidate.kind !== "settled"
  ) {
    return null;
  }

  const tokenId = candidate.lot?.tokenId ?? candidate.tokenId;
  if (
    typeof candidate.societyNft !== "string" ||
    !isAddress(candidate.societyNft) ||
    typeof tokenId !== "bigint"
  ) {
    return null;
  }

  return { societyNft: candidate.societyNft, tokenId };
}

/** Coalesces event bursts; logs are freshness hints, never canonical state. */
export function createCoalescedAuctionRefresh(refresh: () => void) {
  let pending = false;

  return () => {
    if (pending) return;
    pending = true;
    queueMicrotask(() => {
      pending = false;
      refresh();
    });
  };
}

function metadataFallback(error: string): SocietyNftAuctionMetadata {
  return {
    image: FAME_METADATA_FALLBACK_IMAGE,
    name: null,
    description: null,
    usedFallback: true,
    error,
  };
}

export interface UseSocietyNftAuctionResult {
  config: SocietyNftAuctionConfig;
  projection: SocietyNftAuctionPageProjection;
  blockTimestamp: bigint | null;
  metadata: SocietyNftAuctionMetadata | null;
  isLoading: boolean;
  isRefreshing: boolean;
  refresh: () => Promise<void>;
}

export function useSocietyNftAuction(): UseSocietyNftAuctionResult {
  const config = getSocietyNftAuctionConfig();
  const auctionAddress = config.status === "configured" ? config.address : null;
  const contracts = useMemo(
    () => createSocietyNftAuctionReadContracts(auctionAddress),
    [auctionAddress],
  );

  const snapshotQuery = useReadContracts({
    allowFailure: false,
    contracts,
    query: { enabled: auctionAddress !== null },
  });
  const blockQuery = useBlock({
    chainId: base.id,
    watch: true,
    query: { enabled: auctionAddress !== null },
  });
  const blockTimestamp = blockQuery.data?.timestamp ?? null;

  let snapshotResult: SocietyNftAuctionSnapshotResult;
  if (auctionAddress === null) {
    snapshotResult = failedSnapshot("Auction is not configured");
  } else if (snapshotQuery.error) {
    snapshotResult = failedSnapshot("Auction data is unavailable. Try again.");
  } else if (!snapshotQuery.data) {
    snapshotResult = failedSnapshot("Auction data is loading");
  } else {
    snapshotResult = mapSocietyNftAuctionReads(
      auctionAddress,
      snapshotQuery.data as readonly unknown[],
    );
  }

  const projection =
    snapshotQuery.isPending && auctionAddress !== null
      ? ({
          kind: "loading",
          message: "Loading auction",
          canBid: false,
          canSettle: false,
        } satisfies SocietyNftAuctionPageProjection)
      : projectAuctionPage(snapshotResult, blockTimestamp);
  const metadataTarget = metadataTargetFromProjection(projection);

  const tokenUriQuery = useReadContract({
    abi: erc721Abi,
    address: metadataTarget?.societyNft,
    args: metadataTarget ? [metadataTarget.tokenId] : undefined,
    chainId: base.id,
    functionName: "tokenURI",
    query: { enabled: metadataTarget !== null },
  });
  const metadataQuery = useQuery({
    queryKey: ["society-nft-auction", "metadata", tokenUriQuery.data],
    queryFn: () => loadSocietyNftMetadata(tokenUriQuery.data as string),
    enabled: typeof tokenUriQuery.data === "string",
    staleTime: Number.POSITIVE_INFINITY,
  });

  const metadata =
    metadataQuery.data ??
    (tokenUriQuery.error || metadataQuery.error
      ? metadataFallback("Society NFT metadata is unavailable")
      : null);

  const refresh = useCallback(async () => {
    await Promise.allSettled([snapshotQuery.refetch(), blockQuery.refetch()]);
    if (metadataTarget !== null) {
      await Promise.allSettled([
        tokenUriQuery.refetch(),
        metadataQuery.refetch(),
      ]);
    }
  }, [blockQuery, metadataQuery, metadataTarget, snapshotQuery, tokenUriQuery]);

  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);
  const onAuctionEvent = useMemo(
    () => createCoalescedAuctionRefresh(() => void refreshRef.current()),
    [],
  );
  const watchOptions = {
    address: auctionAddress ?? undefined,
    chainId: base.id,
    enabled: auctionAddress !== null,
    onLogs: onAuctionEvent,
  } as const;

  useWatchSocietyNftAuctionAuctionStartedEvent(watchOptions);
  useWatchSocietyNftAuctionBidAcceptedEvent(watchOptions);
  useWatchSocietyNftAuctionAuctionSettledEvent(watchOptions);

  return {
    config,
    projection,
    blockTimestamp,
    metadata,
    isLoading:
      snapshotQuery.isPending ||
      blockQuery.isPending ||
      (metadataTarget !== null && tokenUriQuery.isPending),
    isRefreshing:
      snapshotQuery.isFetching ||
      blockQuery.isFetching ||
      tokenUriQuery.isFetching ||
      metadataQuery.isFetching,
    refresh,
  };
}
