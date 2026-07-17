import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BASE_SEPOLIA_TEST_GALLERY_CONFIG } from "../config/baseSepoliaTestGallery";
import {
  createGalleryDiscoveryProvenance,
  parseGalleryDiscoveryCache,
  type GalleryDiscoveryCache,
} from "./cache";
import {
  createGalleryDiscoveryStorage,
  type GalleryDiscoveryLock,
  type GalleryDiscoveryStorageLike,
} from "./storage";

const provenance = createGalleryDiscoveryProvenance();

function cache(
  candidateTokenIds: string[],
  blockNumber: bigint,
  blockHash: `0x${string}`,
): GalleryDiscoveryCache {
  return {
    schemaVersion: 1,
    provenance,
    candidateTokenIds,
    cursor: {
      blockNumber: blockNumber.toString(),
      blockHash,
    },
    updatedAt: Number(blockNumber),
  };
}

function memoryStorage(): GalleryDiscoveryStorageLike & {
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

function serializedLock(): GalleryDiscoveryLock {
  let tail = Promise.resolve();
  return {
    request(_name, callback) {
      const result = tail.then(callback);
      tail = result.then(
        () => undefined,
        () => undefined,
      );
      return result;
    },
  };
}

describe("gallery discovery storage", () => {
  it("serializes, re-reads, and merges concurrent tab writes", async () => {
    const storage = memoryStorage();
    const lock = serializedLock();
    const first = createGalleryDiscoveryStorage({
      storage,
      lock,
      provenance,
    });
    const second = createGalleryDiscoveryStorage({
      storage,
      lock,
      provenance,
    });
    const newer = cache(
      ["1", "3"],
      44_268_000n,
      "0x1111111111111111111111111111111111111111111111111111111111111111",
    );
    const older = cache(
      ["1", "2"],
      44_267_900n,
      "0x2222222222222222222222222222222222222222222222222222222222222222",
    );

    await Promise.all([first.commit(newer), second.commit(older)]);
    const stored = parseGalleryDiscoveryCache(
      [...storage.values.values()][0] ?? "",
      provenance,
    );

    assert.equal(stored?.cursor.blockNumber, "44268000");
    assert.deepEqual(stored?.candidateTokenIds, ["1", "2", "3"]);
  });

  it("keeps session state and skips persistent writes without Web Locks", async () => {
    const storage = memoryStorage();
    const discoveryStorage = createGalleryDiscoveryStorage({
      storage,
      lock: null,
      provenance,
    });
    const record = cache(
      ["1"],
      BASE_SEPOLIA_TEST_GALLERY_CONFIG.checkpoint.blockNumber,
      BASE_SEPOLIA_TEST_GALLERY_CONFIG.checkpoint.blockHash,
    );

    const result = await discoveryStorage.commit(record);

    assert.equal(result.status, "memory_only");
    assert.equal(storage.values.size, 0);
    assert.deepEqual(discoveryStorage.restore(), record);
  });

  it("survives storage quota failures without claiming persistence", async () => {
    const discoveryStorage = createGalleryDiscoveryStorage({
      storage: {
        getItem: () => null,
        setItem: () => {
          throw new Error("quota");
        },
      },
      lock: serializedLock(),
      provenance,
    });
    const record = cache(
      ["1"],
      BASE_SEPOLIA_TEST_GALLERY_CONFIG.checkpoint.blockNumber,
      BASE_SEPOLIA_TEST_GALLERY_CONFIG.checkpoint.blockHash,
    );

    assert.equal((await discoveryStorage.commit(record)).status, "memory_only");
    assert.deepEqual(discoveryStorage.restore(), record);
  });
});
