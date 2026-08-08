import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NextRequest } from "next/server";
import type {
  FameGalleryCatalogOptions,
  FameGalleryCatalogResult,
} from "@/features/fame-gallery/catalog";
import { handleFameGalleryCatalogRequest } from "./route";

const emptyResult: FameGalleryCatalogResult = {
  blockNumber: 456n,
  artworks: [],
  nextCursor: 49,
};

describe("/api/fame/gallery", () => {
  it("passes the cursor and pinned block to the paginated catalog", async () => {
    let received: FameGalleryCatalogOptions | undefined;
    const response = await handleFameGalleryCatalogRequest(
      new NextRequest(
        "http://localhost/api/fame/gallery?cursor=49&blockNumber=456",
      ),
      async (options) => {
        received = options;
        return emptyResult;
      },
    );

    assert.equal(response.status, 200);
    assert.deepEqual(received, { cursor: 49, blockNumber: 456n });
    assert.deepEqual(await response.json(), {
      blockNumber: "456",
      artworks: [],
      nextCursor: 49,
    });
    assert.equal(response.headers.get("cache-control"), "no-store");
  });

  it("rejects malformed pagination parameters", async () => {
    const response = await handleFameGalleryCatalogRequest(
      new NextRequest(
        "http://localhost/api/fame/gallery?cursor=not-a-number&blockNumber=456",
      ),
      async () => emptyResult,
    );

    assert.equal(response.status, 400);
  });

  it("returns a retryable response when the catalog cannot be read", async () => {
    const response = await handleFameGalleryCatalogRequest(
      new NextRequest("http://localhost/api/fame/gallery"),
      async () => {
        throw new Error("RPC unavailable");
      },
    );

    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), {
      error: "FAME gallery catalog unavailable",
    });
  });
});
