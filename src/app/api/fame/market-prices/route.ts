import { NextResponse } from "next/server";
import { getCachedMarketStats } from "@/features/fame-landing/cachedMarketStats";
import {
  emptyLandingMarket,
  presentLandingMarket,
} from "@/features/fame-landing/pricePresentation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(
      presentLandingMarket(await getCachedMarketStats()),
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch {
    return NextResponse.json(emptyLandingMarket(), {
      headers: { "Cache-Control": "no-store" },
    });
  }
}
