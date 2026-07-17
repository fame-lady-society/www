import {
  mergeGalleryDiscoveryCaches,
  parseGalleryDiscoveryCache,
  serializeGalleryDiscoveryCache,
  type GalleryDiscoveryCache,
  type GalleryDiscoveryProvenance,
} from "./cache";

export type GalleryDiscoveryStorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

export type GalleryDiscoveryLock = {
  request<T>(name: string, callback: () => Promise<T>): Promise<T>;
};

export type GalleryDiscoveryStorage = {
  key: string;
  restore: () => GalleryDiscoveryCache | null;
  commit: (record: GalleryDiscoveryCache) => Promise<{
    status: "persisted" | "memory_only";
    record: GalleryDiscoveryCache;
  }>;
};

function provenanceSuffix(provenance: GalleryDiscoveryProvenance) {
  return [
    provenance.chainId,
    provenance.galleryAddress,
    provenance.deploymentBlock,
    provenance.checkpointBlock,
    provenance.checkpointHash,
  ].join(":");
}

export function createGalleryDiscoveryStorage({
  storage,
  lock,
  provenance,
}: {
  storage: GalleryDiscoveryStorageLike | null;
  lock: GalleryDiscoveryLock | null;
  provenance: GalleryDiscoveryProvenance;
}): GalleryDiscoveryStorage {
  const suffix = provenanceSuffix(provenance);
  const key = `fame-gallery:discovery:${suffix}`;
  const lockName = `fame-gallery:discovery-lock:${suffix}`;
  let memory: GalleryDiscoveryCache | null = null;

  const restorePersistent = () => {
    if (!storage) return null;
    try {
      return parseGalleryDiscoveryCache(storage.getItem(key), provenance);
    } catch {
      return null;
    }
  };

  return {
    key,
    restore() {
      return memory ?? restorePersistent();
    },
    async commit(record) {
      const normalized = parseGalleryDiscoveryCache(
        serializeGalleryDiscoveryCache(record),
        provenance,
      );
      if (!normalized) {
        throw new Error(
          "Refusing to commit an invalid gallery discovery cache",
        );
      }
      memory = memory
        ? mergeGalleryDiscoveryCaches(memory, normalized)
        : normalized;

      if (!storage || !lock) {
        return {
          status: "memory_only",
          record: memory,
        };
      }

      try {
        const persisted = await lock.request(lockName, async () => {
          const current = restorePersistent();
          const merged = current
            ? mergeGalleryDiscoveryCaches(current, normalized)
            : normalized;
          storage.setItem(key, serializeGalleryDiscoveryCache(merged));
          return merged;
        });
        memory = memory
          ? mergeGalleryDiscoveryCaches(memory, persisted)
          : persisted;
        return {
          status: "persisted",
          record: memory,
        };
      } catch {
        return {
          status: "memory_only",
          record: memory,
        };
      }
    },
  };
}
