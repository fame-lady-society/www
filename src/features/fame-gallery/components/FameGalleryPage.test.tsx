import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { FameGalleryArtwork } from "../catalog";
import { refreshFameGalleryArtwork } from "./FameGalleryCard";
import { FameGalleryPage } from "./FameGalleryPage";

const artwork: FameGalleryArtwork = {
  tokenId: 1,
  kind: "owned",
  owner: "0x2222222222222222222222222222222222222222",
  artworkHash: `0x${"ab".repeat(32)}`,
  tokenUri: "data:application/json,{}",
  metadata: {
    status: "ready",
    image: `data:image/svg+xml;base64,${Buffer.from("<svg></svg>").toString("base64")}`,
    name: "FAME #1",
    description: null,
    attributes: [],
    error: null,
  },
};

function renderPage(artworks: FameGalleryArtwork[], nextCursor: number | null) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <FameGalleryPage page={{ blockNumber: "123", artworks, nextCursor }} />
    </QueryClientProvider>,
  );
}

describe("FameGalleryPage", () => {
  it("refreshes only the selected token and preserves its exact image URL", async () => {
    const requested: number[][] = [];
    const tokenUri = "https://gateway.irys.xyz/exact/7?path=A%2FB";
    const image = "https://arweave.net/exact-image?size=original";
    const refreshed = await refreshFameGalleryArtwork(7, {
      readRevisions: async (tokenIds) => {
        requested.push([...tokenIds]);
        return {
          revisions: [{ tokenId: "7", tokenUri }],
        };
      },
      resolveMetadata: async (revision) => {
        assert.equal(revision.tokenUri, tokenUri);
        return {
          status: "ready",
          image,
          name: "FAME #7",
          description: null,
          attributes: [],
          error: null,
        };
      },
    });

    assert.deepEqual(requested, [[7]]);
    assert.equal(refreshed.metadata.image, image);
  });

  it("renders artwork identity, ownership, and next/image output", () => {
    const markup = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <FameGalleryPage
          page={{ blockNumber: "123", artworks: [artwork], nextCursor: null }}
        />
      </QueryClientProvider>,
    );
    assert.match(markup, /FAME #1/);
    assert.match(markup, /Owned/);
    assert.match(markup, /data-artwork-hash=/);
    assert.match(markup, /<img/);
    assert.doesNotMatch(markup, /\/fame\/token\/image\/1/);
  });

  it("renders market items as available", () => {
    const marketArtwork = { ...artwork, kind: "mint" as const };
    const markup = renderPage([marketArtwork], null);
    assert.match(markup, /Available/);
  });

  it("shows a refresh action instead of unrevealed art when metadata fails", () => {
    const unavailableArtwork: FameGalleryArtwork = {
      ...artwork,
      tokenId: 149,
      metadata: {
        status: "failure",
        image: "/images/fame/gold-leaf-square.png",
        name: null,
        description: null,
        attributes: [],
        error: "Token metadata could not be loaded",
      },
    };
    const markup = renderPage([unavailableArtwork], null);

    assert.match(markup, /Artwork unavailable/);
    assert.match(markup, /The token metadata did not load/);
    assert.match(markup, /Refresh artwork/);
    assert.doesNotMatch(markup, /<img/);
    assert.doesNotMatch(markup, /gold-leaf-square/);
  });

  it("renders a library-backed load-more sentinel while another page exists", () => {
    const markup = renderPage([artwork], 49);
    assert.match(markup, /data-gallery-load-more/);
    assert.match(markup, /Load more artwork/);
  });
});
