import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NextRequest } from "next/server";
import type {
  FameArtworkRevision,
  FameMetadataBatchResult,
} from "@/features/fame/metadata";
import { handleFameMetadataBatchRequest } from "./route";

const artworkHash = `0x${"ab".repeat(32)}` as `0x${string}`;

function revision(tokenId: string): FameArtworkRevision {
  return {
    tokenId,
    tokenUri: `https://gateway.irys.xyz/${tokenId}/metadata.json`,
    artworkHash,
  };
}

function request(body: unknown, signal?: AbortSignal) {
  return new NextRequest("http://localhost/api/fame/metadata/batch", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    signal,
  });
}

describe("POST /api/fame/metadata/batch", () => {
  it("returns ordered per-item results without caching the response envelope", async () => {
    const revisions = [revision("2"), revision("1")];
    let received: readonly FameArtworkRevision[] = [];
    const response = await handleFameMetadataBatchRequest(
      request({ revisions }),
      async (items): Promise<readonly FameMetadataBatchResult[]> => {
        received = items;
        return items.map((item, index) => ({
          revision: item,
          metadata:
            index === 0
              ? {
                  status: "ready",
                  image: "https://gateway.irys.xyz/2/image.png",
                  name: "FAME #2",
                  description: null,
                  attributes: [],
                  error: null,
                }
              : {
                  status: "failure",
                  image: "/images/gold-leaf-square.png",
                  name: null,
                  description: null,
                  attributes: [],
                  error: "upstream unavailable",
                },
        }));
      },
    );

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(received, revisions);
    assert.deepEqual(await response.json(), {
      results: [
        {
          ...revisions[0],
          status: "ready",
          image: "https://gateway.irys.xyz/2/image.png",
          name: "FAME #2",
          description: null,
          attributes: [],
          error: null,
        },
        {
          ...revisions[1],
          status: "failure",
          image: "/images/gold-leaf-square.png",
          name: null,
          description: null,
          attributes: [],
          error: "upstream unavailable",
        },
      ],
    });
  });

  it("rejects batches larger than eight before resolving metadata", async () => {
    let called = false;
    const response = await handleFameMetadataBatchRequest(
      request({
        revisions: Array.from({ length: 9 }, (_, index) =>
          revision(String(index)),
        ),
      }),
      async () => {
        called = true;
        return [];
      },
    );

    assert.equal(response.status, 400);
    assert.equal(called, false);
  });

  it("rejects malformed revision identifiers and artwork hashes", async () => {
    for (const malformed of [
      { ...revision("1"), tokenId: "-1" },
      { ...revision("1"), tokenUri: "" },
      { ...revision("1"), artworkHash: "not-a-hash" },
    ]) {
      const response = await handleFameMetadataBatchRequest(
        request({ revisions: [malformed] }),
        async () => [],
      );
      assert.equal(response.status, 400);
    }
  });

  it("rejects unknown request and revision fields", async () => {
    const extraRequestField = await handleFameMetadataBatchRequest(
      request({ revisions: [revision("1")], extra: true }),
      async () => [],
    );
    const extraRevisionField = await handleFameMetadataBatchRequest(
      request({ revisions: [{ ...revision("1"), extra: true }] }),
      async () => [],
    );

    assert.equal(extraRequestField.status, 400);
    assert.equal(extraRevisionField.status, 400);
  });

  it("propagates request aborts to batch resolution", async () => {
    const controller = new AbortController();
    let receivedSignal: AbortSignal | undefined;
    const response = await handleFameMetadataBatchRequest(
      request({ revisions: [revision("1")] }, controller.signal),
      async (_revisions, signal) => {
        receivedSignal = signal;
        controller.abort(new Error("client disconnected"));
        throw new Error("aborted");
      },
    );

    assert.equal(receivedSignal?.aborted, true);
    assert.equal(response.status, 503);
  });
});
