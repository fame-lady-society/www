import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { FameMetadataResult } from "@/features/fame/metadata";
import {
  buildFameMarketTokenMetadata,
  fameMarketTokenDescription,
  loadFameMarketTokenPresentation,
  parseFameMarketTokenId,
} from "./tokenPresentation";

const readyMetadata: FameMetadataResult = {
  status: "ready",
  image: "https://arweave.net/artwork",
  name: "Golden Hour",
  description: "A Society artwork in the late afternoon light.",
  attributes: [],
  error: null,
};

describe("FAME market token presentation", () => {
  it("accepts only canonical Society token route parameters", () => {
    assert.equal(parseFameMarketTokenId("1"), 1);
    assert.equal(parseFameMarketTokenId("888"), 888);
    for (const invalid of ["", "0", "889", "-1", "+1", "01", "1.0", "abc"]) {
      assert.equal(parseFameMarketTokenId(invalid), null);
    }
  });

  it("loads the current token URI and metadata", async () => {
    let requestedTokenId: number | null = null;
    const revision = {
      tokenId: "42",
      tokenUri: "data:current-token-uri",
      artworkHash: `0x${"11".repeat(32)}` as `0x${string}`,
    };
    const presentation = await loadFameMarketTokenPresentation(42, {
      readRevision: async (tokenId) => {
        requestedTokenId = tokenId;
        return revision;
      },
      resolveMetadata: async (resolvedRevision) => {
        assert.deepEqual(resolvedRevision, revision);
        return readyMetadata;
      },
    });

    assert.equal(requestedTokenId, 42);
    assert.deepEqual(presentation, {
      tokenId: 42,
      revision,
      metadata: readyMetadata,
    });
  });

  it("returns understandable fallback presentation when the RPC read fails", async () => {
    const previousError = console.error;
    console.error = () => undefined;
    try {
      const presentation = await loadFameMarketTokenPresentation(42, {
        readRevision: async () => {
          throw new Error("RPC unavailable");
        },
        resolveMetadata: async () => readyMetadata,
      });
      assert.equal(presentation.metadata.status, "failure");
      assert.equal(
        presentation.metadata.image,
        "/images/fame/gold-leaf-square.png",
      );
    } finally {
      console.error = previousError;
    }
  });

  it("builds canonical Open Graph and Twitter metadata without listing claims", () => {
    const metadata = buildFameMarketTokenMetadata({
      tokenId: 42,
      revision: null,
      metadata: readyMetadata,
    });

    assert.equal(metadata.title, "Golden Hour | FAME Marketplace");
    assert.equal(
      metadata.description,
      "A Society artwork in the late afternoon light.",
    );
    assert.deepEqual(metadata.alternates, { canonical: "/fame/market/42" });
    assert.equal(metadata.openGraph?.url, "/fame/market/42");
    assert.equal(
      (metadata.twitter as { card?: string } | undefined)?.card,
      "summary_large_image",
    );
    assert.doesNotMatch(String(metadata.description), /available now|price/iu);
  });

  it("bounds long social descriptions", () => {
    const description = fameMarketTokenDescription({
      tokenId: 8,
      revision: null,
      metadata: { ...readyMetadata, description: "word ".repeat(80) },
    });
    assert.ok(description.length <= 160);
    assert.match(description, /…$/u);
  });

  it("keeps ephemeral token IDs out of fallback social metadata", () => {
    const metadata = buildFameMarketTokenMetadata({
      tokenId: 42,
      revision: null,
      metadata: {
        status: "failure",
        image: "/images/fame/gold-leaf-square.png",
        name: null,
        description: null,
        attributes: [],
        error: "Token metadata is unavailable",
      },
    });

    assert.equal(metadata.title, "FAME Society | FAME Marketplace");
    assert.doesNotMatch(String(metadata.title), /#42/u);
    assert.doesNotMatch(String(metadata.description), /#42/u);
    assert.doesNotMatch(String(metadata.openGraph?.title), /#42/u);
    assert.doesNotMatch(
      String((metadata.twitter as { title?: string } | undefined)?.title),
      /#42/u,
    );
  });
});
