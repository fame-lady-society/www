import Link from "next/link";
import type { FameGalleryStatusPresentation } from "../cachedStatus";
import type { FameGalleryStatus } from "../status";
import { FameGalleryCard } from "./FameGalleryCard";

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

export function FameGalleryPage({
  tokenIds,
  statuses,
  freshness = "unavailable",
  observedAt = null,
}: {
  tokenIds: number[];
  statuses: Record<string, FameGalleryStatus>;
  freshness?: FameGalleryStatusPresentation["freshness"];
  observedAt?: number | null;
}) {
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
              Browse the FAME collection. Availability is confirmed in the
              marketplace.
            </p>
            {freshness === "stale" && observedAt !== null ? (
              <p className="mt-2 text-xs text-[#d7b979]">
                Status data is stale (observed{" "}
                {new Date(observedAt).toISOString()}).
              </p>
            ) : null}
            {freshness === "unavailable" ? (
              <p className="mt-2 text-xs text-[#d7cfbf]">
                Status data is unavailable.
              </p>
            ) : null}
          </div>
          <Link
            href="/fame/market"
            className="border border-[#d7b979] px-4 py-2 text-sm text-[#f5eddc] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#f5eddc]"
          >
            Marketplace
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {tokenIds.map((tokenId) => (
            <FameGalleryCard
              key={tokenId}
              tokenId={tokenId}
              status={statuses[String(tokenId)] ?? "unknown"}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
