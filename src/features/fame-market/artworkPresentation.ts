import { cache } from "react";
import { unstable_cache } from "next/cache";
import { keccak256, stringToHex, type Hash } from "viem";
import {
  fameMetadataFailure,
  resolveFameMetadataIdentity,
  type FameArtworkRevision,
  type FameMetadataResult,
} from "@/features/fame/metadata";
import {
  findFameArtworkLocation,
  getFameArtworkRevisionAt,
  getFameMetadataRegistry,
} from "@/service/fame";

type FameMarketArtworkPresentationDependencies = Readonly<{
  findLocation: (artworkHash: Hash) => Promise<{
    blockNumber?: string;
    location: { tokenId: number; artworkHash: Hash } | null;
  }>;
  readRevision: (
    tokenId: number,
    artworkHash: Hash,
    blockNumber?: string,
  ) => Promise<FameArtworkRevision | null>;
  readRegistry: (blockNumber?: string) => Promise<{
    entries: readonly { metadataId: number; tokenUri: string }[];
  }>;
  resolveMetadata: (
    revision: Pick<FameArtworkRevision, "tokenUri" | "artworkHash">,
  ) => Promise<FameMetadataResult>;
}>;

const findCachedArtworkLocation = unstable_cache(
  async (artworkHash: Hash) => findFameArtworkLocation(artworkHash),
  ["fame-market-first-artwork-location-v1"],
  { revalidate: 10 },
);

const readCachedMetadataRegistry = unstable_cache(
  async (blockNumber?: string) => getFameMetadataRegistry(blockNumber),
  ["fame-market-metadata-registry-v1"],
  { revalidate: 60 },
);

const defaultDependencies: FameMarketArtworkPresentationDependencies = {
  findLocation: findCachedArtworkLocation,
  readRevision: async (tokenId, artworkHash, blockNumber) => {
    if (!blockNumber) return null;
    return getFameArtworkRevisionAt(tokenId, artworkHash, blockNumber);
  },
  readRegistry: readCachedMetadataRegistry,
  resolveMetadata: resolveFameMetadataIdentity,
};

type ArtworkResolutionBase = Readonly<{
  artworkHash: Hash;
  revision: FameArtworkRevision | null;
  metadata: FameMetadataResult;
}>;

export type FameMarketArtworkPresentation =
  | (ArtworkResolutionBase & {
      status: "found";
      tokenId: number;
      revision: FameArtworkRevision;
    })
  | (ArtworkResolutionBase & { status: "unassigned" })
  | (ArtworkResolutionBase & { status: "unavailable" })
  | (ArtworkResolutionBase & { status: "not-found" });

export async function loadFameMarketArtworkPresentation(
  artworkHash: Hash,
  dependencies: FameMarketArtworkPresentationDependencies = defaultDependencies,
): Promise<FameMarketArtworkPresentation> {
  try {
    const snapshot = await dependencies.findLocation(artworkHash);

    if (!snapshot.location) {
      const registry = await dependencies.readRegistry(snapshot.blockNumber);
      const archived = registry.entries.find(
        ({ tokenUri }) =>
          keccak256(stringToHex(tokenUri)).toLowerCase() ===
          artworkHash.toLowerCase(),
      );
      if (!archived) {
        return {
          status: "not-found",
          artworkHash,
          revision: null,
          metadata: fameMetadataFailure("Artwork was not found"),
        };
      }
      const metadataReference = {
        tokenUri: archived.tokenUri,
        artworkHash,
      };
      return {
        status: "unassigned",
        artworkHash,
        revision: null,
        metadata: await dependencies.resolveMetadata(metadataReference),
      };
    }

    const location = snapshot.location;
    const revision = await dependencies.readRevision(
      location.tokenId,
      location.artworkHash,
      snapshot.blockNumber,
    );
    if (!revision) throw new Error("Artwork metadata revision is unavailable");
    const metadata = await dependencies.resolveMetadata(revision);

    return {
      status: "found",
      artworkHash,
      tokenId: location.tokenId,
      revision,
      metadata,
    };
  } catch (cause) {
    console.error(
      `[fame market artwork:${artworkHash}] Artwork location is unavailable`,
      cause,
    );
    return {
      status: "unavailable",
      artworkHash,
      revision: null,
      metadata: fameMetadataFailure("Artwork location is unavailable"),
    };
  }
}

export const getFameMarketArtworkPresentation = cache(
  loadFameMarketArtworkPresentation,
);
