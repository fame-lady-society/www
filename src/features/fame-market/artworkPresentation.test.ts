import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { FameArtworkRevision } from "@/features/fame/metadata";
import { loadFameMarketArtworkPresentation } from "./artworkPresentation";

const targetHash = `0x${"ab".repeat(32)}` as const;
const targetRevision: FameArtworkRevision = {
  tokenId: "652",
  tokenUri: "https://gateway.irys.xyz/metadata",
  artworkHash: targetHash,
};

function completeLocations(nextTokenId = 654) {
  return Array.from({ length: nextTokenId - 1 }, (_, index) => ({
    tokenId: index + 1,
    artworkHash: `0x${(index + 1).toString(16).padStart(64, "0")}` as const,
  }));
}

function metadataFor(revision: Pick<FameArtworkRevision, "tokenUri">) {
  return Promise.resolve({
    status: "ready" as const,
    image: `${revision.tokenUri}/image`,
    name: "FAME Society",
    description: "Current artwork",
    attributes: [],
    error: null,
  });
}

describe("FAME market artwork presentation", () => {
  it("resolves an artwork hash to its current Society token", async () => {
    const locations = completeLocations();
    locations[651] = { tokenId: 652, artworkHash: targetHash };
    let revisionBlock: string | undefined;
    const result = await loadFameMarketArtworkPresentation(targetHash, {
      readLocations: async () => ({
        blockNumber: "123",
        nextTokenId: 654,
        locations,
      }),
      readRevision: async (tokenId, artworkHash, blockNumber) => {
        assert.equal(tokenId, 652);
        assert.equal(artworkHash, targetHash);
        revisionBlock = blockNumber;
        return targetRevision;
      },
      readRegistry: async () => ({ entries: [] }),
      resolveMetadata: metadataFor,
    });

    assert.equal(revisionBlock, "123");
    assert.equal(result.status, "found");
    if (result.status !== "found") return;
    assert.equal(result.tokenId, 652);
    assert.deepEqual(result.revision, targetRevision);
    assert.equal(result.metadata.status, "ready");
  });

  it("distinguishes unknown, ambiguous, and failed artwork lookups", async () => {
    const unrelated = completeLocations();
    const unknown = await loadFameMarketArtworkPresentation(targetHash, {
      readLocations: async () => ({
        blockNumber: "123",
        nextTokenId: 654,
        locations: unrelated,
      }),
      readRevision: async () => {
        throw new Error("not reached");
      },
      readRegistry: async () => ({ entries: [] }),
      resolveMetadata: async () => {
        throw new Error("not reached");
      },
    });
    assert.equal(unknown.status, "not-found");

    const ambiguous = await loadFameMarketArtworkPresentation(targetHash, {
      readLocations: async () => ({
        nextTokenId: 654,
        locations: unrelated.map((location) =>
          location.tokenId === 652 || location.tokenId === 653
            ? { ...location, artworkHash: targetHash }
            : location,
        ),
      }),
      readRevision: async () => targetRevision,
      readRegistry: async () => ({ entries: [] }),
      resolveMetadata: async () => ({
        status: "ready",
        image: "/image.png",
        name: "Duplicated artwork",
        description: null,
        attributes: [],
        error: null,
      }),
    });
    assert.equal(ambiguous.status, "ambiguous");

    const previousError = console.error;
    console.error = () => undefined;
    try {
      const missingRevision = await loadFameMarketArtworkPresentation(
        targetHash,
        {
          readLocations: async () => ({
            blockNumber: "123",
            nextTokenId: 654,
            locations: unrelated.map((location) =>
              location.tokenId === 652
                ? { ...location, artworkHash: targetHash }
                : location,
            ),
          }),
          readRevision: async () => null,
          readRegistry: async () => ({ entries: [] }),
          resolveMetadata: metadataFor,
        },
      );
      assert.equal(missingRevision.status, "unavailable");

      const unavailable = await loadFameMarketArtworkPresentation(targetHash, {
        readLocations: async () => {
          throw new Error("RPC unavailable");
        },
        readRevision: async () => null,
        readRegistry: async () => ({ entries: [] }),
        resolveMetadata: async () => {
          throw new Error("not reached");
        },
      });
      assert.equal(unavailable.status, "unavailable");
    } finally {
      console.error = previousError;
    }
  });

  it("keeps registered artwork readable after it is no longer assigned", async () => {
    const archivedUri = "https://gateway.irys.xyz/archived-metadata";
    const { keccak256, stringToHex } = await import("viem");
    const archivedHash = keccak256(stringToHex(archivedUri));
    const locations = completeLocations();

    const result = await loadFameMarketArtworkPresentation(archivedHash, {
      readLocations: async () => ({
        blockNumber: "456",
        nextTokenId: 654,
        locations,
      }),
      readRevision: async () => null,
      readRegistry: async (blockNumber) => {
        assert.equal(blockNumber, "456");
        return { entries: [{ metadataId: 7, tokenUri: archivedUri }] };
      },
      resolveMetadata: metadataFor,
    });

    assert.equal(result.status, "unassigned");
    assert.equal(result.revision, null);
    assert.equal(result.metadata.status, "ready");
  });

  it("ignores duplicate artwork aliases outside the released range", async () => {
    const locations = completeLocations();
    locations[444] = { tokenId: 445, artworkHash: targetHash };

    const result = await loadFameMarketArtworkPresentation(targetHash, {
      readLocations: async () => ({
        blockNumber: "789",
        nextTokenId: 654,
        locations,
      }),
      readRevision: async (tokenId) => ({
        ...targetRevision,
        tokenId: tokenId.toString(),
      }),
      readRegistry: async () => ({ entries: [] }),
      resolveMetadata: metadataFor,
    });

    assert.equal(result.status, "found");
    if (result.status !== "found") return;
    assert.equal(result.tokenId, 445);
  });
});
