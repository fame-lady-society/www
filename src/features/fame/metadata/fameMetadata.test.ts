import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FAME_METADATA_CACHE_SCHEMA_VERSION,
  createFameMetadataResolver,
  loadFameMetadata,
  resolveFameMetadataBatch,
  type FameArtworkRevision,
  type FameMetadataCache,
} from "./index";

function dataUri(mime: string, value: string) {
  return `data:${mime};base64,${Buffer.from(value).toString("base64")}`;
}

function successOnlyCache(): FameMetadataCache {
  const values = new Map<string, unknown>();

  return (producer, keyParts) => async () => {
    const key = JSON.stringify(keyParts);
    if (values.has(key))
      return values.get(key) as Awaited<ReturnType<typeof producer>>;

    const value = await producer();
    values.set(key, value);
    return value;
  };
}

const artworkHash = `0x${"ab".repeat(32)}` as `0x${string}`;

function revision(
  tokenId: string,
  tokenUri = `https://gateway.irys.xyz/${tokenId}/metadata.json`,
): FameArtworkRevision {
  return { tokenId, tokenUri, artworkHash };
}

describe("shared FAME metadata", () => {
  it("preserves exact approved metadata and image URLs", async () => {
    const tokenUri = "https://gateway.irys.xyz/tx/metadata.json?published=1";
    const image = "https://gateway.irys.xyz/tx/image.png?published=1";
    const requested: string[] = [];

    const result = await loadFameMetadata(tokenUri, async (input) => {
      requested.push(String(input));
      return Response.json({ name: "FAME #1", image });
    });

    assert.equal(result.status, "ready");
    assert.equal(result.image, image);
    assert.deepEqual(requested, [tokenUri]);
  });

  it("parses bounded passive inline metadata without fetching", async () => {
    const image = dataUri(
      "image/svg+xml",
      '<svg xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1"/></svg>',
    );
    const result = await loadFameMetadata(
      dataUri("application/json", JSON.stringify({ name: "TEST #1", image })),
      async () => {
        throw new Error("inline metadata must not fetch");
      },
    );

    assert.equal(result.status, "ready");
    assert.equal(result.image, image);
  });

  it("propagates caller aborts", async () => {
    const controller = new AbortController();
    const pending = loadFameMetadata(
      "https://arweave.net/tx/metadata.json",
      async (_input, init) =>
        await new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new Error("aborted")),
          );
        }),
      10_000,
      controller.signal,
    );

    controller.abort(new Error("page changed"));
    await assert.rejects(pending, /page changed|aborted/);
  });

  it("caches successes by schema, exact URI, and artwork hash but never token ID", async () => {
    let loads = 0;
    const resolver = createFameMetadataResolver({
      cache: successOnlyCache(),
      loadMetadata: async (tokenUri) => {
        loads += 1;
        return {
          status: "ready" as const,
          image: tokenUri.replace("metadata.json", "image.png"),
          name: null,
          description: null,
          attributes: [],
          error: null,
        };
      },
    });

    const first = revision("1");
    await resolver(first);
    await resolver({ ...first, tokenId: "2" });
    await resolver({ ...first, tokenUri: `${first.tokenUri}?new=1` });
    await resolver({ ...first, artworkHash: `0x${"cd".repeat(32)}` });

    assert.equal(FAME_METADATA_CACHE_SCHEMA_VERSION, "v1");
    assert.equal(loads, 3);
  });

  it("does not cache failed metadata resolutions", async () => {
    let loads = 0;
    const resolver = createFameMetadataResolver({
      cache: successOnlyCache(),
      loadMetadata: async () => {
        loads += 1;
        return {
          status: "failure" as const,
          image: "/images/gold-leaf-square.png",
          name: null,
          description: null,
          attributes: [],
          error: "upstream unavailable",
        };
      },
    });

    const first = await resolver(revision("1"));
    const second = await resolver(revision("1"));

    assert.equal(first.status, "failure");
    assert.equal(second.status, "failure");
    assert.equal(loads, 2);
  });

  it("deduplicates revisions, preserves order, and never exceeds eight active resolutions", async () => {
    let active = 0;
    let maximumActive = 0;
    let calls = 0;
    const revisions = Array.from({ length: 18 }, (_, index) =>
      revision(String(index + 1)),
    );
    revisions.splice(7, 0, { ...revisions[2]!, tokenId: "duplicate" });

    const results = await resolveFameMetadataBatch(revisions, {
      resolveMetadata: async (item) => {
        calls += 1;
        active += 1;
        maximumActive = Math.max(maximumActive, active);
        await new Promise((resolve) => setTimeout(resolve, 2));
        active -= 1;
        return {
          status: "ready",
          image: item.tokenUri.replace("metadata.json", "image.png"),
          name: item.tokenId,
          description: null,
          attributes: [],
          error: null,
        };
      },
    });

    assert.equal(maximumActive, 8);
    assert.equal(calls, 18);
    assert.deepEqual(
      results.map(({ revision: item }) => item.tokenId),
      revisions.map((item) => item.tokenId),
    );
    assert.equal(results[2]?.metadata.image, results[7]?.metadata.image);
  });
});
