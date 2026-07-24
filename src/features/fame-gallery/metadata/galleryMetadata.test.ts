import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  GALLERY_REMOTE_METADATA_MAX_BYTES,
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

  it("fetches HTTPS metadata directly and preserves its image value", async () => {
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
    assert.deepEqual(requested, ["https://arweave.net/example/metadata.json"]);
  });

  it("rejects non-HTTPS and oversized remote metadata", async () => {
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

    const oversized = "x".repeat(GALLERY_REMOTE_METADATA_MAX_BYTES + 1);
    assert.equal(
      (
        await loadGalleryMetadata(
          "https://example.com/metadata.json",
          async () => new Response(oversized, { status: 200 }),
        )
      ).status,
      "failure",
    );
  });

  it("aborts a timed-out browser metadata request", async () => {
    let aborted = false;
    const result = await loadGalleryMetadata(
      "https://example.com/metadata.json",
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
});
