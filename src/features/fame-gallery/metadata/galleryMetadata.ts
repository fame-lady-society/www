import {
  FAME_METADATA_FALLBACK_IMAGE,
  fameMetadataFetchUrls,
  imageFromFameMetadata,
} from "@/service/fameMetadata";
import {
  TEST_METADATA_LIMITS,
  decodeTestGalleryMetadata,
  type GalleryMetadataResult,
} from "./testMetadata";

type MetadataFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export const GALLERY_REMOTE_METADATA_MAX_BYTES =
  TEST_METADATA_LIMITS.decodedJson;
export const GALLERY_METADATA_TIMEOUT_MS = 10_000;

function failure(error: string): GalleryMetadataResult {
  return {
    status: "failure",
    image: FAME_METADATA_FALLBACK_IMAGE,
    name: null,
    description: null,
    attributes: [],
    error,
  };
}

function optionalString(
  metadata: Record<string, unknown>,
  field: "name" | "description",
  limit: number,
) {
  const value = metadata[field];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 && value.length <= limit ? trimmed : null;
}

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

async function fetchWithTimeout(
  fetchMetadata: MetadataFetch,
  url: string,
  timeoutMs: number,
) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    fetchMetadata(url),
    new Promise<never>((_, reject) => {
      timeout = setTimeout(
        () => reject(new Error("Gallery metadata request timed out")),
        timeoutMs,
      );
    }),
  ]).finally(() => clearTimeout(timeout));
}

export async function loadGalleryMetadata(
  rawTokenUri: string,
  fetchMetadata: MetadataFetch = fetch,
  timeoutMs = GALLERY_METADATA_TIMEOUT_MS,
): Promise<GalleryMetadataResult> {
  const tokenUri = rawTokenUri.trim();
  if (tokenUri.startsWith("data:")) {
    return decodeTestGalleryMetadata(tokenUri);
  }
  if (!isHttpsUrl(tokenUri)) {
    return failure("Token metadata URL is unavailable");
  }

  for (const url of fameMetadataFetchUrls(tokenUri)) {
    if (!isHttpsUrl(url)) continue;
    try {
      const response = await fetchWithTimeout(fetchMetadata, url, timeoutMs);
      if (!response.ok) continue;
      const contentLength = Number(response.headers.get("content-length"));
      if (
        Number.isFinite(contentLength) &&
        contentLength > GALLERY_REMOTE_METADATA_MAX_BYTES
      ) {
        continue;
      }
      const body = await response.text();
      if (
        new TextEncoder().encode(body).byteLength >
        GALLERY_REMOTE_METADATA_MAX_BYTES
      ) {
        continue;
      }
      const parsed: unknown = JSON.parse(body);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        continue;
      }
      const metadata = parsed as Record<string, unknown>;
      return {
        status: "ready",
        image: imageFromFameMetadata(metadata),
        name: optionalString(metadata, "name", TEST_METADATA_LIMITS.name),
        description: optionalString(
          metadata,
          "description",
          TEST_METADATA_LIMITS.description,
        ),
        attributes: [],
        error: null,
      };
    } catch {
      // Try the normalized/original HTTPS URL before using fallback artwork.
    }
  }

  return failure("Token metadata could not be loaded");
}
