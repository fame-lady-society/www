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
    <div className="min-h-[calc(100dvh-68px)] px-5 py-20 text-[#f4eee2]">
      <section className="mx-auto max-w-2xl border-l border-[#c9aa67] bg-[#11100d] p-7 sm:p-10">
        <p className="fame-kicker">FAME / Gallery</p>
        <h1 className="fame-display mt-4 text-5xl">Collection unavailable</h1>
        <p className="mt-5 max-w-lg text-sm leading-6 text-[#bdb4a4]">
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
    <div className="min-h-[calc(100dvh-68px)] px-4 pb-24 pt-12 text-[#f4eee2] sm:px-8 sm:pt-16">
      <section className="mx-auto max-w-[1440px]">
        <div className="mb-12 grid gap-8 border-b border-[#c9aa67]/20 pb-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="fame-kicker">FAME / Gallery</p>
            <h1 className="fame-display mt-4 text-balance text-6xl leading-[0.92] sm:text-8xl">
              The Society collection.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-6 text-[#bdb4a4] sm:text-base">
              Browse Society NFTs held by collectors and artwork currently in
              the market.
            </p>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-5 lg:col-span-4 lg:justify-end">
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#8f8779]">
                Loaded
              </p>
              <p className="mt-1 font-mono text-sm tabular-nums text-[#e4cd96]">
                {artworks.length} works
              </p>
            </div>
            <Link
              href="/fame/market"
              className="fame-action fame-focus inline-flex min-h-11 items-center border border-[#c9aa67]/65 px-5 text-sm font-semibold text-[#f4eee2] hover:border-[#c9aa67] hover:bg-[#c9aa67]/10"
            >
              Enter marketplace
            </Link>
          </div>
        </div>
        <div
          className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-12 md:grid-cols-3 xl:grid-cols-4"
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
            className="flex min-h-24 items-center justify-center py-10 text-sm text-[#bdb4a4]"
          >
            {isFetchNextPageError ? (
              <button
                type="button"
                className="fame-action fame-focus border border-[#c9aa67] px-5 py-3 text-[#f4eee2]"
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
