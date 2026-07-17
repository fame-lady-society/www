import type { Address } from "viem";

export const GALLERY_RECOVERY_SCAN_BATCH_SIZE = 64;
export const GALLERY_RECOVERY_SCAN_CONCURRENCY = 2;

export type GalleryRecoveryState = {
  tokenId: bigint;
  owner: Address;
  listingActive: boolean;
};

export type GalleryRecoveryScanSource = {
  getBlockNumber: () => Promise<bigint>;
  readOwners: (
    tokenIds: readonly bigint[],
    blockNumber: bigint,
  ) => Promise<ReadonlyMap<bigint, Address>>;
  getAffectedTokenIds: (
    fromBlock: bigint,
    toBlock: bigint,
  ) => Promise<readonly bigint[]>;
  readFinalStates: (
    tokenIds: readonly bigint[],
    blockNumber: bigint,
  ) => Promise<ReadonlyMap<bigint, GalleryRecoveryState>>;
};

export type GalleryRecoveryScanResult = {
  scanStartBlock: bigint;
  scanEndBlock: bigint;
  reconciliationBlock: bigint;
  galleryOwnedTokenIds: bigint[];
  activeListingTokenIds: bigint[];
  affectedTokenIds: bigint[];
};

function tokenChunks(tokenIds: readonly bigint[]) {
  const chunks: bigint[][] = [];
  for (let index = 0; index < tokenIds.length; index += 64) {
    chunks.push(tokenIds.slice(index, index + 64));
  }
  return chunks;
}

function assertNotCancelled(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new Error("Gallery recovery scan cancelled.");
  }
}

async function mapWithTwoWorkers<T>(
  chunks: readonly bigint[][],
  signal: AbortSignal | undefined,
  operation: (chunk: readonly bigint[]) => Promise<T>,
) {
  const results = new Array<T>(chunks.length);
  let nextIndex = 0;
  const worker = async () => {
    while (nextIndex < chunks.length) {
      assertNotCancelled(signal);
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await operation(chunks[index]);
    }
  };
  await Promise.all(
    Array.from(
      { length: Math.min(GALLERY_RECOVERY_SCAN_CONCURRENCY, chunks.length) },
      () => worker(),
    ),
  );
  return results;
}

function sorted(values: Iterable<bigint>) {
  return [...values].sort((left, right) =>
    left < right ? -1 : left > right ? 1 : 0,
  );
}

function sameAddress(left: Address, right: Address) {
  return left.toLowerCase() === right.toLowerCase();
}

export async function scanGalleryRecoveryInventory({
  source,
  gallery,
  signal,
}: {
  source: GalleryRecoveryScanSource;
  gallery: Address;
  signal?: AbortSignal;
}): Promise<GalleryRecoveryScanResult> {
  assertNotCancelled(signal);
  const scanStartBlock = await source.getBlockNumber();
  const universe = Array.from({ length: 888 }, (_, index) => BigInt(index + 1));
  const ownerMaps = await mapWithTwoWorkers(
    tokenChunks(universe),
    signal,
    (chunk) => source.readOwners(chunk, scanStartBlock),
  );
  const galleryOwned = new Set<bigint>();
  for (const owners of ownerMaps) {
    for (const [tokenId, owner] of owners) {
      if (sameAddress(owner, gallery)) galleryOwned.add(tokenId);
    }
  }

  assertNotCancelled(signal);
  const scanEndBlock = await source.getBlockNumber();
  const affected = new Set(
    await source.getAffectedTokenIds(scanStartBlock, scanEndBlock),
  );
  for (const tokenId of affected) {
    if (tokenId < 1n || tokenId > 888n) {
      throw new Error("Recovery scan event token is outside 1-888.");
    }
  }

  const finalStateMaps =
    affected.size === 0
      ? []
      : await mapWithTwoWorkers(
          tokenChunks(sorted(affected)),
          signal,
          (chunk) => source.readFinalStates(chunk, scanEndBlock),
        );
  const activeListings = new Set<bigint>();
  for (const states of finalStateMaps) {
    for (const [tokenId, state] of states) {
      if (sameAddress(state.owner, gallery)) galleryOwned.add(tokenId);
      else galleryOwned.delete(tokenId);
      if (state.listingActive && sameAddress(state.owner, gallery)) {
        activeListings.add(tokenId);
      }
    }
  }

  assertNotCancelled(signal);
  return {
    scanStartBlock,
    scanEndBlock,
    reconciliationBlock: scanEndBlock,
    galleryOwnedTokenIds: sorted(galleryOwned),
    activeListingTokenIds: sorted(activeListings),
    affectedTokenIds: sorted(affected),
  };
}
