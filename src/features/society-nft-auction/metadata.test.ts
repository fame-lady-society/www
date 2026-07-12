import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FAME_METADATA_FALLBACK_IMAGE } from "../../service/fameMetadata";
import { loadSocietyNftMetadata } from "./metadata";

describe("Society NFT auction metadata", () => {
  it("normalizes Irys metadata and image URLs through Arweave", async () => {
    const requested: string[] = [];
    const metadata = await loadSocietyNftMetadata(
      "https://gateway.irys.xyz/metadataTx/144.json",
      async (input) => {
        requested.push(String(input));
        return new Response(
          JSON.stringify({
            name: "Fame Lady #144",
            description: "A Society NFT",
            image: "https://gateway.irys.xyz/imageTx/144.png",
          }),
          { status: 200 },
        );
      },
    );

    assert.deepEqual(requested, ["https://arweave.net/metadataTx/144.json"]);
    assert.deepEqual(metadata, {
      name: "Fame Lady #144",
      description: "A Society NFT",
      image: "https://arweave.net/imageTx/144.png",
      error: null,
    });
  });

  it("falls back to a real local image when metadata is missing or invalid", async () => {
    const metadata = await loadSocietyNftMetadata(
      "https://example.com/144.json",
      async () => new Response(JSON.stringify({ name: "No image" })),
    );

    assert.equal(metadata.image, FAME_METADATA_FALLBACK_IMAGE);
    assert.match(metadata.error ?? "", /usable image/i);
  });

  it("preserves a fallback result when every metadata request fails", async () => {
    const metadata = await loadSocietyNftMetadata(
      "https://gateway.irys.xyz/metadataTx/144.json",
      async () => new Response("unavailable", { status: 503 }),
    );

    assert.deepEqual(metadata, {
      image: FAME_METADATA_FALLBACK_IMAGE,
      name: null,
      description: null,
      error: "Society NFT metadata is unavailable",
    });
  });

  it("does not fetch when no token URI is available", async () => {
    let called = false;
    const metadata = await loadSocietyNftMetadata("", async () => {
      called = true;
      return new Response("{}");
    });

    assert.equal(called, false);
    assert.equal(metadata.image, FAME_METADATA_FALLBACK_IMAGE);
    assert.match(metadata.error ?? "", /token URI is unavailable/i);
  });

  it("falls back instead of hanging when metadata never responds", async () => {
    const metadata = await loadSocietyNftMetadata(
      "https://gateway.irys.xyz/metadataTx/144.json",
      () => new Promise<Response>(() => undefined),
      1,
    );

    assert.equal(metadata.image, FAME_METADATA_FALLBACK_IMAGE);
    assert.match(metadata.error ?? "", /unavailable/i);
  });
});
