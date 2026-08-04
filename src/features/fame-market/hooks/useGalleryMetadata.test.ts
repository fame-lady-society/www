import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { galleryMetadataQueryOptions } from "./useGalleryMetadata";

describe("gallery metadata query", () => {
  it("caches each token URI indefinitely and bounds inactive retention", () => {
    const uri = "https://gateway.irys.xyz/example/metadata.json";
    const options = galleryMetadataQueryOptions(uri);

    assert.deepEqual(options.queryKey, ["fame-market", "metadata", uri]);
    assert.equal(options.staleTime, Number.POSITIVE_INFINITY);
    assert.equal(options.gcTime, 30 * 60 * 1_000);
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

    const initialData = galleryMetadataQueryOptions(uri).initialData;
    assert.equal(typeof initialData, "function");
    assert.equal(initialData?.().status, "ready");
  });
});
