import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BASE_SEPOLIA_TEST_GALLERY_CONFIG } from "../config/baseSepoliaTestGallery";
import {
  discoverGalleryListings,
  type GalleryCandidateVerification,
  type GalleryDiscoveryEvent,
  type GalleryDiscoverySource,
} from "./discovery";
import {
  createGalleryDiscoveryProvenance,
  type GalleryDiscoveryCache,
} from "./cache";

const config = BASE_SEPOLIA_TEST_GALLERY_CONFIG;
const provenance = createGalleryDiscoveryProvenance();

function cache(
  candidates: string[],
  blockNumber = config.checkpoint.blockNumber,
): GalleryDiscoveryCache {
  return {
    schemaVersion: 1,
    provenance,
    candidateTokenIds: candidates,
    cursor: {
      blockNumber: blockNumber.toString(),
      blockHash:
        blockNumber === config.checkpoint.blockNumber
          ? config.checkpoint.blockHash
          : "0x1111111111111111111111111111111111111111111111111111111111111111",
    },
    updatedAt: 1,
  };
}

function source(options?: {
  head?: bigint;
  events?: GalleryDiscoveryEvent[];
  failRangeContaining?: bigint;
  inactive?: readonly bigint[];
  checkpointMismatch?: boolean;
}) {
  const eventCalls: { fromBlock: bigint; toBlock: bigint }[] = [];
  const hash = (blockNumber: bigint) => {
    if (blockNumber === config.deployment.blockNumber) {
      return config.deployment.blockHash;
    }
    if (blockNumber === config.checkpoint.blockNumber) {
      if (options?.checkpointMismatch) {
        return "0x3333333333333333333333333333333333333333333333333333333333333333";
      }
      return config.checkpoint.blockHash;
    }
    return "0x1111111111111111111111111111111111111111111111111111111111111111" as const;
  };
  const discoverySource: GalleryDiscoverySource = {
    getBlockNumber: async () => options?.head ?? config.checkpoint.blockNumber,
    getBlockHash: async (blockNumber) => hash(blockNumber),
    getEvents: async (fromBlock, toBlock) => {
      eventCalls.push({ fromBlock, toBlock });
      if (
        options?.failRangeContaining !== undefined &&
        fromBlock <= options.failRangeContaining &&
        toBlock >= options.failRangeContaining
      ) {
        throw new Error("range unavailable");
      }
      return (options?.events ?? []).filter(
        (event) =>
          event.blockNumber >= fromBlock && event.blockNumber <= toBlock,
      );
    },
    verifyCandidates: async (tokenIds) =>
      new Map<bigint, GalleryCandidateVerification>(
        tokenIds.map((tokenId) => [
          tokenId,
          options?.inactive?.includes(tokenId)
            ? { status: "inactive" }
            : { status: "active" },
        ]),
      ),
  };
  return { discoverySource, eventCalls };
}

describe("gallery listing discovery", () => {
  it("replays overlap, verifies candidates, and advances only after catch-up", async () => {
    const head = config.checkpoint.blockNumber + 10n;
    const listedAtHead: GalleryDiscoveryEvent = {
      eventName: "Listed",
      tokenId: 2n,
      blockNumber: head,
    };
    const mock = source({ head, events: [listedAtHead] });
    const commits: GalleryDiscoveryCache[] = [];

    const result = await discoverGalleryListings({
      source: mock.discoverySource,
      restoredCache: cache(["1"]),
      persist: async (record) => {
        commits.push(record);
      },
      now: () => 5_000,
    });

    assert.equal(result.status, "complete");
    assert.deepEqual(result.activeTokenIds, [1n, 2n]);
    assert.equal(mock.eventCalls[0]?.fromBlock, config.deployment.blockNumber);
    assert.equal(commits[0]?.cursor.blockNumber, head.toString());
  });

  it("rebuilds from deployment history when cache provenance is unusable", async () => {
    const mock = source({
      checkpointMismatch: true,
      events: [
        {
          eventName: "Filled",
          tokenId: 1n,
          blockNumber: config.checkpoint.blockNumber,
        },
      ],
    });

    const result = await discoverGalleryListings({
      source: mock.discoverySource,
      restoredCache: null,
      persist: async () => undefined,
    });

    assert.equal(result.status, "complete");
    assert.equal(mock.eventCalls[0]?.fromBlock, config.deployment.blockNumber);
    assert.deepEqual(result.candidateTokenIds, [1n]);
  });

  it("preserves the prior cursor and revalidates retained candidates after a middle chunk failure", async () => {
    const priorCursor = config.checkpoint.blockNumber + 100n;
    const head = priorCursor + 20_000n;
    const mock = source({
      head,
      failRangeContaining: priorCursor + 10_500n,
      inactive: [1n],
    });
    let persisted = false;

    const result = await discoverGalleryListings({
      source: mock.discoverySource,
      restoredCache: cache(["1", "2"], priorCursor),
      persist: async () => {
        persisted = true;
      },
    });

    assert.equal(result.status, "discovery_incomplete");
    assert.equal(result.cursor.blockNumber, priorCursor);
    assert.deepEqual(result.activeTokenIds, [2n]);
    assert.equal(persisted, false);
  });
});
