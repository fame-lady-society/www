import { NextResponse } from "next/server";
import {
  FAME_COLLECTION_FIRST_TOKEN_ID,
  FAME_COLLECTION_LAST_TOKEN_ID,
} from "@/features/fame/collection";
import {
  readFameGalleryCatalog,
  serializeFameGalleryCatalog,
  type FameGalleryCatalogOptions,
  type FameGalleryCatalogResult,
} from "@/features/fame-gallery/catalog";

export const dynamic = "force-dynamic";

type CatalogReader = (
  options: FameGalleryCatalogOptions,
) => Promise<FameGalleryCatalogResult>;

const defaultCatalogReader: CatalogReader = (options) =>
  readFameGalleryCatalog(undefined, options);

function parseCursor(value: string | null) {
  if (value === null) return undefined;
  if (!/^\d+$/.test(value)) return null;
  const cursor = Number(value);
  return Number.isSafeInteger(cursor) &&
    cursor >= FAME_COLLECTION_FIRST_TOKEN_ID &&
    cursor <= FAME_COLLECTION_LAST_TOKEN_ID + 1
    ? cursor
    : null;
}

function parseBlockNumber(value: string | null) {
  if (value === null) return undefined;
  if (!/^\d+$/.test(value)) return null;
  try {
    const blockNumber = BigInt(value);
    return blockNumber > 0n ? blockNumber : null;
  } catch {
    return null;
  }
}

export async function handleFameGalleryCatalogRequest(
  request: Request,
  readCatalog: CatalogReader = defaultCatalogReader,
) {
  const params = new URL(request.url).searchParams;
  const cursor = parseCursor(params.get("cursor"));
  const blockNumber = parseBlockNumber(params.get("blockNumber"));
  if (cursor === null || blockNumber === null) {
    return NextResponse.json(
      { error: "Invalid FAME gallery pagination parameters" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const result = await readCatalog({
      ...(cursor !== undefined ? { cursor } : {}),
      ...(blockNumber !== undefined ? { blockNumber } : {}),
    });
    return NextResponse.json(serializeFameGalleryCatalog(result), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "FAME gallery catalog unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function GET(request: Request) {
  return handleFameGalleryCatalogRequest(request);
}
