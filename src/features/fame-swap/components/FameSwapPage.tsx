"use client";

import { useCallback } from "react";
import Link from "next/link";
import { SocietyNftReadinessRail } from "@/features/society-nft-readiness/components/SocietyNftReadinessRail";
import { FameShell } from "@/features/fame/components/FameShell";
import { FAME_SWAP_HEADING_ID, FameSwapWidget } from "./FameSwapWidget";

export function FameSwapPage() {
  const handleSwapContinue = useCallback(() => {
    requestAnimationFrame(() => {
      const heading = document.getElementById(FAME_SWAP_HEADING_ID);
      heading?.scrollIntoView({ behavior: "smooth", block: "start" });
      heading?.focus({ preventScroll: true });
    });
  }, []);

  return (
    <FameShell title="FAME Swap" activeFamePage="swap">
      <SocietyNftReadinessRail
        surface="swap"
        onSwapContinue={handleSwapContinue}
      />
      <div className="mx-auto grid min-h-[calc(100dvh-68px)] max-w-[1320px] gap-10 px-4 pb-20 pt-12 sm:px-8 sm:pt-16 lg:grid-cols-12 lg:items-start lg:gap-16 lg:pt-24">
        <aside className="lg:sticky lg:top-28 lg:col-span-5">
          <p className="fame-kicker">FAME / Swap</p>
          <h1 className="fame-display mt-5 max-w-xl text-balance text-6xl leading-[0.9] sm:text-7xl">
            Trade without leaving Society.
          </h1>
          <p className="mt-7 max-w-md text-pretty text-base leading-7 text-[#bdb4a4]">
            Buy or sell FAME through preferred Base liquidity. The router finds
            a supported path and protects the minimum amount before you sign.
          </p>
          <dl className="mt-10 grid max-w-md gap-0 border-y border-[#c9aa67]/20 text-sm">
            <div className="flex items-center justify-between gap-4 py-4">
              <dt className="text-[#8f8779]">Network</dt>
              <dd className="font-mono text-[#e4cd96]">Base</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-[#c9aa67]/15 py-4">
              <dt className="text-[#8f8779]">Route protection</dt>
              <dd className="text-right text-[#f4eee2]">Minimum after fee</dd>
            </div>
          </dl>
          <Link
            href="/fame/market"
            className="fame-action fame-focus mt-8 inline-flex items-center gap-2 border-b border-[#c9aa67]/50 pb-1 text-sm font-semibold text-[#f4eee2] hover:border-[#c9aa67]"
          >
            Continue to the marketplace <span aria-hidden>↗</span>
          </Link>
        </aside>
        <div className="lg:col-span-7">
          <FameSwapWidget />
        </div>
      </div>
    </FameShell>
  );
}
