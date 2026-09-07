import { cache } from "react";
import type { Metadata } from "next";
import {
  fameMetadataFailure,
  resolveFameMetadata,
  type FameArtworkRevision,
  type FameMetadataResult,
} from "@/features/fame/metadata";
import { parseFameCollectionTokenIdParam } from "@/features/fame/collection";
import { getFameArtworkRevisions } from "@/service/fame";
import {
  fameMarketArtworkPath,
  fameMarketArtworkOrTokenPath,
  fameMarketTokenFallbackName,
} from "./tokenRoute";

export { fameMarketTokenPath } from "./tokenRoute";

export type FameMarketTokenPresentation = Readonly<{
  tokenId: number;
  revision: FameArtworkRevision | null;
  metadata: FameMetadataResult;
}>;

type FameMarketTokenPresentationDependencies = Readonly<{
  readRevision: (tokenId: number) => Promise<FameArtworkRevision | null>;
  resolveMetadata: (
    revision: FameArtworkRevision,
  ) => Promise<FameMetadataResult>;
}>;

const defaultDependencies: FameMarketTokenPresentationDependencies = {
  readRevision: async (tokenId) => {
    const snapshot = await getFameArtworkRevisions([tokenId]);
    return snapshot.revisions[0] ?? null;
  },
  resolveMetadata: resolveFameMetadata,
};

export function parseFameMarketTokenId(rawTokenId: string): number | null {
  return parseFameCollectionTokenIdParam(rawTokenId);
}

export function fameMarketBaseUrl() {
  return new URL(process.env.OG_BASE_URL ?? "https://www.fameladysociety.com");
}

export function fameMarketOgArtworkUrl(
  rawArtwork: string,
  baseUrl = fameMarketBaseUrl(),
) {
  if (rawArtwork.startsWith("data:")) return rawArtwork;

  const artwork = new URL(rawArtwork, baseUrl).toString();
  if (rawArtwork.startsWith("/")) return artwork;

  // next/og embeds image bytes into an intermediate SVG. Bound remote artwork
  // first so large originals cannot exceed the renderer's XML buffer limit.
  const optimizerUrl = new URL("/_next/image", baseUrl);
  optimizerUrl.searchParams.set("url", artwork);
  optimizerUrl.searchParams.set("w", "640");
  optimizerUrl.searchParams.set("q", "75");
  return optimizerUrl.toString();
}

export async function loadFameMarketTokenPresentation(
  tokenId: number,
  dependencies: FameMarketTokenPresentationDependencies = defaultDependencies,
): Promise<FameMarketTokenPresentation> {
  try {
    const revision = await dependencies.readRevision(tokenId);
    if (!revision) throw new Error("Token artwork revision is unavailable");
    return {
      tokenId,
      revision,
      metadata: await dependencies.resolveMetadata(revision),
    };
  } catch (cause) {
    console.error(
      `[fame market token:${tokenId}] Token metadata is unavailable`,
      cause,
    );
    return {
      tokenId,
      revision: null,
      metadata: fameMetadataFailure("Token metadata is unavailable"),
    };
  }
}

export const getFameMarketTokenPresentation = cache(
  loadFameMarketTokenPresentation,
);

export function fameMarketTokenName(
  presentation: Pick<FameMarketTokenPresentation, "metadata">,
) {
  return presentation.metadata.status === "ready" && presentation.metadata.name
    ? presentation.metadata.name
    : fameMarketTokenFallbackName();
}

function conciseDescription(description: string) {
  const normalized = description.replace(/\s+/gu, " ").trim();
  if (normalized.length <= 160) return normalized;
  return `${normalized.slice(0, 159).trimEnd()}…`;
}

export function fameMarketTokenDescription(
  presentation: Pick<FameMarketTokenPresentation, "metadata">,
) {
  if (
    presentation.metadata.status === "ready" &&
    presentation.metadata.description
  ) {
    return conciseDescription(presentation.metadata.description);
  }
  return "View this FAME Society artwork and buy it with FAME, ETH, or USDC when it is available in the FAME Marketplace on Base.";
}

export function buildFameMarketTokenMetadata(
  presentation: FameMarketTokenPresentation,
): Metadata {
  const canonical = fameMarketTokenCanonicalPath(presentation);
  return buildFameMarketMetadata(presentation, canonical);
}

export function fameMarketTokenCanonicalPath(
  presentation: FameMarketTokenPresentation,
) {
  return fameMarketArtworkOrTokenPath(
    presentation.tokenId,
    presentation.revision?.artworkHash,
  );
}

export function buildFameMarketMetadata(
  presentation: Pick<FameMarketTokenPresentation, "metadata">,
  canonical: string,
): Metadata {
  const name = fameMarketTokenName(presentation);
  const title = `${name} | FAME Marketplace`;
  const description = fameMarketTokenDescription(presentation);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonical,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
