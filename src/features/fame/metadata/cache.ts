import { unstable_cache } from "next/cache";
import { fameMetadataFailure, loadFameMetadata } from "./loader";
import { FAME_METADATA_CACHE_SCHEMA_VERSION } from "./schema";
import type { FameArtworkRevision, FameMetadataResult } from "./types";

export type FameMetadataCache = <Value>(
  producer: () => Promise<Value>,
  keyParts: string[],
  options: { revalidate: false },
) => () => Promise<Value>;

export type FameMetadataLoader = (
  tokenUri: string,
  signal?: AbortSignal,
) => Promise<FameMetadataResult>;

export type FameMetadataResolver = (
  revision: FameArtworkRevision,
  signal?: AbortSignal,
) => Promise<FameMetadataResult>;

type FameMetadataResolverDependencies = Readonly<{
  cache?: FameMetadataCache;
  loadMetadata?: FameMetadataLoader;
}>;

class FameMetadataResolutionError extends Error {}

const nextDataCache: FameMetadataCache = (producer, keyParts, options) =>
  unstable_cache(producer, keyParts, options);

export function fameMetadataCacheKey(revision: FameArtworkRevision) {
  return [
    `fame-metadata-${FAME_METADATA_CACHE_SCHEMA_VERSION}`,
    revision.tokenUri,
    revision.artworkHash ?? "",
  ];
}

export function createFameMetadataResolver(
  dependencies: FameMetadataResolverDependencies = {},
): FameMetadataResolver {
  const cache = dependencies.cache ?? nextDataCache;
  const loadMetadata =
    dependencies.loadMetadata ??
    ((tokenUri, signal) =>
      loadFameMetadata(tokenUri, fetch, undefined, signal));

  return async (revision, signal) => {
    const cached = cache(
      async () => {
        const result = await loadMetadata(revision.tokenUri, signal);
        if (result.status !== "ready") {
          throw new FameMetadataResolutionError(result.error);
        }
        return result;
      },
      fameMetadataCacheKey(revision),
      { revalidate: false },
    );

    try {
      return await cached();
    } catch (error) {
      if (signal?.aborted) throw error;
      return fameMetadataFailure(
        error instanceof FameMetadataResolutionError
          ? error.message
          : "Token metadata could not be loaded",
      );
    }
  };
}

export const resolveFameMetadata = createFameMetadataResolver();
