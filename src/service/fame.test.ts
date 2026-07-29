import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Address } from "viem";
import {
  createOrderedBurnPoolDisplayCache,
  getOrderedBurnPoolTokenIds,
  readOrderedBurnPoolTokenIds,
  type BurnPoolStorageClient,
} from "./fame";

const FAME_ADDRESS =
  "0xf307e242BfE1EC1fF01a4Cef2fdaa81b10A52418" as Address;
const DN404_STORAGE_SLOT =
  "0xa20d6e21d0e5255308" as const satisfies `0x${string}`;
const PINNED_BLOCK = 55_000_123n;

function toHexWord(value: bigint): `0x${string}` {
  return `0x${value.toString(16).padStart(64, "0")}`;
}

function packDn404Header(fields: {
  numAliases?: number;
  nextTokenId?: number;
  burnedPoolHead: number;
  burnedPoolTail: number;
  totalNFTSupply?: number;
  totalSupply?: bigint;
}): `0x${string}` {
  let value = 0n;
  value |= BigInt(fields.numAliases ?? 0) & 0xffffffffn;
  value |= (BigInt(fields.nextTokenId ?? 1) & 0xffffffffn) << 32n;
  value |= (BigInt(fields.burnedPoolHead) & 0xffffffffn) << 64n;
  value |= (BigInt(fields.burnedPoolTail) & 0xffffffffn) << 96n;
  value |= (BigInt(fields.totalNFTSupply ?? 0) & 0xffffffffn) << 128n;
  value |= ((fields.totalSupply ?? 0n) & ((1n << 96n) - 1n)) << 160n;
  return toHexWord(value);
}

function burnedPoolSlotForIndex(index: bigint): `0x${string}` {
  const baseSlot = BigInt(DN404_STORAGE_SLOT);
  const mapSlot = baseSlot + 9n;
  const s = mapSlot * 2n ** 96n + index / 8n;
  return `0x${s.toString(16).padStart(64, "0")}`;
}

/**
 * Build a storage client that serves a FIFO burn pool at a single pinned block.
 * Records every getStorageAt call so tests can assert block pinning and no
 * tokenURI/metadata surface was needed for the focused path.
 */
function createFakeBurnPoolClient(options: {
  blockNumber: bigint;
  head: number;
  tokenIds: number[];
}): {
  client: BurnPoolStorageClient;
  storageCalls: Array<{
    address: Address;
    slot: `0x${string}`;
    blockNumber: bigint;
  }>;
  getBlockNumberCalls: number;
} {
  const storageCalls: Array<{
    address: Address;
    slot: `0x${string}`;
    blockNumber: bigint;
  }> = [];
  let getBlockNumberCalls = 0;

  const tail = options.head + options.tokenIds.length;
  const header = packDn404Header({
    burnedPoolHead: options.head,
    burnedPoolTail: tail,
    nextTokenId: 100,
  });

  // Pack FIFO entries into 8-wide storage words keyed by absolute index.
  const words = new Map<string, bigint>();
  for (let offset = 0; offset < options.tokenIds.length; offset++) {
    const index = BigInt(options.head + offset);
    const slot = burnedPoolSlotForIndex(index);
    const bitOffset = (index % 8n) * 32n;
    const prev = words.get(slot) ?? 0n;
    const token = BigInt(options.tokenIds[offset]) & 0xffffffffn;
    words.set(slot, prev | (token << bitOffset));
  }

  const client: BurnPoolStorageClient = {
    getBlockNumber: async () => {
      getBlockNumberCalls += 1;
      return options.blockNumber;
    },
    getStorageAt: async ({ address, slot, blockNumber }) => {
      storageCalls.push({ address, slot, blockNumber });
      if (slot === DN404_STORAGE_SLOT) {
        return header;
      }
      const word = words.get(slot);
      if (word === undefined) {
        return toHexWord(0n);
      }
      return toHexWord(word);
    },
  };

  return {
    client,
    storageCalls,
    get getBlockNumberCalls() {
      return getBlockNumberCalls;
    },
  };
}

describe("readOrderedBurnPoolTokenIds", () => {
  it("captures one block and uses it for the queue header and every FIFO entry", async () => {
    const tokenIds = [101, 202, 303];
    const fake = createFakeBurnPoolClient({
      blockNumber: PINNED_BLOCK,
      head: 0,
      tokenIds,
    });

    const snapshot = await readOrderedBurnPoolTokenIds(
      fake.client,
      FAME_ADDRESS,
    );

    assert.equal(snapshot.blockNumber, PINNED_BLOCK);
    assert.deepEqual(snapshot.tokenIds, tokenIds);
    assert.equal(fake.getBlockNumberCalls, 1);
    assert.ok(fake.storageCalls.length >= 1 + tokenIds.length);

    for (const call of fake.storageCalls) {
      assert.equal(
        call.blockNumber,
        PINNED_BLOCK,
        "every storage read must pin the captured blockNumber, not latest",
      );
      assert.equal(call.address, FAME_ADDRESS);
    }

    // Header must be present exactly once among the storage calls.
    const headerCalls = fake.storageCalls.filter(
      (call) => call.slot === DN404_STORAGE_SLOT,
    );
    assert.equal(headerCalls.length, 1);
  });

  it("preserves exact FIFO order across non-zero head offsets", async () => {
    const tokenIds = [7, 8, 9, 10];
    const fake = createFakeBurnPoolClient({
      blockNumber: 99n,
      head: 5,
      tokenIds,
    });

    const snapshot = await readOrderedBurnPoolTokenIds(
      fake.client,
      FAME_ADDRESS,
    );
    assert.deepEqual(snapshot.tokenIds, tokenIds);
    assert.equal(snapshot.blockNumber, 99n);
  });

  it("returns an empty ordered list when the queue is empty", async () => {
    const fake = createFakeBurnPoolClient({
      blockNumber: PINNED_BLOCK,
      head: 3,
      tokenIds: [],
    });
    // Empty pool: head === tail; createFake uses head + length for tail.
    const snapshot = await readOrderedBurnPoolTokenIds(
      fake.client,
      FAME_ADDRESS,
    );
    assert.deepEqual(snapshot.tokenIds, []);
    assert.equal(fake.storageCalls.length, 1); // header only
  });

  it("focused path only touches storage — no tokenURI or remote metadata surface", async () => {
    const fake = createFakeBurnPoolClient({
      blockNumber: PINNED_BLOCK,
      head: 0,
      tokenIds: [1, 2],
    });

    // The client interface itself has no tokenURI/readContract/fetch — the
    // focused path cannot call them without a type error / runtime throw.
    const clientKeys = Object.keys(fake.client).sort();
    assert.deepEqual(clientKeys, ["getBlockNumber", "getStorageAt"]);

    await readOrderedBurnPoolTokenIds(fake.client, FAME_ADDRESS);
    assert.ok(
      fake.storageCalls.every((call) => typeof call.slot === "string"),
    );
  });
});

describe("getOrderedBurnPoolTokenIds display vs execution cache", () => {
  it("reuses a coherent display snapshot within the TTL", async () => {
    const fake = createFakeBurnPoolClient({
      blockNumber: PINNED_BLOCK,
      head: 0,
      tokenIds: [11, 22, 33],
    });
    const displayCache = await createOrderedBurnPoolDisplayCache();
    let now = 1_000_000;

    const first = await getOrderedBurnPoolTokenIds({
      cache: "display",
      client: fake.client,
      fameAddress: FAME_ADDRESS,
      now: () => now,
      displayTtlMs: 20_000,
      displayCache,
    });
    assert.deepEqual(first.tokenIds, [11, 22, 33]);
    assert.equal(fake.getBlockNumberCalls, 1);

    now += 5_000;
    const second = await getOrderedBurnPoolTokenIds({
      cache: "display",
      client: fake.client,
      fameAddress: FAME_ADDRESS,
      now: () => now,
      displayTtlMs: 20_000,
      displayCache,
    });
    assert.deepEqual(second, first);
    assert.equal(
      fake.getBlockNumberCalls,
      1,
      "display cache must reuse the coherent snapshot",
    );
  });

  it("execution mode always bypasses the display cache", async () => {
    const fake = createFakeBurnPoolClient({
      blockNumber: PINNED_BLOCK,
      head: 0,
      tokenIds: [44, 55],
    });
    const displayCache = await createOrderedBurnPoolDisplayCache();
    const now = 2_000_000;

    await getOrderedBurnPoolTokenIds({
      cache: "display",
      client: fake.client,
      fameAddress: FAME_ADDRESS,
      now: () => now,
      displayTtlMs: 20_000,
      displayCache,
    });
    assert.equal(fake.getBlockNumberCalls, 1);

    const execution = await getOrderedBurnPoolTokenIds({
      cache: "execution",
      client: fake.client,
      fameAddress: FAME_ADDRESS,
      now: () => now,
      displayTtlMs: 20_000,
      displayCache,
    });
    assert.deepEqual(execution.tokenIds, [44, 55]);
    assert.equal(
      fake.getBlockNumberCalls,
      2,
      "execution must not reuse the display cache",
    );

    // Display still hits cache after execution bypass (execution does not
    // write through — fresh read only for send authority).
    await getOrderedBurnPoolTokenIds({
      cache: "display",
      client: fake.client,
      fameAddress: FAME_ADDRESS,
      now: () => now,
      displayTtlMs: 20_000,
      displayCache,
    });
    assert.equal(fake.getBlockNumberCalls, 2);
  });

  it("display cache expires after the TTL and refetches a new coherent snapshot", async () => {
    let block = PINNED_BLOCK;
    let servedIds = [1, 2];
    const storageCalls: Array<{ blockNumber: bigint }> = [];

    const client: BurnPoolStorageClient = {
      getBlockNumber: async () => block,
      getStorageAt: async ({ slot, blockNumber }) => {
        storageCalls.push({ blockNumber });
        if (slot === DN404_STORAGE_SLOT) {
          return packDn404Header({
            burnedPoolHead: 0,
            burnedPoolTail: servedIds.length,
          });
        }
        // Single word packing for small pools starting at head 0.
        let word = 0n;
        for (let i = 0; i < servedIds.length; i++) {
          word |= (BigInt(servedIds[i]) & 0xffffffffn) << BigInt(i * 32);
        }
        return toHexWord(word);
      },
    };

    const displayCache = await createOrderedBurnPoolDisplayCache();
    let now = 0;

    const first = await getOrderedBurnPoolTokenIds({
      cache: "display",
      client,
      fameAddress: FAME_ADDRESS,
      now: () => now,
      displayTtlMs: 15_000,
      displayCache,
    });
    assert.deepEqual(first.tokenIds, [1, 2]);
    assert.equal(first.blockNumber, PINNED_BLOCK);

    // Advance past TTL and change the underlying pool.
    now = 15_001;
    block = PINNED_BLOCK + 10n;
    servedIds = [9, 8, 7];

    const second = await getOrderedBurnPoolTokenIds({
      cache: "display",
      client,
      fameAddress: FAME_ADDRESS,
      now: () => now,
      displayTtlMs: 15_000,
      displayCache,
    });
    assert.deepEqual(second.tokenIds, [9, 8, 7]);
    assert.equal(second.blockNumber, PINNED_BLOCK + 10n);

    // Every storage call on each fetch must use that fetch's pinned block.
    const firstFetchBlocks = storageCalls
      .slice(0, first.tokenIds.length + 1)
      .map((c) => c.blockNumber);
    assert.ok(firstFetchBlocks.every((b) => b === PINNED_BLOCK));
  });
});
