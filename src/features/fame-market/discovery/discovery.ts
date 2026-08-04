import { isAddressEqual, type Address } from "viem";
import type {
  GalleryArtworkTarget,
  GalleryProjectionResult,
  GalleryTokenState,
} from "../types";
import {
  createGalleryCustodyHintCache,
  type GalleryCustodyHintCache,
} from "./cache";
import {
  galleryHeldTarget,
  mapGalleryCustodyChunks,
  scanGalleryCustody,
  type GalleryCustodyScanSource,
} from "./recoveryScan";

export type GalleryCustodyDiscoverySource = GalleryCustodyScanSource;

export type GalleryCustodyDiscoveryResult = {
  targets: GalleryArtworkTarget[];
  scanCompleted: boolean;
};

export async function revalidateGalleryHeldTokenIds(
  source: GalleryCustodyDiscoverySource,
  tokenIds: readonly bigint[],
  {
    blockNumber,
    marketplace,
    signal,
  }: {
    blockNumber?: bigint;
    marketplace?: Address;
    signal?: AbortSignal;
  } = {},
) {
  if (tokenIds.length === 0) return [];
  const pinnedBlock = blockNumber ?? (await source.getBlockNumber());
  const targets: GalleryArtworkTarget[] = [];
  for (const { tokenIds: chunk, result } of await mapGalleryCustodyChunks(
    [...new Set(tokenIds)].sort((left, right) =>
      left < right ? -1 : left > right ? 1 : 0,
    ),
    async (ids) => {
      try {
        return await source.readTokenStates(ids, pinnedBlock);
      } catch {
        return new Map<bigint, GalleryProjectionResult<GalleryTokenState>>();
      }
    },
    signal,
  )) {
    for (const tokenId of chunk) {
      const projection = result.get(tokenId);
      if (
        projection?.status !== "success" ||
        !projection.data.marketplaceHeld ||
        (marketplace && !isAddressEqual(projection.data.owner, marketplace))
      ) {
        continue;
      }
      targets.push(galleryHeldTarget(projection.data));
    }
  }
  return targets;
}

export function createInitialGalleryScanRegistry() {
  const attempts = new Map<string, Promise<unknown>>();
  return {
    run<T>(key: string, attempt: () => Promise<T>) {
      const current = attempts.get(key);
      if (current) return current as Promise<T>;
      const started = attempt();
      attempts.set(key, started);
      return started;
    },
  };
}

const initialScanRegistry = createInitialGalleryScanRegistry();

export function runInitialGalleryScan<T>(
  deploymentKey: string,
  attempt: () => Promise<T>,
) {
  return initialScanRegistry.run(deploymentKey, attempt);
}

export async function discoverGalleryHoldings({
  source,
  marketplace,
  restoredHints,
  persist,
  onTargets,
  signal,
}: {
  source: GalleryCustodyDiscoverySource;
  marketplace: Address;
  restoredHints: GalleryCustodyHintCache | null;
  persist: (record: GalleryCustodyHintCache) => Promise<unknown>;
  onTargets?: (
    source: "hints" | "scan",
    targets: readonly GalleryArtworkTarget[],
  ) => void;
  signal?: AbortSignal;
}): Promise<GalleryCustodyDiscoveryResult> {
  // Start the full scan before doing anything with hints. Hints improve time to
  // first held artwork; they never replace the canonical page-load scan.
  const scan = scanGalleryCustody({ source, marketplace, signal }).then(
    (result) => ({ status: "success" as const, result }),
    () => ({ status: "failure" as const }),
  );
  const hintedIds = (restoredHints?.heldTokenIds ?? []).map(BigInt);
  let hintedTargets: GalleryArtworkTarget[] = [];
  try {
    hintedTargets = await revalidateGalleryHeldTokenIds(source, hintedIds, {
      marketplace,
      signal,
    });
  } catch {
    // Hints are disposable. Their read path cannot interrupt the full scan.
  }
  if (hintedTargets.length > 0) onTargets?.("hints", hintedTargets);

  const scanOutcome = await scan;
  if (scanOutcome.status === "success") {
    const { result } = scanOutcome;
    const fullDomainFailed = result.failedTokenIds.length >= 888;
    if (fullDomainFailed) {
      return { targets: hintedTargets, scanCompleted: false };
    }
    const failedTokenIds = new Set(result.failedTokenIds);
    const preservedHintTargets = hintedTargets.filter(({ tokenId }) =>
      failedTokenIds.has(tokenId),
    );
    const targetsById = new Map(
      result.targets.map((target) => [target.targetId, target]),
    );
    for (const target of preservedHintTargets) {
      if (!targetsById.has(target.targetId)) {
        targetsById.set(target.targetId, target);
      }
    }
    const targets = [...targetsById.values()].sort((left, right) =>
      left.tokenId < right.tokenId ? -1 : left.tokenId > right.tokenId ? 1 : 0,
    );
    const heldTokenIds = [
      ...new Set([
        ...result.heldTokenIds,
        ...preservedHintTargets.map(({ tokenId }) => tokenId),
      ]),
    ];
    try {
      await persist(createGalleryCustodyHintCache(heldTokenIds));
    } catch {
      // Browser persistence is an optimization, never catalog availability.
    }
    onTargets?.("scan", targets);
    return {
      targets,
      scanCompleted: result.failedTokenIds.length === 0,
    };
  }
  return { targets: hintedTargets, scanCompleted: false };
}
