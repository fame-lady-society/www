import {
  type FameMetadataResolver,
  fameMetadataCacheKey,
  resolveFameMetadata,
} from "./cache";
import { fameMetadataFailure } from "./loader";
import type {
  FameArtworkRevision,
  FameMetadataBatchResult,
  FameMetadataResult,
} from "./types";

export const FAME_METADATA_MAX_CONCURRENCY = 8;

type FameMetadataBatchOptions = Readonly<{
  concurrency?: number;
  resolveMetadata?: FameMetadataResolver;
  signal?: AbortSignal;
}>;

function abortError(signal: AbortSignal) {
  return signal.reason instanceof Error
    ? signal.reason
    : new Error("FAME metadata batch aborted");
}

function deduplicationKey(revision: FameArtworkRevision) {
  return JSON.stringify(fameMetadataCacheKey(revision));
}

export async function resolveFameMetadataBatch(
  revisions: readonly FameArtworkRevision[],
  options: FameMetadataBatchOptions = {},
): Promise<readonly FameMetadataBatchResult[]> {
  const resolveMetadata = options.resolveMetadata ?? resolveFameMetadata;
  const concurrency = Math.max(
    1,
    Math.min(
      FAME_METADATA_MAX_CONCURRENCY,
      Math.floor(options.concurrency ?? FAME_METADATA_MAX_CONCURRENCY),
    ),
  );
  const unique = new Map<string, FameArtworkRevision>();
  for (const revision of revisions) {
    const key = deduplicationKey(revision);
    if (!unique.has(key)) unique.set(key, revision);
  }

  const pending = [...unique.entries()];
  const resolved = new Map<string, FameMetadataResult>();
  let cursor = 0;

  async function worker() {
    while (cursor < pending.length) {
      if (options.signal?.aborted) throw abortError(options.signal);
      const entry = pending[cursor];
      cursor += 1;
      if (!entry) return;
      const [key, revision] = entry;
      try {
        resolved.set(key, await resolveMetadata(revision, options.signal));
      } catch (error) {
        if (options.signal?.aborted) throw error;
        resolved.set(
          key,
          fameMetadataFailure("Token metadata could not be loaded"),
        );
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, pending.length) }, async () =>
      worker(),
    ),
  );

  return revisions.map((revision) => ({
    revision,
    metadata:
      resolved.get(deduplicationKey(revision)) ??
      fameMetadataFailure("Token metadata could not be loaded"),
  }));
}
