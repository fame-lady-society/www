import type { Hash } from "viem";
import { BASE_SEPOLIA_TEST_GALLERY_CONFIG } from "../config/baseSepoliaTestGallery";
import {
  createGalleryDiscoveryProvenance,
  parseGalleryDiscoveryCache,
  serializeGalleryDiscoveryCache,
  type GalleryDiscoveryCache,
} from "./cache";

export const GALLERY_EVENT_CHUNK_SIZE = 10_000n;
export const GALLERY_EVENT_MIN_CHUNK_SIZE = 625n;
export const GALLERY_EVENT_REORG_OVERLAP = 64n;

export type GalleryDiscoveryEvent = {
  eventName: "Listed" | "Unlisted" | "PremiumUpdated" | "Filled";
  tokenId: bigint;
  blockNumber: bigint;
};

export type GalleryCandidateVerification =
  | { status: "active" }
  | { status: "inactive" }
  | { status: "unavailable" };

export type GalleryDiscoverySource = {
  getBlockNumber: () => Promise<bigint>;
  getBlockHash: (blockNumber: bigint) => Promise<Hash>;
  getEvents: (
    fromBlock: bigint,
    toBlock: bigint,
  ) => Promise<readonly GalleryDiscoveryEvent[]>;
  verifyCandidates: (
    tokenIds: readonly bigint[],
  ) => Promise<Map<bigint, GalleryCandidateVerification>>;
};

export type GalleryDiscoveryResult = {
  status: "complete" | "discovery_incomplete";
  candidateTokenIds: bigint[];
  activeTokenIds: bigint[];
  unavailableTokenIds: bigint[];
  cursor: {
    blockNumber: bigint;
    blockHash: Hash;
  };
};

type DiscoveryScanResult = {
  events: GalleryDiscoveryEvent[];
  cursor: {
    blockNumber: bigint;
    blockHash: Hash;
  };
};

function candidateIdsFromEvents(events: readonly GalleryDiscoveryEvent[]) {
  const candidates = new Set<bigint>();
  for (const event of events) {
    if (event.tokenId < 1n || event.tokenId > 888n) {
      throw new Error(
        `${event.eventName} token ${event.tokenId} is outside the collection`,
      );
    }
    candidates.add(event.tokenId);
  }
  return candidates;
}

function sortedTokenIds(tokenIds: Iterable<bigint>) {
  return [...tokenIds].sort((left, right) =>
    left < right ? -1 : left > right ? 1 : 0,
  );
}

async function scanEventRange(
  source: GalleryDiscoverySource,
  fromBlock: bigint,
  toBlock: bigint,
): Promise<DiscoveryScanResult> {
  if (fromBlock > toBlock) {
    return {
      events: [],
      cursor: {
        blockNumber: toBlock,
        blockHash: await source.getBlockHash(toBlock),
      },
    };
  }

  const events: GalleryDiscoveryEvent[] = [];
  let nextBlock = fromBlock;
  let chunkSize = GALLERY_EVENT_CHUNK_SIZE;
  let cursorHash: Hash | null = null;

  while (nextBlock <= toBlock) {
    const chunkEnd =
      nextBlock + chunkSize - 1n > toBlock
        ? toBlock
        : nextBlock + chunkSize - 1n;
    try {
      const chunkEvents = await source.getEvents(nextBlock, chunkEnd);
      events.push(...chunkEvents);
      cursorHash = await source.getBlockHash(chunkEnd);
      nextBlock = chunkEnd + 1n;
      chunkSize = GALLERY_EVENT_CHUNK_SIZE;
    } catch (error) {
      if (chunkSize <= GALLERY_EVENT_MIN_CHUNK_SIZE) throw error;
      const halved = chunkSize / 2n;
      chunkSize =
        halved < GALLERY_EVENT_MIN_CHUNK_SIZE
          ? GALLERY_EVENT_MIN_CHUNK_SIZE
          : halved;
    }
  }

  return {
    events,
    cursor: {
      blockNumber: toBlock,
      blockHash: cursorHash ?? (await source.getBlockHash(toBlock)),
    },
  };
}

async function verifiedDisplayState(
  source: GalleryDiscoverySource,
  candidateTokenIds: readonly bigint[],
) {
  let verification: Map<bigint, GalleryCandidateVerification>;
  try {
    verification = await source.verifyCandidates(candidateTokenIds);
  } catch {
    verification = new Map(
      candidateTokenIds.map((tokenId) => [
        tokenId,
        { status: "unavailable" as const },
      ]),
    );
  }
  const activeTokenIds: bigint[] = [];
  const unavailableTokenIds: bigint[] = [];

  for (const tokenId of candidateTokenIds) {
    const result = verification.get(tokenId);
    if (result?.status === "active") activeTokenIds.push(tokenId);
    else if (!result || result.status === "unavailable") {
      unavailableTokenIds.push(tokenId);
    }
  }
  return { activeTokenIds, unavailableTokenIds };
}

function manifestCheckpointCache(now: number): GalleryDiscoveryCache {
  const config = BASE_SEPOLIA_TEST_GALLERY_CONFIG;
  return {
    schemaVersion: 1,
    provenance: createGalleryDiscoveryProvenance(),
    candidateTokenIds: config.checkpoint.candidateTokenIds.map(String),
    cursor: {
      blockNumber: config.checkpoint.blockNumber.toString(),
      blockHash: config.checkpoint.blockHash,
    },
    updatedAt: now,
  };
}

export async function discoverGalleryListings({
  source,
  restoredCache,
  persist,
  now = Date.now,
}: {
  source: GalleryDiscoverySource;
  restoredCache: GalleryDiscoveryCache | null;
  persist: (record: GalleryDiscoveryCache) => Promise<unknown>;
  now?: () => number;
}): Promise<GalleryDiscoveryResult> {
  const config = BASE_SEPOLIA_TEST_GALLERY_CONFIG;
  const provenance = createGalleryDiscoveryProvenance();
  const headBlock = await source.getBlockNumber();
  const deploymentHash = await source.getBlockHash(
    config.deployment.blockNumber,
  );
  const deploymentTrusted = deploymentHash === config.deployment.blockHash;
  const checkpointTrusted =
    headBlock >= config.checkpoint.blockNumber &&
    (await source.getBlockHash(config.checkpoint.blockNumber)) ===
      config.checkpoint.blockHash;

  let baseCache: GalleryDiscoveryCache | null = null;
  if (restoredCache && checkpointTrusted) {
    try {
      baseCache = parseGalleryDiscoveryCache(
        serializeGalleryDiscoveryCache(restoredCache),
        provenance,
        { maxCursorBlock: headBlock },
      );
    } catch {
      baseCache = null;
    }
    if (baseCache) {
      const cursorBlock = BigInt(baseCache.cursor.blockNumber);
      if (
        (await source.getBlockHash(cursorBlock)) !== baseCache.cursor.blockHash
      ) {
        baseCache = null;
      }
    }
  }
  if (!baseCache && checkpointTrusted) {
    baseCache = manifestCheckpointCache(now());
  }

  const baseCandidates = new Set<bigint>(
    (
      baseCache?.candidateTokenIds ??
      (deploymentTrusted ? [] : config.checkpoint.candidateTokenIds.map(String))
    ).map(BigInt),
  );
  const priorCursor = baseCache
    ? {
        blockNumber: BigInt(baseCache.cursor.blockNumber),
        blockHash: baseCache.cursor.blockHash,
      }
    : {
        blockNumber: config.deployment.blockNumber,
        blockHash: deploymentHash,
      };

  if (!deploymentTrusted) {
    const display = await verifiedDisplayState(
      source,
      sortedTokenIds(baseCandidates),
    );
    return {
      status: "discovery_incomplete",
      candidateTokenIds: sortedTokenIds(baseCandidates),
      ...display,
      cursor: priorCursor,
    };
  }

  const scanFrom = baseCache
    ? BigInt(baseCache.cursor.blockNumber) - GALLERY_EVENT_REORG_OVERLAP <
      config.deployment.blockNumber
      ? config.deployment.blockNumber
      : BigInt(baseCache.cursor.blockNumber) - GALLERY_EVENT_REORG_OVERLAP
    : config.deployment.blockNumber;

  try {
    const scan = await scanEventRange(source, scanFrom, headBlock);
    const candidates = new Set(baseCandidates);
    for (const tokenId of candidateIdsFromEvents(scan.events)) {
      candidates.add(tokenId);
    }
    const candidateTokenIds = sortedTokenIds(candidates);
    const display = await verifiedDisplayState(source, candidateTokenIds);
    const status =
      display.unavailableTokenIds.length === 0
        ? "complete"
        : "discovery_incomplete";

    if (checkpointTrusted) {
      await persist({
        schemaVersion: 1,
        provenance,
        candidateTokenIds: candidateTokenIds.map(String),
        cursor: {
          blockNumber: scan.cursor.blockNumber.toString(),
          blockHash: scan.cursor.blockHash,
        },
        updatedAt: now(),
      });
    }

    return {
      status,
      candidateTokenIds,
      ...display,
      cursor: scan.cursor,
    };
  } catch {
    const candidateTokenIds = sortedTokenIds(baseCandidates);
    const display = await verifiedDisplayState(source, candidateTokenIds);
    return {
      status: "discovery_incomplete",
      candidateTokenIds,
      ...display,
      cursor: priorCursor,
    };
  }
}
