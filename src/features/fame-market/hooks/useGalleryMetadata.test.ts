import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FAME_METADATA_CLIENT_CACHE_SCHEMA_VERSION } from "@/features/fame/metadata/client";
import { galleryMetadataQueryOptions } from "./useGalleryMetadata";

describe("gallery metadata query", () => {
  it("keeps successful metadata fresh by exact URI/hash revision", () => {
    const uri = "https://gateway.irys.xyz/example/metadata.json";
    const artworkHash = `0x${"ab".repeat(32)}` as `0x${string}`;
    const options = galleryMetadataQueryOptions({
      tokenId: "12",
      tokenUri: uri,
      artworkHash,
    });

    assert.deepEqual(options.queryKey, [
      "fame-metadata",
      FAME_METADATA_CLIENT_CACHE_SCHEMA_VERSION,
      uri,
      artworkHash,
    ]);
    assert.equal(options.staleTime, Infinity);
    assert.equal(options.gcTime, 30 * 60 * 1000);
    assert.equal(options.retry, 1);
    assert.equal(options.initialData, undefined);
  });

  it("hydrates inline metadata without a fetch-only loading state", () => {
    const uri = `data:application/json;base64,${Buffer.from(
      JSON.stringify({
        image: `data:image/svg+xml;base64,${Buffer.from("<svg></svg>").toString(
          "base64",
        )}`,
      }),
    ).toString("base64")}`;

    const initialData = galleryMetadataQueryOptions({
      tokenId: "12",
      tokenUri: uri,
    }).initialData;
    assert.equal(typeof initialData, "function");
    assert.equal(initialData?.().status, "ready");
  });
});
