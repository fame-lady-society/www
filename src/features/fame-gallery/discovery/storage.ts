import {
  parseGalleryCustodyHintCache,
  serializeGalleryCustodyHintCache,
  type GalleryCustodyCacheIdentity,
  type GalleryCustodyHintCache,
} from "./cache";

export type GalleryCustodyStorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

export type GalleryDiscoveryLock = {
  request<T>(name: string, callback: () => Promise<T>): Promise<T>;
};

export type GalleryCustodyHintStorage = {
  key: string;
  restore: () => GalleryCustodyHintCache | null;
  commit: (record: GalleryCustodyHintCache) => Promise<{
    status: "persisted" | "memory_only";
    record: GalleryCustodyHintCache;
  }>;
};

function identitySuffix(identity: GalleryCustodyCacheIdentity) {
  return [
    identity.chainId,
    identity.manifestVersion,
    identity.marketplaceAddress,
    identity.deploymentBlock,
    identity.firstTokenId,
    identity.lastTokenId,
  ].join(":");
}

export function createGalleryCustodyHintStorage({
  storage,
  lock,
  identity,
}: {
  storage: GalleryCustodyStorageLike | null;
  lock: GalleryDiscoveryLock | null;
  identity: GalleryCustodyCacheIdentity;
}): GalleryCustodyHintStorage {
  const suffix = identitySuffix(identity);
  const key = `fame-gallery:custody-hints:${suffix}`;
  const lockName = `fame-gallery:custody-hints-lock:${suffix}`;
  let memory: GalleryCustodyHintCache | null = null;

  const normalize = (record: GalleryCustodyHintCache) => {
    const parsed = parseGalleryCustodyHintCache(
      serializeGalleryCustodyHintCache(record),
      identity,
    );
    if (!parsed) throw new Error("Invalid gallery custody hint record");
    return parsed;
  };

  const restorePersistent = () => {
    if (!storage) return null;
    try {
      return parseGalleryCustodyHintCache(storage.getItem(key), identity);
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
      memory = normalize(record);
      if (!storage || !lock) {
        return { status: "memory_only", record: memory };
      }

      try {
        const persisted = await lock.request(lockName, async () => {
          storage.setItem(key, serializeGalleryCustodyHintCache(memory!));
          return memory!;
        });
        memory = persisted;
        return { status: "persisted", record: memory };
      } catch {
        return { status: "memory_only", record: memory };
      }
    },
  };
}

export type GalleryDiscoveryStorage = GalleryCustodyHintStorage;
