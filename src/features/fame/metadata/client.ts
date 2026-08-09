import { decodeInlineFameMetadata, FAME_METADATA_LIMITS } from "./inline";
import { FAME_METADATA_CACHE_SCHEMA_VERSION } from "./schema";
import type {
  FameArtworkRevision,
  FameMetadataAttribute,
  FameMetadataResult,
} from "./types";

export type { FameArtworkRevision } from "./types";

export const FAME_METADATA_CLIENT_CACHE_SCHEMA_VERSION =
  FAME_METADATA_CACHE_SCHEMA_VERSION;
export const FAME_METADATA_CLIENT_MAX_BATCH_SIZE = 8;
export const FAME_METADATA_CLIENT_GC_TIME_MS = 30 * 60 * 1000;

const DEFAULT_BATCH_ENDPOINT = "/api/fame/metadata/batch";

type FameMetadataBatchFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

type FameMetadataBatchClientOptions = Readonly<{
  endpoint?: string;
  fetchBatch?: FameMetadataBatchFetch;
}>;

type PendingRevision = {
  revision: FameArtworkRevision;
  signal?: AbortSignal;
  resolve: (metadata: FameMetadataResult) => void;
  reject: (error: Error) => void;
  settled: boolean;
  abortListener?: () => void;
};

export type FameMetadataBatchClient = Readonly<{
  load: (
    revision: FameArtworkRevision,
    signal?: AbortSignal,
  ) => Promise<FameMetadataResult>;
}>;

export class FameMetadataClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FameMetadataClientError";
  }
}

function abortError(signal: AbortSignal) {
  return signal.reason instanceof Error
    ? signal.reason
    : new DOMException("FAME metadata request aborted", "AbortError");
}

function validateRevision(revision: FameArtworkRevision) {
  if (!/^(?:0|[1-9]\d*)$/.test(revision.tokenId)) {
    throw new FameMetadataClientError("FAME metadata token ID is invalid");
  }
  if (
    revision.tokenUri.length === 0 ||
    revision.tokenUri.length > FAME_METADATA_LIMITS.encodedJson + 64 ||
    revision.tokenUri.trim() !== revision.tokenUri
  ) {
    throw new FameMetadataClientError("FAME metadata token URI is invalid");
  }
  if (
    revision.artworkHash !== undefined &&
    !/^0x[0-9a-fA-F]{64}$/.test(revision.artworkHash)
  ) {
    throw new FameMetadataClientError("FAME metadata artwork hash is invalid");
  }
}

export function fameMetadataClientQueryKey(revision: FameArtworkRevision) {
  return [
    "fame-metadata",
    FAME_METADATA_CLIENT_CACHE_SCHEMA_VERSION,
    revision.tokenUri,
    revision.artworkHash ?? "",
  ] as const;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function parseAttributes(value: unknown): FameMetadataAttribute[] | null {
  if (!Array.isArray(value) || value.length > FAME_METADATA_LIMITS.attributes) {
    return null;
  }
  const parsed: FameMetadataAttribute[] = [];
  for (const attribute of value) {
    if (!attribute || typeof attribute !== "object") return null;
    const record = attribute as Record<string, unknown>;
    if (
      typeof record.traitType !== "string" ||
      typeof record.value !== "string" ||
      record.traitType.length === 0 ||
      record.traitType.length > FAME_METADATA_LIMITS.attributeField ||
      record.value.length > FAME_METADATA_LIMITS.attributeField
    ) {
      return null;
    }
    parsed.push({ traitType: record.traitType, value: record.value });
  }
  return parsed;
}

function hasMatchingRevision(
  value: Record<string, unknown>,
  revision: FameArtworkRevision,
) {
  return (
    value.tokenId === revision.tokenId &&
    value.tokenUri === revision.tokenUri &&
    (revision.artworkHash === undefined
      ? value.artworkHash === undefined
      : value.artworkHash === revision.artworkHash)
  );
}

function parseBatchResult(
  value: unknown,
  revision: FameArtworkRevision,
): FameMetadataResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new FameMetadataClientError("FAME metadata response is invalid");
  }
  const record = value as Record<string, unknown>;
  if (!hasMatchingRevision(record, revision)) {
    throw new FameMetadataClientError(
      "FAME metadata response revision mismatch",
    );
  }
  if (
    typeof record.image !== "string" ||
    record.image.length === 0 ||
    record.image.length > FAME_METADATA_LIMITS.encodedImage + 64
  ) {
    throw new FameMetadataClientError("FAME metadata response is invalid");
  }

  if (record.status === "ready") {
    const attributes = parseAttributes(record.attributes);
    if (
      !isNullableString(record.name) ||
      !isNullableString(record.description) ||
      (typeof record.name === "string" &&
        record.name.length > FAME_METADATA_LIMITS.name) ||
      (typeof record.description === "string" &&
        record.description.length > FAME_METADATA_LIMITS.description) ||
      attributes === null ||
      record.error !== null
    ) {
      throw new FameMetadataClientError("FAME metadata response is invalid");
    }
    return {
      status: "ready",
      image: record.image,
      name: record.name,
      description: record.description,
      attributes,
      error: null,
    };
  }

  if (
    record.status === "failure" &&
    record.name === null &&
    record.description === null &&
    Array.isArray(record.attributes) &&
    record.attributes.length === 0 &&
    typeof record.error === "string" &&
    record.error.length > 0 &&
    record.error.length <= FAME_METADATA_LIMITS.description
  ) {
    return {
      status: "failure",
      image: record.image,
      name: null,
      description: null,
      attributes: [],
      error: record.error,
    };
  }

  throw new FameMetadataClientError("FAME metadata response is invalid");
}

function settle(
  pending: PendingRevision,
  outcome:
    | { status: "resolved"; metadata: FameMetadataResult }
    | { status: "rejected"; error: Error },
) {
  if (pending.settled) return;
  pending.settled = true;
  if (pending.abortListener) {
    pending.signal?.removeEventListener("abort", pending.abortListener);
  }
  if (outcome.status === "resolved") {
    pending.resolve(outcome.metadata);
  } else {
    pending.reject(outcome.error);
  }
}

export function createFameMetadataBatchClient(
  options: FameMetadataBatchClientOptions = {},
): FameMetadataBatchClient {
  const endpoint = options.endpoint ?? DEFAULT_BATCH_ENDPOINT;
  const fetchBatch = options.fetchBatch ?? fetch;
  const queue: PendingRevision[] = [];
  let drainScheduled = false;
  let draining = false;

  async function sendBatch(batch: PendingRevision[]) {
    try {
      const response = await fetchBatch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          revisions: batch.map(({ revision }) => revision),
        }),
        cache: "no-store",
      });
      if (!response.ok) {
        throw new FameMetadataClientError(
          `FAME metadata request failed (${response.status})`,
        );
      }

      const body: unknown = await response.json();
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        throw new FameMetadataClientError("FAME metadata response is invalid");
      }
      const results = (body as Record<string, unknown>).results;
      if (!Array.isArray(results) || results.length !== batch.length) {
        throw new FameMetadataClientError("FAME metadata response is invalid");
      }

      batch.forEach((pending, index) => {
        if (pending.settled) return;
        try {
          const metadata = parseBatchResult(results[index], pending.revision);
          if (metadata.status !== "ready") {
            settle(pending, {
              status: "rejected",
              error: new FameMetadataClientError(metadata.error),
            });
            return;
          }
          settle(pending, { status: "resolved", metadata });
        } catch (error) {
          settle(pending, {
            status: "rejected",
            error:
              error instanceof Error
                ? error
                : new FameMetadataClientError(
                    "FAME metadata response is invalid",
                  ),
          });
        }
      });
    } catch (error) {
      const requestError =
        error instanceof Error
          ? error
          : new FameMetadataClientError(
              "FAME metadata is temporarily unavailable",
            );
      batch.forEach((pending) =>
        settle(pending, { status: "rejected", error: requestError }),
      );
    }
  }

  async function drain() {
    if (draining) return;
    drainScheduled = false;
    draining = true;
    try {
      while (queue.length > 0) {
        const batch: PendingRevision[] = [];
        while (
          queue.length > 0 &&
          batch.length < FAME_METADATA_CLIENT_MAX_BATCH_SIZE
        ) {
          const pending = queue.shift();
          if (pending && !pending.settled) batch.push(pending);
        }
        if (batch.length > 0) await sendBatch(batch);
      }
    } finally {
      draining = false;
      if (queue.some((pending) => !pending.settled)) scheduleDrain();
    }
  }

  function scheduleDrain() {
    if (drainScheduled || draining) return;
    drainScheduled = true;
    queueMicrotask(() => void drain());
  }

  function load(revision: FameArtworkRevision, signal?: AbortSignal) {
    try {
      validateRevision(revision);
    } catch (error) {
      return Promise.reject(error);
    }

    if (revision.tokenUri.startsWith("data:")) {
      const metadata = decodeInlineFameMetadata(revision.tokenUri);
      return metadata.status === "ready"
        ? Promise.resolve(metadata)
        : Promise.reject(new FameMetadataClientError(metadata.error));
    }

    if (signal?.aborted) return Promise.reject(abortError(signal));

    return new Promise<FameMetadataResult>((resolve, reject) => {
      const pending: PendingRevision = {
        revision,
        signal,
        resolve,
        reject,
        settled: false,
      };
      if (signal) {
        pending.abortListener = () =>
          settle(pending, {
            status: "rejected",
            error: abortError(signal),
          });
        signal.addEventListener("abort", pending.abortListener, { once: true });
      }
      queue.push(pending);
      scheduleDrain();
    });
  }

  return { load };
}

const defaultFameMetadataBatchClient = createFameMetadataBatchClient();

export function loadFameMetadataClient(
  revision: FameArtworkRevision,
  signal?: AbortSignal,
) {
  return defaultFameMetadataBatchClient.load(revision, signal);
}
