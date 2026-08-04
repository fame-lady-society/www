import Link from "next/link";
import type { LandingMarketStats } from "../cachedMarketStats";
import { presentLandingPrices } from "../pricePresentation";
import { FameMarketBoard } from "./FameMarketBoard";
import { FameSwapAccordion } from "./FameSwapAccordion";

export function FameLandingPage({ stats }: { stats: LandingMarketStats }) {
  return (
    <div className="fame-landing min-h-screen bg-black px-4 py-8 text-[#fff5d8] sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-7">
          <p className="text-sm uppercase tracking-[.2em] text-[#c6b98b]">
            FAME
          </p>
          <h1 className="mt-2 text-4xl font-semibold">Prices</h1>
        </header>

        <FameMarketBoard initialPrices={presentLandingPrices(stats)} />
        <FameSwapAccordion />

        <nav
          aria-label="FAME destinations"
          className="mt-8 grid gap-3 md:grid-cols-3"
        >
          <Link
            href="/fame/market"
            className="border border-[#f5d46d] p-5 text-[#f5d46d]"
          >
            Marketplace
          </Link>
          <Link href="/fame/gallery" className="border border-[#8e762c] p-5">
            Gallery
          </Link>
          <Link href="/fame/rotate" className="border border-[#8e762c] p-5">
            Rotator
          </Link>
        </nav>
      </div>
    </div>
  );
}
