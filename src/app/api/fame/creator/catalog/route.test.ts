import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
  FameCreatorCatalogOptions,
  FameCreatorCatalogResult,
} from "@/features/fame/creatorCatalog";
import { handleFameCreatorCatalogRequest } from "./route";

const emptyResult: FameCreatorCatalogResult = {
  blockNumber: 456n,
  nextTokenId: 650,
  artworks: [],
  nextCursor: 49,
};

describe("GET /api/fame/creator/catalog", () => {
  it("passes cursor and pinned block for infinite-scroll continuation", async () => {
    let received: FameCreatorCatalogOptions | undefined;
    const response = await handleFameCreatorCatalogRequest(
      new Request(
        "http://localhost/api/fame/creator/catalog?cursor=49&blockNumber=456",
      ),
      async (options) => {
        received = options;
        return emptyResult;
      },
    );

    assert.equal(response.status, 200);
    assert.deepEqual(received, { cursor: 49, blockNumber: 456n });
    assert.equal(response.headers.get("cache-control"), "no-store");
  });

  it("supports exact lookup without a cursor or pinned block", async () => {
    let received: FameCreatorCatalogOptions | undefined;
    const response = await handleFameCreatorCatalogRequest(
      new Request("http://localhost/api/fame/creator/catalog?tokenId=646"),
      async (options) => {
        received = options;
        return { ...emptyResult, artworks: [], nextCursor: null };
      },
    );

    assert.equal(response.status, 200);
    assert.deepEqual(received, { tokenId: 646 });
  });

  it("rejects malformed and mixed lookup parameters", async () => {
    for (const query of [
      "tokenId=1.5",
      "tokenId=646&cursor=1",
      "cursor=-1",
      "blockNumber=0",
      "cursor=49",
      "blockNumber=456",
    ]) {
      const response = await handleFameCreatorCatalogRequest(
        new Request(`http://localhost/api/fame/creator/catalog?${query}`),
        async () => emptyResult,
      );
      assert.equal(response.status, 400, query);
    }
  });

  it("returns a retryable response for catalog failures", async () => {
    const response = await handleFameCreatorCatalogRequest(
      new Request("http://localhost/api/fame/creator/catalog"),
      async () => {
        throw new Error("RPC unavailable");
      },
    );
    assert.equal(response.status, 503);
  });
});
