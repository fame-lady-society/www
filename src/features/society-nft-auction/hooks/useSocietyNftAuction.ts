"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { erc721Abi, type Address } from "viem";
import { base } from "viem/chains";
import { useBlock, useReadContract, useReadContracts } from "wagmi";
import {
  societyNftAuctionAbi,
  useReadSocietyNftAuctionMinimumNextBid,
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
  MinimumNextBidState,
  SocietyNftAuctionMetadata,
  SocietyNftAuctionPageProjection,
  SocietyNftAuctionSnapshotResult,
} from "../types";
import { usePageAttentionRefresh } from "./usePageAttentionRefresh";

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

export type CanonicalAuctionRefreshRead =
  | { status: "success"; result: unknown }
  | { status: "failure"; error?: unknown };

export interface CanonicalAuctionRefreshResult {
  snapshot: readonly CanonicalAuctionRefreshRead[];
  blockTimestamp: bigint;
  minimumNextBid: bigint | null;
}

export async function refreshCanonicalAuction(
  refetchSnapshot: () => Promise<{
    error: unknown;
    data?: readonly CanonicalAuctionRefreshRead[];
  }>,
  refetchBlock: () => Promise<{
    error: unknown;
    data?: { timestamp?: bigint };
  }>,
  refetchMinimumNextBid?: () => Promise<{
    error: unknown;
    data?: unknown;
  }>,
  shouldRefetchMinimumNextBid: (
    refreshed: CanonicalAuctionRefreshResult,
  ) => boolean = () => true,
): Promise<CanonicalAuctionRefreshResult> {
  const [snapshot, block] = await Promise.all([
    refetchSnapshot(),
    refetchBlock(),
  ]);
  const error = snapshot.error ?? block.error;
  if (error) throw error;
  if (
    snapshot.data?.length !== AUCTION_SNAPSHOT_FUNCTIONS.length ||
    snapshot.data.some((read) => read.status !== "success") ||
    block.data?.timestamp === undefined
  ) {
    throw new Error("Canonical auction refresh returned incomplete data");
  }

  const refreshed: CanonicalAuctionRefreshResult = {
    snapshot: snapshot.data,
    blockTimestamp: block.data.timestamp,
    minimumNextBid: null,
  };
  if (!refetchMinimumNextBid || !shouldRefetchMinimumNextBid(refreshed)) {
    return refreshed;
  }

  try {
    const minimumNextBid = await refetchMinimumNextBid();
    return {
      ...refreshed,
      minimumNextBid:
        !minimumNextBid.error && typeof minimumNextBid.data === "bigint"
          ? minimumNextBid.data
          : null,
    };
  } catch {
    return refreshed;
  }
}

export interface PreparedAuctionAction {
  projection: SocietyNftAuctionPageProjection;
  minimumNextBid: bigint | null;
}

export function prepareAuctionAction(
  auctionAddress: Address,
  refreshed: CanonicalAuctionRefreshResult,
): PreparedAuctionAction {
  const snapshot = mapSocietyNftAuctionReads(
    auctionAddress,
    refreshed.snapshot.map((read) =>
      read.status === "success" ? read.result : undefined,
    ),
  );

  return {
    projection: projectAuctionPage(snapshot, refreshed.blockTimestamp),
    minimumNextBid: refreshed.minimumNextBid,
  };
}

export interface UseSocietyNftAuctionResult {
  config: SocietyNftAuctionConfig;
  projection: SocietyNftAuctionPageProjection;
  blockTimestamp: bigint | null;
  metadata: SocietyNftAuctionMetadata | null;
  minimumNextBid: MinimumNextBidState;
  isRefreshing: boolean;
  refresh: () => Promise<void>;
  prepareAction: () => Promise<PreparedAuctionAction>;
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
    query: {
      enabled: auctionAddress !== null,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  });
  const blockQuery = useBlock({
    chainId: base.id,
    query: {
      enabled: auctionAddress !== null,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
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
  const activeHighestBid =
    projection.kind === "active" ? projection.highestBid : null;
  const minimumNextBidQuery = useReadSocietyNftAuctionMinimumNextBid({
    address: auctionAddress ?? undefined,
    chainId: base.id,
    query: {
      enabled: activeHighestBid !== null,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  });
  let minimumNextBid: MinimumNextBidState;
  if (activeHighestBid === null) {
    minimumNextBid = { status: "inactive" };
  } else if (minimumNextBidQuery.isFetching) {
    minimumNextBid = { status: "loading" };
  } else if (minimumNextBidQuery.error) {
    minimumNextBid = { status: "error" };
  } else if (minimumNextBidQuery.data !== undefined) {
    minimumNextBid = { status: "ready", value: minimumNextBidQuery.data };
  } else {
    minimumNextBid = { status: "loading" };
  }
  const metadataTarget = metadataTargetFromProjection(projection);

  const tokenUriQuery = useReadContract({
    abi: erc721Abi,
    address: metadataTarget?.societyNft,
    args: metadataTarget ? [metadataTarget.tokenId] : undefined,
    chainId: base.id,
    functionName: "tokenURI",
    query: {
      enabled: metadataTarget !== null,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: Number.POSITIVE_INFINITY,
    },
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
  const refetchMinimumNextBid = minimumNextBidQuery.refetch;
  const refreshCanonical = useCallback(
    () =>
      refreshCanonicalAuction(
        () => refetchSnapshot({ cancelRefetch: false }),
        () => refetchBlock({ cancelRefetch: false }),
        auctionAddress !== null
          ? () => refetchMinimumNextBid({ cancelRefetch: false })
          : undefined,
        (refreshed) =>
          auctionAddress !== null &&
          prepareAuctionAction(auctionAddress, refreshed).projection.kind ===
            "active",
      ),
    [auctionAddress, refetchBlock, refetchMinimumNextBid, refetchSnapshot],
  );
  const refresh = useCallback(async () => {
    await refreshCanonical();
  }, [refreshCanonical]);
  const prepareAction = useCallback(async () => {
    if (auctionAddress === null) {
      throw new Error("Auction is not configured");
    }
    return prepareAuctionAction(auctionAddress, await refreshCanonical());
  }, [auctionAddress, refreshCanonical]);

  usePageAttentionRefresh(refresh, auctionAddress !== null);

  return {
    config,
    projection,
    blockTimestamp,
    metadata,
    minimumNextBid,
    isRefreshing:
      snapshotQuery.isFetching ||
      blockQuery.isFetching ||
      (activeHighestBid !== null && minimumNextBidQuery.isFetching),
    refresh,
    prepareAction,
  };
}
