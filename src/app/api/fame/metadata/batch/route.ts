import { NextRequest, NextResponse } from "next/server";
import {
  FAME_METADATA_LIMITS,
  resolveFameMetadataBatch,
  type FameArtworkRevision,
  type FameMetadataBatchResult,
} from "@/features/fame/metadata";

export const dynamic = "force-dynamic";

export const FAME_METADATA_BATCH_MAX_ITEMS = 8;
export const FAME_METADATA_BATCH_MAX_BODY_BYTES =
  FAME_METADATA_BATCH_MAX_ITEMS * FAME_METADATA_LIMITS.encodedJson + 64 * 1024;

type ResolveBatch = (
  revisions: readonly FameArtworkRevision[],
  signal?: AbortSignal,
) => Promise<readonly FameMetadataBatchResult[]>;

const defaultResolveBatch: ResolveBatch = (revisions, signal) =>
  resolveFameMetadataBatch(revisions, { signal });

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

async function readBoundedBody(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length"));
  if (
    Number.isFinite(contentLength) &&
    contentLength > FAME_METADATA_BATCH_MAX_BODY_BYTES
  ) {
    await request.body?.cancel();
    throw new RangeError("Request body is too large");
  }
  if (!request.body) return "";

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytesRead = 0;
  let body = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytesRead += value.byteLength;
      if (bytesRead > FAME_METADATA_BATCH_MAX_BODY_BYTES) {
        await reader.cancel();
        throw new RangeError("Request body is too large");
      }
      body += decoder.decode(value, { stream: true });
    }
    return body + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}

function parseRevision(value: unknown): FameArtworkRevision | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (
    Object.keys(record).some(
      (key) => !["tokenId", "tokenUri", "artworkHash"].includes(key),
    )
  ) {
    return null;
  }
  const tokenId = record.tokenId;
  const tokenUri = record.tokenUri;
  const artworkHash = record.artworkHash;
  if (
    typeof tokenId !== "string" ||
    !/^(?:0|[1-9]\d*)$/.test(tokenId) ||
    typeof tokenUri !== "string" ||
    tokenUri.length === 0 ||
    tokenUri.length > FAME_METADATA_LIMITS.encodedJson + 64 ||
    tokenUri.trim() !== tokenUri ||
    (artworkHash !== undefined &&
      (typeof artworkHash !== "string" ||
        !/^0x[0-9a-fA-F]{64}$/.test(artworkHash)))
  ) {
    return null;
  }

  return artworkHash === undefined
    ? { tokenId, tokenUri }
    : { tokenId, tokenUri, artworkHash: artworkHash as `0x${string}` };
}

function parseRequestBody(value: unknown): FameArtworkRevision[] | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some((key) => key !== "revisions")) return null;
  const revisions = record.revisions;
  if (
    !Array.isArray(revisions) ||
    revisions.length > FAME_METADATA_BATCH_MAX_ITEMS
  ) {
    return null;
  }

  const parsed = revisions.map(parseRevision);
  return parsed.every((revision) => revision !== null)
    ? (parsed as FameArtworkRevision[])
    : null;
}

export async function handleFameMetadataBatchRequest(
  request: NextRequest,
  resolveBatch: ResolveBatch = defaultResolveBatch,
) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().startsWith("application/json")) {
      return errorResponse("Expected an application/json request", 415);
    }

    const rawBody = await readBoundedBody(request);
    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return errorResponse("Invalid metadata batch request", 400);
    }
    const revisions = parseRequestBody(body);
    if (!revisions) {
      return errorResponse("Invalid metadata batch request", 400);
    }

    const results = await resolveBatch(revisions, request.signal);
    return NextResponse.json(
      {
        results: results.map(({ revision, metadata }) => ({
          ...revision,
          ...metadata,
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof RangeError) {
      return errorResponse("Metadata batch request is too large", 413);
    }
    return errorResponse("FAME metadata is temporarily unavailable", 503);
  }
}

export async function POST(request: NextRequest) {
  return handleFameMetadataBatchRequest(request);
}
