import { isHash, type Hash } from "viem";
import { BASE_SEPOLIA_TEST_GALLERY_CONFIG } from "../config/baseSepoliaTestGallery";

export const DISCOVERY_CACHE_SCHEMA_VERSION = 1;
export const DISCOVERY_CACHE_MAX_BYTES = 65_536;
export const DISCOVERY_CACHE_MAX_CANDIDATES = 888;
const MAX_DECIMAL_CHARACTERS = 20;

export type GalleryDiscoveryProvenance = {
  chainId: number;
  galleryAddress: string;
  deploymentBlock: string;
  checkpointBlock: string;
  checkpointHash: Hash;
  checkpointCandidateTokenIds: readonly string[];
};

export type GalleryDiscoveryCache = {
  schemaVersion: typeof DISCOVERY_CACHE_SCHEMA_VERSION;
  provenance: GalleryDiscoveryProvenance;
  candidateTokenIds: string[];
  cursor: {
    blockNumber: string;
    blockHash: Hash;
  };
  updatedAt: number;
};

export function createGalleryDiscoveryProvenance(): GalleryDiscoveryProvenance {
  const config = BASE_SEPOLIA_TEST_GALLERY_CONFIG;
  return {
    chainId: config.chainId,
    galleryAddress: config.addresses.gallery.toLowerCase(),
    deploymentBlock: config.deployment.blockNumber.toString(),
    checkpointBlock: config.checkpoint.blockNumber.toString(),
    checkpointHash: config.checkpoint.blockHash,
    checkpointCandidateTokenIds: config.checkpoint.candidateTokenIds.map(
      (tokenId) => tokenId.toString(),
    ),
  };
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function provenanceMatches(
  value: unknown,
  expected: GalleryDiscoveryProvenance,
) {
  const candidate = record(value);
  if (!candidate) return false;
  return (
    candidate.chainId === expected.chainId &&
    candidate.galleryAddress === expected.galleryAddress &&
    candidate.deploymentBlock === expected.deploymentBlock &&
    candidate.checkpointBlock === expected.checkpointBlock &&
    candidate.checkpointHash === expected.checkpointHash &&
    Array.isArray(candidate.checkpointCandidateTokenIds) &&
    candidate.checkpointCandidateTokenIds.length ===
      expected.checkpointCandidateTokenIds.length &&
    candidate.checkpointCandidateTokenIds.every(
      (tokenId, index) =>
        tokenId === expected.checkpointCandidateTokenIds[index],
    )
  );
}

function parseDecimal(value: unknown) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > MAX_DECIMAL_CHARACTERS ||
    !/^(0|[1-9]\d*)$/.test(value)
  ) {
    return null;
  }
  try {
    return BigInt(value);
  } catch {
    return null;
  }
}

function parseCandidateTokenIds(
  value: unknown,
  provenance: GalleryDiscoveryProvenance,
) {
  if (!Array.isArray(value) || value.length > DISCOVERY_CACHE_MAX_CANDIDATES) {
    return null;
  }

  const candidateTokenIds: string[] = [];
  let previous = 0n;
  for (const rawTokenId of value) {
    const tokenId = parseDecimal(rawTokenId);
    if (
      tokenId === null ||
      tokenId < 1n ||
      tokenId > BigInt(DISCOVERY_CACHE_MAX_CANDIDATES) ||
      tokenId <= previous
    ) {
      return null;
    }
    previous = tokenId;
    candidateTokenIds.push(tokenId.toString());
  }

  if (
    provenance.checkpointCandidateTokenIds.some(
      (required) => !candidateTokenIds.includes(required),
    )
  ) {
    return null;
  }
  return candidateTokenIds;
}

export function parseGalleryDiscoveryCache(
  serialized: string | null,
  provenance: GalleryDiscoveryProvenance,
  { maxCursorBlock }: { maxCursorBlock?: bigint } = {},
): GalleryDiscoveryCache | null {
  if (
    serialized === null ||
    new TextEncoder().encode(serialized).byteLength > DISCOVERY_CACHE_MAX_BYTES
  ) {
    return null;
  }

  try {
    const parsed = record(JSON.parse(serialized));
    if (
      !parsed ||
      parsed.schemaVersion !== DISCOVERY_CACHE_SCHEMA_VERSION ||
      !provenanceMatches(parsed.provenance, provenance)
    ) {
      return null;
    }

    const candidateTokenIds = parseCandidateTokenIds(
      parsed.candidateTokenIds,
      provenance,
    );
    const cursor = record(parsed.cursor);
    const cursorBlock = parseDecimal(cursor?.blockNumber);
    const checkpointBlock = BigInt(provenance.checkpointBlock);
    if (
      !candidateTokenIds ||
      !cursor ||
      cursorBlock === null ||
      cursorBlock < checkpointBlock ||
      (maxCursorBlock !== undefined && cursorBlock > maxCursorBlock) ||
      typeof cursor.blockHash !== "string" ||
      !isHash(cursor.blockHash) ||
      typeof parsed.updatedAt !== "number" ||
      !Number.isFinite(parsed.updatedAt) ||
      parsed.updatedAt < 0
    ) {
      return null;
    }

    return {
      schemaVersion: DISCOVERY_CACHE_SCHEMA_VERSION,
      provenance,
      candidateTokenIds,
      cursor: {
        blockNumber: cursorBlock.toString(),
        blockHash: cursor.blockHash,
      },
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}

export function serializeGalleryDiscoveryCache(
  cache: GalleryDiscoveryCache,
): string {
  const serialized = JSON.stringify(cache);
  if (
    new TextEncoder().encode(serialized).byteLength > DISCOVERY_CACHE_MAX_BYTES
  ) {
    throw new Error("Gallery discovery cache exceeds its storage budget");
  }
  return serialized;
}

export function mergeGalleryDiscoveryCaches(
  first: GalleryDiscoveryCache,
  second: GalleryDiscoveryCache,
): GalleryDiscoveryCache {
  if (JSON.stringify(first.provenance) !== JSON.stringify(second.provenance)) {
    throw new Error("Cannot merge discovery caches from different provenance");
  }

  const candidates = [...first.candidateTokenIds, ...second.candidateTokenIds]
    .map(BigInt)
    .sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));
  const uniqueCandidates = [...new Set(candidates)];
  if (uniqueCandidates.length > DISCOVERY_CACHE_MAX_CANDIDATES) {
    throw new Error("Merged discovery cache exceeds the collection bound");
  }

  const firstCursor = BigInt(first.cursor.blockNumber);
  const secondCursor = BigInt(second.cursor.blockNumber);
  if (
    firstCursor === secondCursor &&
    first.cursor.blockHash !== second.cursor.blockHash
  ) {
    throw new Error("Cannot merge conflicting discovery cursor hashes");
  }
  const newest = firstCursor >= secondCursor ? first : second;

  return {
    ...newest,
    candidateTokenIds: uniqueCandidates.map(String),
    updatedAt: Math.max(first.updatedAt, second.updatedAt),
  };
}
