"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { erc721Abi, type Address } from "viem";
import { base } from "viem/chains";
import { useBlock, useReadContract, useReadContracts } from "wagmi";
import {
  societyNftAuctionAbi,
  useWatchSocietyNftAuctionAuctionSettledEvent,
  useWatchSocietyNftAuctionAuctionStartedEvent,
  useWatchSocietyNftAuctionBidAcceptedEvent,
} from "../../../wagmi";
import {
  getSocietyNftAuctionConfig,
  type SocietyNftAuctionConfig,
} from "../config";
import {
  loadSocietyNftMetadata,
  societyNftMetadataFallback,
} from "../metadata";
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

  return AUCTION_SNAPSHOT_FUNCTIONS.map((functionName) => ({
    abi: societyNftAuctionAbi,
    address,
    chainId: base.id,
    functionName,
  }));
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

  const [
    societyNft,
    lifecycle,
    tokenId,
    startTime,
    endTime,
    highestBidder,
    highestBid,
    settledRecipient,
  ] = values;

  return buildAuctionSnapshot({
    auctionAddress,
    societyNft,
    lifecycle,
    tokenId,
    startTime,
    endTime,
    highestBidder,
    highestBid,
    settledRecipient,
  });
}

export interface AuctionMetadataTarget {
  societyNft: Address;
  tokenId: bigint;
}

export function metadataTargetFromProjection(
  projection: SocietyNftAuctionPageProjection,
): AuctionMetadataTarget | null {
  if (
    projection.kind !== "active" &&
    projection.kind !== "ended_unsettled" &&
    projection.kind !== "settled"
  ) {
    return null;
  }

  return {
    societyNft: projection.societyNft,
    tokenId: projection.lot.tokenId,
  };
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

export async function refreshCanonicalAuction(
  refetchSnapshot: () => Promise<{
    error: unknown;
    data?: readonly { status: string }[];
  }>,
  refetchBlock: () => Promise<{ error: unknown; data?: unknown }>,
): Promise<void> {
  const [snapshot, block] = await Promise.all([
    refetchSnapshot(),
    refetchBlock(),
  ]);
  const error = snapshot.error ?? block.error;
  if (error) throw error;
  if (
    snapshot.data?.length !== AUCTION_SNAPSHOT_FUNCTIONS.length ||
    snapshot.data.some((read) => read.status !== "success") ||
    block.data === undefined
  ) {
    throw new Error("Canonical auction refresh returned incomplete data");
  }
}

export interface UseSocietyNftAuctionResult {
  config: SocietyNftAuctionConfig;
  projection: SocietyNftAuctionPageProjection;
  blockTimestamp: bigint | null;
  metadata: SocietyNftAuctionMetadata | null;
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
    allowFailure: true,
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
  } else if (snapshotQuery.error || blockQuery.error) {
    snapshotResult = failedSnapshot("Auction data is unavailable. Try again.");
  } else if (!snapshotQuery.data) {
    snapshotResult = failedSnapshot("Auction data is loading");
  } else if (snapshotQuery.data.some((read) => read.status !== "success")) {
    snapshotResult = failedSnapshot("Auction data is unavailable. Try again.");
  } else {
    snapshotResult = mapSocietyNftAuctionReads(
      auctionAddress,
      snapshotQuery.data.map((read) => read.result),
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
      ? societyNftMetadataFallback("Society NFT metadata is unavailable")
      : null);

  const refetchSnapshot = snapshotQuery.refetch;
  const refetchBlock = blockQuery.refetch;
  const refresh = useCallback(
    () =>
      refreshCanonicalAuction(
        () => refetchSnapshot({ cancelRefetch: false }),
        () => refetchBlock({ cancelRefetch: false }),
      ),
    [refetchBlock, refetchSnapshot],
  );

  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);
  const onAuctionEvent = useMemo(
    () =>
      createCoalescedAuctionRefresh(() => {
        void refreshRef.current().catch(() => undefined);
      }),
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
    isRefreshing: snapshotQuery.isFetching || blockQuery.isFetching,
    refresh,
  };
}
