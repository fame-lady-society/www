import { createGalleryDiscoveryProvenance } from "./cache";
import {
  createGalleryDiscoveryStorage,
  type GalleryDiscoveryLock,
  type GalleryDiscoveryStorage,
} from "./storage";

let sharedStorage: GalleryDiscoveryStorage | null = null;

function browserLock(): GalleryDiscoveryLock | null {
  if (typeof navigator === "undefined" || !navigator.locks) return null;
  return {
    request(name, callback) {
      return navigator.locks.request(name, callback);
    },
  };
}

export function getBrowserGalleryDiscoveryStorage() {
  if (sharedStorage) return sharedStorage;

  let storage: Storage | null = null;
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    try {
      storage = window.localStorage;
    } catch {
      storage = null;
    }
  }
  sharedStorage = createGalleryDiscoveryStorage({
    storage,
    lock: browserLock(),
    provenance: createGalleryDiscoveryProvenance(),
  });
  return sharedStorage;
}
