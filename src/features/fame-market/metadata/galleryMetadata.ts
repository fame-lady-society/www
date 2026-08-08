import {
  FAME_METADATA_FALLBACK_IMAGE,
  irysGatewayToArweaveUrl,
  imageFromFameMetadata,
} from "@/service/fameMetadata";
import {
  TEST_METADATA_LIMITS,
  decodeTestGalleryMetadata,
  validateInlineGalleryImage,
  type GalleryMetadataResult,
} from "./testMetadata";

type MetadataFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export const GALLERY_REMOTE_METADATA_MAX_BYTES =
  TEST_METADATA_LIMITS.decodedJson;
export const GALLERY_METADATA_TIMEOUT_MS = 10_000;

const APPROVED_ARWEAVE_HOSTS = new Set(["arweave.net"]);
const APPROVED_IPFS_HOSTS = new Set(["ipfs.io", "ipfs.fameladysociety.com"]);

function approvedRemoteAssetUrl(rawUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.pathname.length <= 1) return null;

  const normalizedIrysUrl = irysGatewayToArweaveUrl(url.toString());
  if (normalizedIrysUrl) return normalizedIrysUrl;

  const isArweave =
    APPROVED_ARWEAVE_HOSTS.has(url.hostname) ||
    url.hostname.endsWith(".arweave.net");
  if (isArweave) return url.toString();

  if (
    APPROVED_IPFS_HOSTS.has(url.hostname) &&
    url.pathname.startsWith("/ipfs/")
  ) {
    return url.toString();
  }

  return null;
}

export function normalizeGalleryImageUrl(rawImage: string): string | null {
  const image = rawImage.trim();
  if (image.startsWith("data:")) return validateInlineGalleryImage(image);
  return approvedRemoteAssetUrl(image);
}

function galleryMetadataFetchUrls(rawTokenUri: string) {
  const normalized = approvedRemoteAssetUrl(rawTokenUri);
  if (!normalized) return [];
  const original = rawTokenUri.trim();
  return normalized === original ? [normalized] : [normalized, original];
}

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

function abortError(signal: AbortSignal) {
  return signal.reason instanceof Error
    ? signal.reason
    : new Error("Gallery metadata request aborted");
}

async function readBoundedResponseText(
  response: Response,
  maxBytes: number,
  signal: AbortSignal,
): Promise<string> {
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    await response.body?.cancel();
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
  const cancelOnAbort = () => {
    void reader.cancel(signal.reason);
  };
  signal.addEventListener("abort", cancelOnAbort, { once: true });
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (signal.aborted) throw abortError(signal);
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
    signal.removeEventListener("abort", cancelOnAbort);
    reader.releaseLock();
  }
}

async function fetchBoundedMetadata(
  fetchMetadata: MetadataFetch,
  url: string,
  timeoutMs: number,
  maxBytes: number,
  externalSignal?: AbortSignal,
) {
  const controller = new AbortController();
  const abortFromCaller = () => controller.abort(externalSignal?.reason);
  if (externalSignal?.aborted) {
    abortFromCaller();
  } else {
    externalSignal?.addEventListener("abort", abortFromCaller, { once: true });
  }
  const timeout = setTimeout(
    () => controller.abort(new Error("Gallery metadata request timed out")),
    timeoutMs,
  );

  try {
    const response = await fetchMetadata(url, {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) {
      await response.body?.cancel();
      return null;
    }
    return await readBoundedResponseText(response, maxBytes, controller.signal);
  } finally {
    clearTimeout(timeout);
    externalSignal?.removeEventListener("abort", abortFromCaller);
  }
}

export async function loadGalleryMetadata(
  rawTokenUri: string,
  fetchMetadata: MetadataFetch = fetch,
  timeoutMs = GALLERY_METADATA_TIMEOUT_MS,
  signal?: AbortSignal,
): Promise<GalleryMetadataResult> {
  const tokenUri = rawTokenUri.trim();
  if (tokenUri.startsWith("data:")) {
    return decodeTestGalleryMetadata(tokenUri);
  }

  for (const url of galleryMetadataFetchUrls(tokenUri)) {
    try {
      const body = await fetchBoundedMetadata(
        fetchMetadata,
        url,
        timeoutMs,
        GALLERY_REMOTE_METADATA_MAX_BYTES,
        signal,
      );
      if (body === null) continue;
      const parsed: unknown = JSON.parse(body);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        continue;
      }
      const metadata = parsed as Record<string, unknown>;
      const image = normalizeGalleryImageUrl(imageFromFameMetadata(metadata));
      if (!image)
        throw new Error("Gallery metadata image origin is not approved");
      return {
        status: "ready",
        image,
        name: optionalString(metadata, "name", TEST_METADATA_LIMITS.name),
        description: optionalString(
          metadata,
          "description",
          TEST_METADATA_LIMITS.description,
        ),
        attributes: [],
        error: null,
      };
    } catch (error) {
      if (signal?.aborted) throw error;
      // Try the normalized/original HTTPS URL before using fallback artwork.
    }
  }

  return failure("Token metadata could not be loaded");
}
