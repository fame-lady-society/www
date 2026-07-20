"use server";

import { type Address } from "viem";
import { client as baseClient } from "@/viem/base-client";
import { creatorArtistMagicAbi } from "@/wagmi";
import { base } from "viem/chains";
import {
  creatorArtistMagicAddress,
  fameFromNetwork,
} from "@/features/fame/contract";
import {
  FAME_METADATA_FALLBACK_IMAGE,
  fameMetadataFetchUrls,
  imageFromFameMetadata,
} from "./fameMetadata";

/** Coherent block-pinned FIFO burn-pool ID snapshot (no metadata). */
export type OrderedBurnPoolSnapshot = {
  blockNumber: bigint;
  tokenIds: number[];
};

/** Display traffic may reuse a short TTL; execution must bypass. */
export type BurnPoolSnapshotCacheMode = "display" | "execution";

/**
 * Minimal storage surface for focused burn-pool reads. Production uses the
 * Base public client; tests inject a fake that records block pinning.
 */
export type BurnPoolStorageClient = {
  getBlockNumber: () => Promise<bigint>;
  getStorageAt: (args: {
    address: Address;
    slot: `0x${string}`;
    blockNumber: bigint;
  }) => Promise<`0x${string}` | undefined>;
};

export type OrderedBurnPoolSnapshotOptions = {
  cache?: BurnPoolSnapshotCacheMode;
  client?: BurnPoolStorageClient;
  fameAddress?: Address;
  /** Injectable clock for display-cache TTL tests. */
  now?: () => number;
  /** Display cache TTL in ms (default 20s). */
  displayTtlMs?: number;
  /**
   * Injectable display cache store. Production uses the module singleton;
   * tests pass an isolated store so they do not share process state.
   */
  displayCache?: OrderedBurnPoolDisplayCache;
};

export type OrderedBurnPoolDisplayCache = {
  get: () => { snapshot: OrderedBurnPoolSnapshot; expiresAt: number } | null;
  set: (entry: {
    snapshot: OrderedBurnPoolSnapshot;
    expiresAt: number;
  }) => void;
  clear: () => void;
};

const DN404_STORAGE_SLOT = "0xa20d6e21d0e5255308" as const;
const DEFAULT_DISPLAY_TTL_MS = 20_000;

function createInMemoryDisplayCache(): OrderedBurnPoolDisplayCache {
  let entry: { snapshot: OrderedBurnPoolSnapshot; expiresAt: number } | null =
    null;
  return {
    get: () => entry,
    set: (next) => {
      entry = next;
    },
    clear: () => {
      entry = null;
    },
  };
}

/** Process-wide display cache for `/fame` and rotate-route SSR traffic. */
const defaultDisplayCache = createInMemoryDisplayCache();

const productionStorageClient: BurnPoolStorageClient = {
  getBlockNumber: () => baseClient.getBlockNumber(),
  getStorageAt: ({ address, slot, blockNumber }) =>
    baseClient.getStorageAt({ address, slot, blockNumber }),
};

/**
 * Creates an isolated in-memory display cache (for tests).
 * Exported as async to satisfy the file-level `"use server"` constraint.
 */
export async function createOrderedBurnPoolDisplayCache(): Promise<OrderedBurnPoolDisplayCache> {
  return createInMemoryDisplayCache();
}

/**
 * Clears the process-wide display cache (for tests / explicit invalidation).
 */
export async function clearOrderedBurnPoolDisplayCache(): Promise<void> {
  defaultDisplayCache.clear();
}

export async function getArtPoolRange() {
  const [startIndex, endIndex, nextIndex] = await Promise.all([
    baseClient.readContract({
      abi: creatorArtistMagicAbi,
      address: creatorArtistMagicAddress(base.id),
      functionName: "artPoolStartIndex",
    }),
    baseClient.readContract({
      abi: creatorArtistMagicAbi,
      address: creatorArtistMagicAddress(base.id),
      functionName: "artPoolEndIndex",
    }),
    baseClient.readContract({
      abi: creatorArtistMagicAbi,
      address: creatorArtistMagicAddress(base.id),
      functionName: "artPoolNext",
    }),
  ]);
  return {
    startIndex: Number(startIndex),
    endIndex: Number(endIndex),
    nextIndex: Number(nextIndex),
  };
}

async function fetchWithTimeout(
  url: string,
  timeoutMs = 10000,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchMetadataImage(uri: string): Promise<string> {
  let lastError: unknown = null;
  for (const fetchUrl of fameMetadataFetchUrls(uri)) {
    try {
      const response = await fetchWithTimeout(fetchUrl);
      if (!response.ok) {
        throw new Error(
          `Metadata request failed with ${response.status} ${response.statusText}`,
        );
      }

      return imageFromFameMetadata(await response.json());
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to fetch metadata image");
}

/**
 * Presentation helper: resolve a token image via tokenURI + metadata fetch,
 * falling back to the shared placeholder without throwing.
 */
export async function getFameTokenImage(tokenId: number): Promise<string> {
  try {
    const uri = await baseClient.readContract({
      abi: creatorArtistMagicAbi,
      address: creatorArtistMagicAddress(base.id),
      functionName: "tokenURI",
      args: [BigInt(tokenId)],
    });
    return await fetchMetadataImage(uri);
  } catch (error) {
    console.warn(`Failed to fetch metadata for token ${tokenId}:`, error);
    return FAME_METADATA_FALLBACK_IMAGE;
  }
}

/**
 * Read one coherent ordered burn-pool ID snapshot at a single Base block.
 * Does not call tokenURI or remote metadata — FIFO membership and order only.
 */
export async function readOrderedBurnPoolTokenIds(
  client: BurnPoolStorageClient,
  fameAddress: Address,
): Promise<OrderedBurnPoolSnapshot> {
  // Capture ONE block first; every subsequent storage read must pin to it.
  const blockNumber = await client.getBlockNumber();

  const slot0Hex = await client.getStorageAt({
    address: fameAddress,
    slot: DN404_STORAGE_SLOT,
    blockNumber,
  });

  if (!slot0Hex) {
    throw new Error("Failed to fetch DN404 queue header storage slot");
  }

  const storageSlotBigInt = BigInt(slot0Hex);
  const burnedPoolHead = extractUint32(storageSlotBigInt, 64);
  const burnedPoolTail = extractUint32(storageSlotBigInt, 96);

  const burnPool = await readBurnedPoolAtBlock(
    client,
    fameAddress,
    burnedPoolHead,
    burnedPoolTail,
    blockNumber,
  );

  return {
    blockNumber,
    tokenIds: burnPool.map((id) => Number(id)),
  };
}

/**
 * Focused ordered burn-pool IDs with optional brief display caching.
 * Default cache mode is `"display"` for `/fame` and route SSR.
 * Pass `{ cache: "execution" }` immediately before rotation simulation.
 */
export async function getOrderedBurnPoolTokenIds(
  options: OrderedBurnPoolSnapshotOptions = {},
): Promise<OrderedBurnPoolSnapshot> {
  const mode = options.cache ?? "display";
  const client = options.client ?? productionStorageClient;
  const fameAddress = options.fameAddress ?? fameFromNetwork(base.id);
  const now = options.now ?? Date.now;
  const displayTtlMs = options.displayTtlMs ?? DEFAULT_DISPLAY_TTL_MS;
  const displayCache = options.displayCache ?? defaultDisplayCache;

  if (mode === "display") {
    const cached = displayCache.get();
    if (cached && now() < cached.expiresAt) {
      return cached.snapshot;
    }
  }

  const snapshot = await readOrderedBurnPoolTokenIds(client, fameAddress);

  if (mode === "display") {
    displayCache.set({
      snapshot,
      expiresAt: now() + displayTtlMs,
    });
  }

  return snapshot;
}

export async function getFamePools() {
  // Burn-pool side: share the focused ordered ID snapshot (display cache OK).
  const { tokenIds: burnTokenIds } = await getOrderedBurnPoolTokenIds({
    cache: "display",
  });

  // Mint-pool side still needs DN404 nextTokenId from full storage.
  const { nextTokenId } = await getDN404Storage();

  const uris = await Promise.all(
    burnTokenIds.map((tokenId) =>
      baseClient
        .readContract({
          abi: creatorArtistMagicAbi,
          address: creatorArtistMagicAddress(base.id),
          functionName: "tokenURI",
          args: [BigInt(tokenId)],
        })
        .then((uri) => ({
          uri,
          tokenId,
        })),
    ),
  );

  const mintPoolEnd = await baseClient.readContract({
    abi: creatorArtistMagicAbi,
    address: creatorArtistMagicAddress(base.id),
    functionName: "nextTokenId",
  });

  const mintPoolUris = await Promise.all(
    Array.from(
      { length: Number(mintPoolEnd) - Number(nextTokenId) },
      (_, i) => {
        const tokenId = nextTokenId + BigInt(i);
        return baseClient
          .readContract({
            abi: creatorArtistMagicAbi,
            address: creatorArtistMagicAddress(base.id),
            functionName: "tokenURI",
            args: [tokenId],
          })
          .then((uri) => ({
            uri,
            tokenId: Number(tokenId),
          }));
      },
    ),
  );

  return {
    burnPool: await Promise.all(
      uris.map(async ({ uri, tokenId }) => {
        try {
          return {
            tokenId,
            image: await fetchMetadataImage(uri),
          };
        } catch (error) {
          console.warn(`Failed to fetch metadata for token ${tokenId}:`, error);
          return {
            tokenId,
            image: FAME_METADATA_FALLBACK_IMAGE,
          };
        }
      }),
    ),
    mintPool: await Promise.all(
      mintPoolUris.map(async ({ uri, tokenId }) => {
        try {
          return {
            tokenId,
            image: await fetchMetadataImage(uri),
          };
        } catch (error) {
          console.warn(`Failed to fetch metadata for token ${tokenId}:`, error);
          return {
            tokenId,
            image: FAME_METADATA_FALLBACK_IMAGE,
          };
        }
      }),
    ),
  };
}

interface DN404Storage {
  numAliases: bigint;
  nextTokenId: bigint;
  burnedPoolHead: bigint;
  burnedPoolTail: bigint;
  totalNFTSupply: bigint;
  totalSupply: bigint;
  burnPool: bigint[];
}

export async function getDN404Storage(): Promise<DN404Storage> {
  const fameAddress = fameFromNetwork(base.id);
  // Pin the full storage read to one block for internal coherence.
  const blockNumber = await productionStorageClient.getBlockNumber();

  const slot0Hex = await productionStorageClient.getStorageAt({
    address: fameAddress,
    slot: DN404_STORAGE_SLOT,
    blockNumber,
  });

  if (!slot0Hex) {
    throw new Error("Failed to fetch storage slots");
  }

  const storageSlotBigInt = BigInt(slot0Hex);
  const numAliases = extractUint32(storageSlotBigInt, 0);
  const nextTokenId = extractUint32(storageSlotBigInt, 32);
  const burnedPoolHead = extractUint32(storageSlotBigInt, 64);
  const burnedPoolTail = extractUint32(storageSlotBigInt, 96);
  const totalNFTSupply = extractUint32(storageSlotBigInt, 128);
  const totalSupply = extractUint96(storageSlotBigInt, 160);

  const burnPool = await readBurnedPoolAtBlock(
    productionStorageClient,
    fameAddress,
    burnedPoolHead,
    burnedPoolTail,
    blockNumber,
  );

  return {
    numAliases,
    nextTokenId,
    burnedPoolHead,
    burnedPoolTail,
    totalNFTSupply,
    totalSupply,
    burnPool,
  };
}

async function readBurnedPoolAtBlock(
  client: BurnPoolStorageClient,
  contractAddress: Address,
  burnedPoolHead: bigint,
  burnedPoolTail: bigint,
  blockNumber: bigint,
): Promise<bigint[]> {
  const baseSlot = BigInt(DN404_STORAGE_SLOT);
  const mapSlot = baseSlot + BigInt(9); // burnedPool is at baseSlot + 9

  const indices = Array.from(
    { length: Number(burnedPoolTail - burnedPoolHead) },
    (_, index) => BigInt(index) + burnedPoolHead,
  );

  const storagePromises = indices.map((i) => {
    const s = mapSlot * BigInt(2) ** BigInt(96) + i / BigInt(8);
    const slot = `0x${s.toString(16).padStart(64, "0")}` as `0x${string}`;

    return client.getStorageAt({
      address: contractAddress,
      slot,
      blockNumber,
    });
  });

  const storageValues = await Promise.all(storagePromises);

  return indices.map((i, index) => {
    const storageValueHex = storageValues[index];
    if (!storageValueHex) {
      throw new Error("Failed to fetch storage slot");
    }

    const storageValue = BigInt(storageValueHex);
    const o = (i % BigInt(8)) * BigInt(32);
    return extractUint32(storageValue, Number(o));
  });
}

function extractUint32(value: bigint, shiftBits: number) {
  return (value >> BigInt(shiftBits)) & BigInt(0xffffffff);
}

function extractUint96(value: bigint, shiftBits: number): bigint {
  return (value >> BigInt(shiftBits)) & ((BigInt(1) << BigInt(96)) - BigInt(1));
}
