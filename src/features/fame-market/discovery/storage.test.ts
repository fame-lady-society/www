import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createGalleryCustodyCacheIdentity,
  createGalleryCustodyHintCache,
} from "./cache";
import {
  createGalleryCustodyHintStorage,
  type GalleryCustodyStorageLike,
  type GalleryDiscoveryLock,
} from "./storage";

const identity = createGalleryCustodyCacheIdentity();

function memoryStorage(): GalleryCustodyStorageLike & {
  values: Map<string, string>;
} {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

const lock: GalleryDiscoveryLock = {
  request: async (_name, callback) => callback(),
};

describe("gallery custody hint storage", () => {
  it("uses a deployment-scoped key and replaces stale hints after a full scan", async () => {
    const browser = memoryStorage();
    const storage = createGalleryCustodyHintStorage({
      storage: browser,
      lock,
      identity,
    });

    await storage.commit(createGalleryCustodyHintCache([1n, 2n], 1));
    await storage.commit(createGalleryCustodyHintCache([2n, 3n], 2));

    assert.match(storage.key, /84532/);
    assert.match(storage.key, /44329992/);
    assert.deepEqual(storage.restore()?.heldTokenIds, ["2", "3"]);
  });

  it("falls back to session memory when browser persistence is unavailable", async () => {
    const storage = createGalleryCustodyHintStorage({
      storage: null,
      lock: null,
      identity,
    });
    const cache = createGalleryCustodyHintCache([4n], 1);

    assert.equal((await storage.commit(cache)).status, "memory_only");
    assert.deepEqual(storage.restore(), cache);
  });
});
