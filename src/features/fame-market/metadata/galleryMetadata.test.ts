import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  GALLERY_REMOTE_METADATA_MAX_BYTES,
  validateGalleryImageUrl,
  loadGalleryMetadata,
} from "./galleryMetadata";

function dataUri(mime: string, value: string) {
  return `data:${mime};base64,${Buffer.from(value).toString("base64")}`;
}

describe("gallery metadata loader", () => {
  it("preserves inline Base Sepolia metadata support", async () => {
    const image = dataUri(
      "image/svg+xml",
      '<svg xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1"/></svg>',
    );
    const result = await loadGalleryMetadata(
      dataUri("application/json", JSON.stringify({ name: "TEST #1", image })),
      async () => {
        throw new Error("inline metadata must not fetch");
      },
    );

    assert.equal(result.status, "ready");
    assert.equal(result.image, image);
  });

  it("fetches Irys metadata directly and preserves its canonical image URL", async () => {
    const image = "https://gateway.irys.xyz/example/image.png";
    const requested: string[] = [];
    const result = await loadGalleryMetadata(
      "https://gateway.irys.xyz/example/metadata.json",
      async (input) => {
        requested.push(String(input));
        return new Response(
          JSON.stringify({
            name: "Society #1",
            description: "Published on Irys",
            image,
          }),
          { status: 200 },
        );
      },
    );

    assert.equal(result.status, "ready");
    assert.equal(result.image, image);
    assert.equal(result.name, "Society #1");
    assert.deepEqual(requested, [
      "https://gateway.irys.xyz/example/metadata.json",
    ]);
  });

  it("uses fallback art when approved metadata names an unapproved image", async () => {
    const result = await loadGalleryMetadata(
      "https://arweave.net/example/metadata.json",
      async () =>
        Response.json({ image: "https://fame.support/example/image.png" }),
    );

    assert.equal(result.status, "failure");
    assert.match(result.image, /gold-leaf-square/);
  });

  it("rejects arbitrary HTTPS, fame.support, non-HTTPS, and oversized metadata", async () => {
    assert.equal(
      (
        await loadGalleryMetadata(
          "http://example.com/metadata.json",
          async () => {
            throw new Error("must not fetch");
          },
        )
      ).status,
      "failure",
    );
    let fetched = false;
    assert.equal(
      (
        await loadGalleryMetadata(
          "https://example.com/metadata.json",
          async () => {
            fetched = true;
            return new Response("{}");
          },
        )
      ).status,
      "failure",
    );
    assert.equal(fetched, false);
    assert.equal(
      (
        await loadGalleryMetadata(
          "https://fame.support/metadata.json",
          async () => {
            throw new Error("must not fetch");
          },
        )
      ).status,
      "failure",
    );

    const oversized = "x".repeat(GALLERY_REMOTE_METADATA_MAX_BYTES + 1);
    assert.equal(
      (
        await loadGalleryMetadata(
          "https://arweave.net/metadata.json",
          async () => new Response(oversized, { status: 200 }),
        )
      ).status,
      "failure",
    );
  });

  it("aborts a timed-out browser metadata request", async () => {
    let aborted = false;
    const result = await loadGalleryMetadata(
      "https://arweave.net/metadata.json",
      (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            aborted = true;
            reject(new Error("aborted"));
          });
        }),
      1,
    );

    assert.equal(aborted, true);
    assert.equal(result.status, "failure");
  });

  it("keeps the timeout active while reading a stalled body", async () => {
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      cancel() {
        cancelled = true;
      },
    });

    const result = await loadGalleryMetadata(
      "https://arweave.net/metadata.json",
      async () => new Response(body, { status: 200 }),
      1,
    );

    assert.equal(cancelled, true);
    assert.equal(result.status, "failure");
  });

  it("cancels an oversized response before reading its body", async () => {
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      cancel() {
        cancelled = true;
      },
    });

    const result = await loadGalleryMetadata(
      "https://arweave.net/metadata.json",
      async () =>
        new Response(body, {
          status: 200,
          headers: {
            "content-length": String(GALLERY_REMOTE_METADATA_MAX_BYTES + 1),
          },
        }),
    );

    assert.equal(cancelled, true);
    assert.equal(result.status, "failure");
  });

  it("cancels a streamed body when accumulated bytes cross the limit", async () => {
    let cancelled = false;
    const oversizedChunk = new Uint8Array(
      GALLERY_REMOTE_METADATA_MAX_BYTES + 1,
    );
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(oversizedChunk);
      },
      cancel() {
        cancelled = true;
      },
    });

    const result = await loadGalleryMetadata(
      "https://arweave.net/metadata.json",
      async () => new Response(body, { status: 200 }),
    );

    assert.equal(cancelled, true);
    assert.equal(result.status, "failure");
  });

  it("stops fallback requests when the caller cancels", async () => {
    const controller = new AbortController();
    const requested: string[] = [];

    const pending = loadGalleryMetadata(
      "https://gateway.irys.xyz/example/metadata.json",
      async (input, init) => {
        requested.push(String(input));
        return await new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new Error("aborted"));
          });
        });
      },
      10_000,
      controller.signal,
    );
    controller.abort(new Error("card unmounted"));

    await assert.rejects(pending);
    assert.deepEqual(requested, [
      "https://gateway.irys.xyz/example/metadata.json",
    ]);
  });

  it("validates approved image origins without rewriting their URLs", () => {
    const inline = `data:image/svg+xml;base64,${Buffer.from(
      "<svg></svg>",
    ).toString("base64")}`;
    assert.equal(validateGalleryImageUrl(inline), inline);
    assert.equal(
      validateGalleryImageUrl("https://arweave.net/tx/image.png"),
      "https://arweave.net/tx/image.png",
    );
    assert.equal(
      validateGalleryImageUrl("https://gateway.irys.xyz/tx/image.png"),
      "https://gateway.irys.xyz/tx/image.png",
    );
    assert.equal(
      validateGalleryImageUrl("https://ipfs.io/ipfs/bafy/image.png"),
      "https://ipfs.io/ipfs/bafy/image.png",
    );
    assert.equal(
      validateGalleryImageUrl("https://fame.support/image.png"),
      null,
    );
    assert.equal(
      validateGalleryImageUrl("https://example.com/image.png"),
      null,
    );
  });
});
