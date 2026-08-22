import { NextResponse } from "next/server";
import {
  readFameCreatorCatalog,
  serializeFameCreatorCatalog,
  type FameCreatorCatalogOptions,
  type FameCreatorCatalogResult,
} from "@/features/fame/creatorCatalog";
import {
  FAME_COLLECTION_FIRST_TOKEN_ID,
  FAME_COLLECTION_LAST_TOKEN_ID,
} from "@/features/fame/collection";

export const dynamic = "force-dynamic";

type CatalogReader = (
  options: FameCreatorCatalogOptions,
) => Promise<FameCreatorCatalogResult>;

const defaultCatalogReader: CatalogReader = (options) =>
  readFameCreatorCatalog(undefined, options);

function parseInteger(value: string | null) {
  if (value === null) return undefined;
  if (!/^(?:0|[1-9]\d*)$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
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

export async function handleFameCreatorCatalogRequest(
  request: Request,
  readCatalog: CatalogReader = defaultCatalogReader,
) {
  const params = new URL(request.url).searchParams;
  const cursor = parseInteger(params.get("cursor"));
  const tokenId = parseInteger(params.get("tokenId"));
  const blockNumber = parseBlockNumber(params.get("blockNumber"));
  const exactLookup = tokenId !== undefined;
  const invalid =
    cursor === null ||
    tokenId === null ||
    blockNumber === null ||
    (exactLookup && (cursor !== undefined || blockNumber !== undefined)) ||
    (!exactLookup && (cursor === undefined) !== (blockNumber === undefined)) ||
    (cursor !== undefined &&
      (cursor < FAME_COLLECTION_FIRST_TOKEN_ID ||
        cursor > FAME_COLLECTION_LAST_TOKEN_ID + 1)) ||
    (tokenId !== undefined &&
      (tokenId < FAME_COLLECTION_FIRST_TOKEN_ID ||
        tokenId > FAME_COLLECTION_LAST_TOKEN_ID));

  if (invalid) {
    return NextResponse.json(
      { error: "Invalid creator catalog request" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const result = await readCatalog({
      ...(cursor !== undefined ? { cursor } : {}),
      ...(blockNumber !== undefined ? { blockNumber } : {}),
      ...(tokenId !== undefined ? { tokenId } : {}),
    });
    return NextResponse.json(serializeFameCreatorCatalog(result), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof RangeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json(
      { error: "Creator catalog is temporarily unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function GET(request: Request) {
  return handleFameCreatorCatalogRequest(request);
}
