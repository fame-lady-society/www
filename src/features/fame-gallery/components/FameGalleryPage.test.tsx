import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { FameGalleryArtwork } from "../catalog";
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

  it("renders a library-backed load-more sentinel while another page exists", () => {
    const markup = renderPage([artwork], 49);
    assert.match(markup, /data-gallery-load-more/);
    assert.match(markup, /Load more artwork/);
  });
});
