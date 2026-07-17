"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { parseAbi } from "viem";
import { usePublicClient } from "wagmi";
import { BASE_SEPOLIA_TEST_GALLERY_CONFIG } from "../config/baseSepoliaTestGallery";
import {
  createGalleryDiscoveryProvenance,
  type GalleryDiscoveryCache,
} from "../discovery/cache";
import {
  discoverGalleryListings,
  type GalleryDiscoveryEvent,
  type GalleryDiscoverySource,
} from "../discovery/discovery";
import {
  createGalleryDiscoveryStorage,
  type GalleryDiscoveryLock,
} from "../discovery/storage";
import {
  GALLERY_CANONICAL_QUERY_OPTIONS,
  chunkGalleryTokenIds,
  galleryQueryKeys,
} from "../queryKeys";
import {
  readGalleryCandidateStates,
  type GalleryMulticallClient,
} from "../reads";

const config = BASE_SEPOLIA_TEST_GALLERY_CONFIG;
const identity = {
  chainId: config.chainId,
  galleryAddress: config.addresses.gallery,
} as const;
const lifecycleEvents = parseAbi([
  "event Listed(uint256 indexed tokenId, uint256 premium)",
  "event Unlisted(uint256 indexed tokenId)",
  "event PremiumUpdated(uint256 indexed tokenId, uint256 premium)",
  "event Filled(address indexed buyer, address indexed recipient, uint256 indexed tokenId, uint256 unitAmount, uint256 premium, uint256 inventoryBefore, uint256 inventoryAfter)",
]);

function browserLock(): GalleryDiscoveryLock | null {
  if (typeof navigator === "undefined" || !navigator.locks) return null;
  return {
    request(name, callback) {
      return navigator.locks.request(name, callback);
    },
  };
}

function browserDiscoveryStorage() {
  const provenance = createGalleryDiscoveryProvenance();
  let storage: Storage | null = null;
  if (typeof window !== "undefined") {
    try {
      storage = window.localStorage;
    } catch {
      storage = null;
    }
  }
  return createGalleryDiscoveryStorage({
    storage,
    lock: browserLock(),
    provenance,
  });
}

function discoverySource(
  publicClient: NonNullable<ReturnType<typeof usePublicClient>>,
): GalleryDiscoverySource {
  return {
    getBlockNumber: () => publicClient.getBlockNumber(),
    async getBlockHash(blockNumber) {
      const block = await publicClient.getBlock({ blockNumber });
      if (!block.hash) {
        throw new Error(`Base Sepolia block ${blockNumber} has no hash`);
      }
      return block.hash;
    },
    async getEvents(fromBlock, toBlock) {
      const logs = await publicClient.getLogs({
        address: config.addresses.gallery,
        events: lifecycleEvents,
        fromBlock,
        toBlock,
        strict: true,
      });
      return logs.map(
        (log) =>
          ({
            eventName: log.eventName,
            tokenId: log.args.tokenId,
            blockNumber: log.blockNumber,
          }) as GalleryDiscoveryEvent,
      );
    },
    async verifyCandidates(tokenIds) {
      const verification = new Map<
        bigint,
        { status: "active" | "inactive" | "unavailable" }
      >();
      for (const chunk of chunkGalleryTokenIds(tokenIds)) {
        const projections = await readGalleryCandidateStates(
          publicClient as unknown as GalleryMulticallClient,
          chunk,
        );
        chunk.forEach((tokenId) => {
          const projection = projections.get(tokenId);
          if (projection?.status !== "success") {
            verification.set(tokenId, { status: "unavailable" });
            return;
          }
          verification.set(tokenId, {
            status:
              projection.data.listing.active &&
              projection.data.owner.toLowerCase() ===
                config.addresses.gallery.toLowerCase()
                ? "active"
                : "inactive",
          });
        });
      }
      return verification;
    },
  };
}

export function useGalleryDiscovery() {
  const publicClient = usePublicClient({ chainId: config.chainId });
  const storage = useMemo(() => browserDiscoveryStorage(), []);
  const source = useMemo(
    () => (publicClient ? discoverySource(publicClient) : null),
    [publicClient],
  );
  const query = useQuery({
    queryKey: galleryQueryKeys.discovery(identity),
    queryFn: () => {
      if (!source) throw new Error("Base Sepolia public client is unavailable");
      return discoverGalleryListings({
        source,
        restoredCache: storage.restore(),
        persist: (record: GalleryDiscoveryCache) => storage.commit(record),
      });
    },
    enabled: Boolean(source),
    ...GALLERY_CANONICAL_QUERY_OPTIONS,
  });
  const refresh = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const projection =
    !source || query.isPending
      ? ({ status: "loading" } as const)
      : query.error
        ? ({
            status: "failure",
            message: "Gallery discovery is unavailable",
          } as const)
        : query.data ??
          ({
            status: "failure",
            message: "Gallery discovery is unavailable",
          } as const);

  return {
    projection,
    isRefreshing: query.isFetching && !query.isPending,
    refresh,
  };
}
