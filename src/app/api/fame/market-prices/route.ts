import { NextResponse } from "next/server";
import { getCachedMarketStats } from "@/features/fame-landing/cachedMarketStats";
import {
  emptyLandingPrices,
  presentLandingPrices,
} from "@/features/fame-landing/pricePresentation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(
      presentLandingPrices(await getCachedMarketStats()),
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch {
    return NextResponse.json(emptyLandingPrices(), {
      headers: { "Cache-Control": "no-store" },
    });
  }
}
