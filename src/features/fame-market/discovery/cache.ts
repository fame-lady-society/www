import type { GalleryQueryIdentity } from "../queryKeys";

export const CUSTODY_HINT_CACHE_SCHEMA_VERSION = 1;
export const CUSTODY_HINT_CACHE_MAX_BYTES = 16_384;
const MAX_DECIMAL_CHARACTERS = 20;

export type GalleryCustodyCacheIdentity = {
  chainId: number;
  manifestVersion: number;
  marketplaceAddress: string;
  deploymentBlock: string;
  firstTokenId: string;
  lastTokenId: string;
};

export type GalleryCustodyHintCache = {
  schemaVersion: typeof CUSTODY_HINT_CACHE_SCHEMA_VERSION;
  identity: GalleryCustodyCacheIdentity;
  heldTokenIds: string[];
  updatedAt: number;
};

export function createGalleryCustodyCacheIdentity(
  identity: GalleryQueryIdentity,
  bounds: { firstTokenId: bigint; lastTokenId: bigint },
): GalleryCustodyCacheIdentity {
  if (!identity || !bounds) {
    throw new Error(
      "Gallery custody cache identity requires explicit runtime values.",
    );
  }
  return {
    chainId: identity.chainId,
    manifestVersion: identity.manifestVersion,
    marketplaceAddress: identity.marketplaceAddress.toLowerCase(),
    deploymentBlock: identity.deploymentBlock.toString(),
    firstTokenId: bounds.firstTokenId.toString(),
    lastTokenId: bounds.lastTokenId.toString(),
  };
}

function sortedUniqueTokenIds(tokenIds: readonly bigint[]) {
  return [...new Set(tokenIds)].sort((left, right) =>
    left < right ? -1 : left > right ? 1 : 0,
  );
}

export function createGalleryCustodyHintCache(
  heldTokenIds: readonly bigint[],
  identity: GalleryCustodyCacheIdentity,
  updatedAt = Date.now(),
): GalleryCustodyHintCache {
  if (!identity) {
    throw new Error(
      "Gallery custody hints require an explicit runtime identity.",
    );
  }
  return {
    schemaVersion: CUSTODY_HINT_CACHE_SCHEMA_VERSION,
    identity,
    heldTokenIds: sortedUniqueTokenIds(heldTokenIds).map(String),
    updatedAt,
  };
}

function objectRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function identityMatches(
  value: unknown,
  expected: GalleryCustodyCacheIdentity,
) {
  const candidate = objectRecord(value);
  return (
    candidate !== null &&
    candidate.chainId === expected.chainId &&
    candidate.manifestVersion === expected.manifestVersion &&
    candidate.marketplaceAddress === expected.marketplaceAddress &&
    candidate.deploymentBlock === expected.deploymentBlock &&
    candidate.firstTokenId === expected.firstTokenId &&
    candidate.lastTokenId === expected.lastTokenId
  );
}

function decimal(value: unknown) {
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

export function parseGalleryCustodyHintCache(
  serialized: string | null,
  identity: GalleryCustodyCacheIdentity,
): GalleryCustodyHintCache | null {
  if (
    serialized === null ||
    new TextEncoder().encode(serialized).byteLength >
      CUSTODY_HINT_CACHE_MAX_BYTES
  ) {
    return null;
  }

  try {
    const parsed = objectRecord(JSON.parse(serialized));
    if (
      !parsed ||
      parsed.schemaVersion !== CUSTODY_HINT_CACHE_SCHEMA_VERSION ||
      !identityMatches(parsed.identity, identity) ||
      !Array.isArray(parsed.heldTokenIds) ||
      typeof parsed.updatedAt !== "number" ||
      !Number.isFinite(parsed.updatedAt) ||
      parsed.updatedAt < 0
    ) {
      return null;
    }

    const firstTokenId = BigInt(identity.firstTokenId);
    const lastTokenId = BigInt(identity.lastTokenId);
    const heldTokenIds: string[] = [];
    let previous: bigint | null = null;
    for (const rawTokenId of parsed.heldTokenIds) {
      const tokenId = decimal(rawTokenId);
      if (
        tokenId === null ||
        tokenId < firstTokenId ||
        tokenId > lastTokenId ||
        (previous !== null && tokenId <= previous)
      ) {
        return null;
      }
      previous = tokenId;
      heldTokenIds.push(tokenId.toString());
    }

    return {
      schemaVersion: CUSTODY_HINT_CACHE_SCHEMA_VERSION,
      identity,
      heldTokenIds,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}

export function serializeGalleryCustodyHintCache(
  cache: GalleryCustodyHintCache,
) {
  const serialized = JSON.stringify(cache);
  if (
    new TextEncoder().encode(serialized).byteLength >
    CUSTODY_HINT_CACHE_MAX_BYTES
  ) {
    throw new Error("Gallery custody hints exceed their storage budget");
  }
  return serialized;
}
