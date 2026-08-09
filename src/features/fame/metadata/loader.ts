import {
  FAME_METADATA_FALLBACK_IMAGE,
  imageFromFameMetadata,
} from "@/service/fameMetadata";
import {
  FAME_METADATA_LIMITS,
  decodeInlineFameMetadata,
  validateInlineFameImage,
} from "./inline";
import type { FameMetadataResult } from "./types";

export type FameMetadataFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export const FAME_REMOTE_METADATA_MAX_BYTES = FAME_METADATA_LIMITS.decodedJson;
export const FAME_METADATA_TIMEOUT_MS = 10_000;

const APPROVED_ARWEAVE_HOSTS = new Set(["arweave.net"]);
const APPROVED_IRYS_HOSTS = new Set(["gateway.irys.xyz"]);
const APPROVED_IPFS_HOSTS = new Set(["ipfs.io", "ipfs.fameladysociety.com"]);

export function validateFameRemoteAssetUrl(rawUrl: string): string | null {
  const assetUrl = rawUrl.trim();
  let url: URL;
  try {
    url = new URL(assetUrl);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.pathname.length <= 1) return null;

  if (APPROVED_IRYS_HOSTS.has(url.hostname)) return assetUrl;

  const isArweave =
    APPROVED_ARWEAVE_HOSTS.has(url.hostname) ||
    url.hostname.endsWith(".arweave.net");
  if (isArweave) return assetUrl;

  if (
    APPROVED_IPFS_HOSTS.has(url.hostname) &&
    url.pathname.startsWith("/ipfs/")
  ) {
    return assetUrl;
  }

  return null;
}

export function validateFameImageUrl(rawImage: string): string | null {
  const image = rawImage.trim();
  if (image.startsWith("data:")) return validateInlineFameImage(image);
  return validateFameRemoteAssetUrl(image);
}

export function fameMetadataFailure(error: string): FameMetadataResult {
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
    : new Error("FAME metadata request aborted");
}

async function readBoundedResponseText(
  response: Response,
  maxBytes: number,
  signal: AbortSignal,
): Promise<string> {
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    await response.body?.cancel();
    throw new Error("FAME metadata response is too large");
  }
  if (!response.body) {
    const body = await response.text();
    if (new TextEncoder().encode(body).byteLength > maxBytes) {
      throw new Error("FAME metadata response is too large");
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
        throw new Error("FAME metadata response is too large");
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
  fetchMetadata: FameMetadataFetch,
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
    () => controller.abort(new Error("FAME metadata request timed out")),
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

export async function loadFameMetadata(
  rawTokenUri: string,
  fetchMetadata: FameMetadataFetch = fetch,
  timeoutMs = FAME_METADATA_TIMEOUT_MS,
  signal?: AbortSignal,
): Promise<FameMetadataResult> {
  const tokenUri = rawTokenUri.trim();
  if (tokenUri.startsWith("data:")) {
    return decodeInlineFameMetadata(tokenUri);
  }

  const metadataUrl = validateFameRemoteAssetUrl(tokenUri);
  if (!metadataUrl)
    return fameMetadataFailure("Token metadata URL is not approved");

  try {
    const body = await fetchBoundedMetadata(
      fetchMetadata,
      metadataUrl,
      timeoutMs,
      FAME_REMOTE_METADATA_MAX_BYTES,
      signal,
    );
    if (body === null) {
      return fameMetadataFailure("Token metadata could not be loaded");
    }
    const parsed: unknown = JSON.parse(body);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return fameMetadataFailure("Token metadata could not be loaded");
    }
    const metadata = parsed as Record<string, unknown>;
    const image = validateFameImageUrl(imageFromFameMetadata(metadata));
    if (!image) throw new Error("FAME metadata image origin is not approved");
    return {
      status: "ready",
      image,
      name: optionalString(metadata, "name", FAME_METADATA_LIMITS.name),
      description: optionalString(
        metadata,
        "description",
        FAME_METADATA_LIMITS.description,
      ),
      attributes: [],
      error: null,
    };
  } catch (error) {
    if (signal?.aborted) throw error;
  }

  return fameMetadataFailure("Token metadata could not be loaded");
}
