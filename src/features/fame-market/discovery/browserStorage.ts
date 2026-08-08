import type { GalleryCustodyCacheIdentity } from "./cache";
import {
  createGalleryCustodyHintStorage,
  type GalleryCustodyHintStorage,
  type GalleryDiscoveryLock,
} from "./storage";

const sharedStorage = new Map<string, GalleryCustodyHintStorage>();

function browserLock(): GalleryDiscoveryLock | null {
  if (typeof navigator === "undefined" || !navigator.locks) return null;
  return {
    request(name, callback) {
      return navigator.locks.request(name, callback);
    },
  };
}

export function getBrowserGalleryCustodyHintStorage(
  identity: GalleryCustodyCacheIdentity,
) {
  if (!identity) {
    throw new Error(
      "Gallery browser storage requires an explicit runtime identity.",
    );
  }
  const key = JSON.stringify(identity);
  const current = sharedStorage.get(key);
  if (current) return current;

  let storage: Storage | null = null;
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    try {
      storage = window.localStorage;
    } catch {
      storage = null;
    }
  }
  const created = createGalleryCustodyHintStorage({
    storage,
    lock: browserLock(),
    identity,
  });
  sharedStorage.set(key, created);
  return created;
}
