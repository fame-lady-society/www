import { isAddressEqual, type Address } from "viem";
import type {
  GalleryArtworkTarget,
  GalleryCustodyState,
  GalleryProjectionResult,
  GalleryTokenState,
} from "../types";

export const GALLERY_CUSTODY_SCAN_BATCH_SIZE = 64;
export const GALLERY_CUSTODY_SCAN_CONCURRENCY = 2;

export type GalleryCustodyScanSource = {
  getBlockNumber: () => Promise<bigint>;
  readCustodyStates: (
    tokenIds: readonly bigint[],
    blockNumber: bigint,
  ) => Promise<
    ReadonlyMap<bigint, GalleryProjectionResult<GalleryCustodyState>>
  >;
  getAffectedTokenIds: (
    fromBlock: bigint,
    toBlock: bigint,
  ) => Promise<readonly bigint[]>;
  readTokenStates: (
    tokenIds: readonly bigint[],
    blockNumber: bigint,
  ) => Promise<ReadonlyMap<bigint, GalleryProjectionResult<GalleryTokenState>>>;
};

export type GalleryCustodyScanResult = {
  scanStartBlock: bigint;
  scanEndBlock: bigint;
  reconciliationBlock: bigint;
  heldTokenIds: bigint[];
  targets: GalleryArtworkTarget[];
  affectedTokenIds: bigint[];
  failedTokenIds: bigint[];
};

function sorted(values: Iterable<bigint>) {
  return [...new Set(values)].sort((left, right) =>
    left < right ? -1 : left > right ? 1 : 0,
  );
}

function assertNotCancelled(signal?: AbortSignal) {
  if (signal?.aborted) throw new Error("Gallery custody scan cancelled.");
}

export function chunkGalleryCustodyTokenIds(tokenIds: readonly bigint[]) {
  const chunks: bigint[][] = [];
  for (
    let index = 0;
    index < tokenIds.length;
    index += GALLERY_CUSTODY_SCAN_BATCH_SIZE
  ) {
    chunks.push(
      tokenIds.slice(index, index + GALLERY_CUSTODY_SCAN_BATCH_SIZE),
    );
  }
  return chunks;
}

export async function mapGalleryCustodyChunks<T>(
  tokenIds: readonly bigint[],
  operation: (tokenIds: readonly bigint[]) => Promise<T>,
  signal?: AbortSignal,
) {
  const chunks = chunkGalleryCustodyTokenIds(tokenIds);
  const results = new Array<T | null>(chunks.length).fill(null);
  let nextIndex = 0;
  const worker = async () => {
    while (nextIndex < chunks.length) {
      assertNotCancelled(signal);
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await operation(chunks[index]!);
    }
  };
  await Promise.all(
    Array.from(
      {
        length: Math.min(GALLERY_CUSTODY_SCAN_CONCURRENCY, chunks.length),
      },
      worker,
    ),
  );
  return chunks.map((tokenIds, index) => ({
    tokenIds,
    result: results[index]!,
  }));
}

function heldTarget(state: GalleryTokenState): GalleryArtworkTarget {
  return {
    targetId: `held:${state.tokenId.toString()}`,
    kind: "held",
    tokenId: state.tokenId,
    artworkHash: state.artworkHash,
    tokenUri: state.tokenUri,
    artworkError: state.artworkError,
  };
}

async function readCustodyWithIsolation(
  source: GalleryCustodyScanSource,
  tokenIds: readonly bigint[],
  blockNumber: bigint,
  signal?: AbortSignal,
) {
  return mapGalleryCustodyChunks(
    tokenIds,
    async (chunk) => {
      try {
        return await source.readCustodyStates(chunk, blockNumber);
      } catch {
        return new Map<
          bigint,
          GalleryProjectionResult<GalleryCustodyState>
        >();
      }
    },
    signal,
  );
}

async function readTokensWithIsolation(
  source: GalleryCustodyScanSource,
  tokenIds: readonly bigint[],
  blockNumber: bigint,
  signal?: AbortSignal,
) {
  return mapGalleryCustodyChunks(
    tokenIds,
    async (chunk) => {
      try {
        return await source.readTokenStates(chunk, blockNumber);
      } catch {
        return new Map<bigint, GalleryProjectionResult<GalleryTokenState>>();
      }
    },
    signal,
  );
}

export async function scanGalleryCustody({
  source,
  marketplace,
  firstTokenId = 1n,
  lastTokenId = 888n,
  signal,
}: {
  source: GalleryCustodyScanSource;
  marketplace: Address;
  firstTokenId?: bigint;
  lastTokenId?: bigint;
  signal?: AbortSignal;
}): Promise<GalleryCustodyScanResult> {
  assertNotCancelled(signal);
  const scanStartBlock = await source.getBlockNumber();
  const universe: bigint[] = [];
  for (
    let tokenId = firstTokenId;
    tokenId <= lastTokenId;
    tokenId += 1n
  ) {
    universe.push(tokenId);
  }

  const held = new Set<bigint>();
  const failed = new Set<bigint>();
  for (const { tokenIds, result } of await readCustodyWithIsolation(
    source,
    universe,
    scanStartBlock,
    signal,
  )) {
    for (const tokenId of tokenIds) {
      const projection = result.get(tokenId);
      if (projection?.status !== "success") {
        failed.add(tokenId);
      } else if (isAddressEqual(projection.data.owner, marketplace)) {
        held.add(tokenId);
      }
    }
  }

  assertNotCancelled(signal);
  const scanEndBlock = await source.getBlockNumber();
  const affected = sorted(
    await source.getAffectedTokenIds(scanStartBlock, scanEndBlock),
  );
  if (
    affected.some(
      (tokenId) => tokenId < firstTokenId || tokenId > lastTokenId,
    )
  ) {
    throw new Error("Gallery custody transfer is outside collection bounds.");
  }

  for (const { tokenIds, result } of await readCustodyWithIsolation(
    source,
    affected,
    scanEndBlock,
    signal,
  )) {
    for (const tokenId of tokenIds) {
      const projection = result.get(tokenId);
      if (projection?.status !== "success") {
        failed.add(tokenId);
        continue;
      }
      failed.delete(tokenId);
      if (isAddressEqual(projection.data.owner, marketplace)) held.add(tokenId);
      else held.delete(tokenId);
    }
  }

  const heldTokenIdsForHydration = sorted(held);
  const targets: GalleryArtworkTarget[] = [];
  for (const { tokenIds, result } of await readTokensWithIsolation(
    source,
    heldTokenIdsForHydration,
    scanEndBlock,
    signal,
  )) {
    for (const tokenId of tokenIds) {
      const projection = result.get(tokenId);
      if (
        projection?.status === "success" &&
        projection.data.marketplaceHeld &&
        isAddressEqual(projection.data.owner, marketplace)
      ) {
        targets.push(heldTarget(projection.data));
      } else {
        failed.add(tokenId);
        if (projection?.status === "success") held.delete(tokenId);
      }
    }
  }

  assertNotCancelled(signal);
  return {
    scanStartBlock,
    scanEndBlock,
    reconciliationBlock: scanEndBlock,
    heldTokenIds: sorted(held),
    targets: targets.sort((left, right) =>
      left.tokenId < right.tokenId ? -1 : left.tokenId > right.tokenId ? 1 : 0,
    ),
    affectedTokenIds: affected,
    failedTokenIds: sorted(failed),
  };
}
