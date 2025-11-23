import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { fetchListings } from "@/lib/openseaListings";

export async function GET(request: NextRequest) {
  try {
    const listings = await fetchListings("fameladysquad");
    return NextResponse.json(listings);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
