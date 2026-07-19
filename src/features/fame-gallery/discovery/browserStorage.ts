import { createGalleryCustodyCacheIdentity } from "./cache";
import {
  createGalleryCustodyHintStorage,
  type GalleryCustodyHintStorage,
  type GalleryDiscoveryLock,
} from "./storage";

let sharedStorage: GalleryCustodyHintStorage | null = null;

function browserLock(): GalleryDiscoveryLock | null {
  if (typeof navigator === "undefined" || !navigator.locks) return null;
  return {
    request(name, callback) {
      return navigator.locks.request(name, callback);
    },
  };
}

export function getBrowserGalleryCustodyHintStorage() {
  if (sharedStorage) return sharedStorage;

  let storage: Storage | null = null;
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    try {
      storage = window.localStorage;
    } catch {
      storage = null;
    }
  }
  sharedStorage = createGalleryCustodyHintStorage({
    storage,
    lock: browserLock(),
    identity: createGalleryCustodyCacheIdentity(),
  });
  return sharedStorage;
}
