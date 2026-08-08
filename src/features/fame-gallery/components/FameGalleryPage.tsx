"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import type { FameGalleryCatalogPage, FameGalleryArtwork } from "../catalog";
import { FameGalleryCard } from "./FameGalleryCard";

type GalleryPageParam = {
  cursor: number | null;
  blockNumber: string;
};

async function fetchGalleryPage({
  cursor,
  blockNumber,
}: GalleryPageParam): Promise<FameGalleryCatalogPage> {
  const params = new URLSearchParams({ blockNumber });
  if (cursor !== null) params.set("cursor", String(cursor));
  const response = await fetch(`/api/fame/gallery?${params}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("FAME gallery page unavailable");
  return (await response.json()) as FameGalleryCatalogPage;
}

function uniqueArtworks(pages: FameGalleryCatalogPage[]) {
  const byTokenId = new Map<number, FameGalleryArtwork>();
  for (const artwork of pages.flatMap(({ artworks }) => artworks)) {
    byTokenId.set(artwork.tokenId, artwork);
  }
  return [...byTokenId.values()];
}

export function FameGalleryUnavailable() {
  return (
    <div className="min-h-screen bg-black px-5 py-20 text-[#f5eddc]">
      <section className="mx-auto max-w-xl border border-[#a8813d]/40 p-6">
        <h1 className="text-2xl">FAME Gallery</h1>
        <p className="mt-3 text-sm text-[#d7cfbf]">
          The collection is temporarily unavailable. Please try again shortly.
        </p>
      </section>
    </div>
  );
}

export function FameGalleryPage({ page }: { page: FameGalleryCatalogPage }) {
  const query = useInfiniteQuery({
    queryKey: ["fame-gallery-catalog", page.blockNumber],
    queryFn: ({ pageParam }: { pageParam: GalleryPageParam }) =>
      fetchGalleryPage(pageParam),
    initialPageParam: {
      cursor: null,
      blockNumber: page.blockNumber,
    } satisfies GalleryPageParam,
    initialData: {
      pages: [page],
      pageParams: [
        {
          cursor: null,
          blockNumber: page.blockNumber,
        } satisfies GalleryPageParam,
      ],
    },
    getNextPageParam: (lastPage) =>
      lastPage.nextCursor === null
        ? undefined
        : {
            cursor: lastPage.nextCursor,
            blockNumber: lastPage.blockNumber,
          },
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
  const { ref: loadMoreRef, inView } = useInView({
    rootMargin: "800px 0px",
  });
  const {
    fetchNextPage,
    hasNextPage,
    isFetchNextPageError,
    isFetchingNextPage,
  } = query;

  useEffect(() => {
    if (!inView || !hasNextPage || isFetchingNextPage || isFetchNextPageError) {
      return;
    }
    void fetchNextPage();
  }, [
    fetchNextPage,
    hasNextPage,
    inView,
    isFetchNextPageError,
    isFetchingNextPage,
  ]);

  const pages = query.data?.pages ?? [page];
  const artworks = uniqueArtworks(pages);

  return (
    <div className="min-h-screen bg-black px-4 py-10 text-[#f5eddc] sm:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#d7b979]">
              FAME
            </p>
            <h1 className="mt-2 text-3xl">Collection</h1>
            <p className="mt-2 max-w-xl text-sm text-[#d7cfbf]">
              Browse market artwork and Society NFTs held by collectors.
            </p>
          </div>
          <Link
            href="/fame/market"
            className="border border-[#d7b979] px-4 py-2 text-sm text-[#f5eddc] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#f5eddc]"
          >
            Marketplace
          </Link>
        </div>
        <div
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          data-artwork-count={artworks.length}
        >
          {artworks.map((artwork) => (
            <FameGalleryCard
              key={`${artwork.tokenId}:${artwork.artworkHash}`}
              artwork={artwork}
            />
          ))}
        </div>
        {hasNextPage || isFetchNextPageError ? (
          <div
            ref={loadMoreRef}
            data-gallery-load-more
            className="flex min-h-20 items-center justify-center py-8 text-sm text-[#d7cfbf]"
          >
            {isFetchNextPageError ? (
              <button
                type="button"
                className="border border-[#d7b979] px-4 py-2 text-[#f5eddc]"
                onClick={() => void fetchNextPage()}
              >
                Retry loading artwork
              </button>
            ) : isFetchingNextPage ? (
              "Loading more artwork…"
            ) : (
              "Load more artwork"
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
}
