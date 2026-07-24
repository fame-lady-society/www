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
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    fetchMetadata(url, { signal: controller.signal }),
    new Promise<never>((_, reject) => {
      timeout = setTimeout(() => {
        controller.abort();
        reject(new Error("Gallery metadata request timed out"));
      }, timeoutMs);
    }),
  ]).finally(() => clearTimeout(timeout));
}

async function readBoundedResponseText(
  response: Response,
  maxBytes: number,
): Promise<string> {
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new Error("Gallery metadata response is too large");
  }
  if (!response.body) {
    const body = await response.text();
    if (new TextEncoder().encode(body).byteLength > maxBytes) {
      throw new Error("Gallery metadata response is too large");
    }
    return body;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytesRead = 0;
  let body = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytesRead += value.byteLength;
      if (bytesRead > maxBytes) {
        await reader.cancel();
        throw new Error("Gallery metadata response is too large");
      }
      body += decoder.decode(value, { stream: true });
    }
    return body + decoder.decode();
  } finally {
    reader.releaseLock();
  }
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
      const body = await readBoundedResponseText(
        response,
        GALLERY_REMOTE_METADATA_MAX_BYTES,
      );
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
