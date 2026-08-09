import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FAME_METADATA_CLIENT_CACHE_SCHEMA_VERSION,
  createFameMetadataBatchClient,
  fameMetadataClientQueryKey,
  type FameArtworkRevision,
} from "./client";

const artworkHash = `0x${"ab".repeat(32)}` as `0x${string}`;

function revision(tokenId: string): FameArtworkRevision {
  return {
    tokenId,
    tokenUri: `https://gateway.irys.xyz/${tokenId}/metadata.json`,
    artworkHash,
  };
}

function readyResult(item: FameArtworkRevision) {
  return {
    ...item,
    status: "ready" as const,
    image: item.tokenUri.replace("metadata.json", "image.png"),
    name: `FAME #${item.tokenId}`,
    description: null,
    attributes: [],
    error: null,
  };
}

async function waitFor(predicate: () => boolean) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  throw new Error("Timed out waiting for test condition");
}

describe("FAME metadata batch client", () => {
  it("aggregates same-tick work into sequential batches of at most eight", async () => {
    const requestBatches: FameArtworkRevision[][] = [];
    const releases: Array<() => void> = [];
    let active = 0;
    let maximumActive = 0;
    const client = createFameMetadataBatchClient({
      fetchBatch: async (_input, init) => {
        const body = JSON.parse(String(init?.body)) as {
          revisions: FameArtworkRevision[];
        };
        requestBatches.push(body.revisions);
        active += 1;
        maximumActive = Math.max(maximumActive, active);
        await new Promise<void>((resolve) => releases.push(resolve));
        active -= 1;
        return Response.json({
          results: body.revisions.map(readyResult),
        });
      },
    });

    const pending = Array.from({ length: 18 }, (_, index) =>
      client.load(revision(String(index + 1))),
    );

    await waitFor(() => releases.length === 1);
    assert.deepEqual(
      requestBatches.map((batch) => batch.length),
      [8],
    );
    releases[0]?.();
    await waitFor(() => releases.length === 2);
    assert.deepEqual(
      requestBatches.map((batch) => batch.length),
      [8, 8],
    );
    releases[1]?.();
    await waitFor(() => releases.length === 3);
    assert.deepEqual(
      requestBatches.map((batch) => batch.length),
      [8, 8, 2],
    );
    releases[2]?.();

    const results = await Promise.all(pending);
    assert.equal(maximumActive, 1);
    assert.deepEqual(
      results.map((result) => result.name),
      Array.from({ length: 18 }, (_, index) => `FAME #${index + 1}`),
    );
  });

  it("resolves ready siblings while rejecting per-item failures", async () => {
    const first = revision("1");
    const second = revision("2");
    const client = createFameMetadataBatchClient({
      fetchBatch: async () =>
        Response.json({
          results: [
            readyResult(first),
            {
              ...second,
              status: "failure",
              image: "/images/gold-leaf-square.png",
              name: null,
              description: null,
              attributes: [],
              error: "upstream unavailable",
            },
          ],
        }),
    });

    const firstPending = client.load(first);
    const secondPending = client.load(second);

    assert.equal((await firstPending).status, "ready");
    await assert.rejects(secondPending, /upstream unavailable/);
  });

  it("rejects malformed and mismatched response items", async () => {
    const item = revision("1");
    for (const result of [
      { ...readyResult(item), tokenUri: `${item.tokenUri}?wrong=1` },
      { ...readyResult(item), image: null },
      { ...readyResult(item), status: "unknown" },
      { ...readyResult(item), name: "x".repeat(257) },
      {
        ...readyResult(item),
        attributes: Array.from({ length: 33 }, (_, index) => ({
          traitType: `Trait ${index}`,
          value: String(index),
        })),
      },
    ]) {
      const client = createFameMetadataBatchClient({
        fetchBatch: async () => Response.json({ results: [result] }),
      });
      await assert.rejects(client.load(item), /invalid|mismatch/i);
    }
  });

  it("rejects invalid revisions before calling the batch API", async () => {
    let fetches = 0;
    const client = createFameMetadataBatchClient({
      fetchBatch: async () => {
        fetches += 1;
        throw new Error("invalid requests must not fetch");
      },
    });

    await assert.rejects(
      client.load({
        ...revision("1"),
        artworkHash: "invalid" as `0x${string}`,
      }),
      /artwork hash is invalid/i,
    );
    await assert.rejects(
      client.load({ ...revision("1"), tokenUri: " https://arweave.net/tx" }),
      /token URI is invalid/i,
    );
    assert.equal(fetches, 0);
  });

  it("rejects an aborted subscriber without aborting its sibling", async () => {
    const first = revision("1");
    const second = revision("2");
    let release: (() => void) | undefined;
    const client = createFameMetadataBatchClient({
      fetchBatch: async (_input, init) => {
        const body = JSON.parse(String(init?.body)) as {
          revisions: FameArtworkRevision[];
        };
        await new Promise<void>((resolve) => {
          release = resolve;
        });
        return Response.json({ results: body.revisions.map(readyResult) });
      },
    });
    const controller = new AbortController();

    const aborted = client.load(first, controller.signal);
    const sibling = client.load(second);
    await waitFor(() => release !== undefined);
    controller.abort(new Error("card unmounted"));

    await assert.rejects(aborted, /card unmounted/);
    release?.();
    assert.equal((await sibling).name, "FAME #2");
  });

  it("uses exact URI and hash revisions in the client cache key", () => {
    const first = revision("1");
    assert.deepEqual(fameMetadataClientQueryKey(first), [
      "fame-metadata",
      FAME_METADATA_CLIENT_CACHE_SCHEMA_VERSION,
      first.tokenUri,
      first.artworkHash,
    ]);
    assert.deepEqual(
      fameMetadataClientQueryKey({ ...first, tokenId: "999" }),
      fameMetadataClientQueryKey(first),
    );
    assert.notDeepEqual(
      fameMetadataClientQueryKey({
        ...first,
        artworkHash: `0x${"cd".repeat(32)}`,
      }),
      fameMetadataClientQueryKey(first),
    );
  });

  it("resolves inline metadata without calling the batch API", async () => {
    const image = `data:image/svg+xml;base64,${Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
    ).toString("base64")}`;
    const tokenUri = `data:application/json;base64,${Buffer.from(
      JSON.stringify({ name: "Inline", image }),
    ).toString("base64")}`;
    let fetches = 0;
    const client = createFameMetadataBatchClient({
      fetchBatch: async () => {
        fetches += 1;
        throw new Error("must not fetch inline metadata");
      },
    });

    const result = await client.load({ tokenId: "1", tokenUri });
    assert.equal(result.status, "ready");
    assert.equal(result.image, image);
    assert.equal(fetches, 0);
  });
});
