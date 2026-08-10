import { NextResponse } from "next/server";
import {
  emptyLandingMarket,
  presentLandingMarket,
} from "@/features/fame-landing/pricePresentation";
import {
  FAME_LANDING_SNAPSHOT_MAX_AGE_SECONDS,
  type FameLandingSnapshotResult,
  readFameLandingSnapshot,
} from "@/features/fame-landing/snapshot";

export const revalidate = 0;

const BROWSER_CACHE_SECONDS = 60;
const STALE_WHILE_REVALIDATE_SECONDS = 120;

function snapshotCacheControl(capturedAt: string): string | null {
  const expiresAt =
    Date.parse(capturedAt) + FAME_LANDING_SNAPSHOT_MAX_AGE_SECONDS * 1_000;
  const remainingMs = expiresAt - Date.now();
  if (remainingMs <= 0) return null;

  const remainingSeconds = Math.floor(remainingMs / 1_000);
  const maxAge = Math.min(BROWSER_CACHE_SECONDS, remainingSeconds);
  const staleWhileRevalidate = Math.min(
    STALE_WHILE_REVALIDATE_SECONDS,
    Math.max(0, remainingSeconds - maxAge),
  );
  return `public, max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`;
}

export async function fameMarketPricesResponse(
  readSnapshot: () => Promise<FameLandingSnapshotResult> = readFameLandingSnapshot,
) {
  const result = await readSnapshot();
  if (result.status === "unavailable") {
    return NextResponse.json(emptyLandingMarket(), {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const cacheControl = snapshotCacheControl(
    result.snapshot.provenance.capturedAt,
  );
  if (!cacheControl) {
    return NextResponse.json(emptyLandingMarket(), {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }

  return NextResponse.json(presentLandingMarket(result.snapshot), {
    headers: {
      "Cache-Control": cacheControl,
      "X-Fame-Snapshot-Id": result.snapshot.provenance.snapshotId,
      "X-Fame-Snapshot-Schema": result.snapshot.schemaVersion,
    },
  });
}

export async function GET() {
  return fameMarketPricesResponse();
}
