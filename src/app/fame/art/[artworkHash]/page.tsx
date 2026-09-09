import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { getFameMarketArtworkPresentation } from "@/features/fame-market/artworkPresentation";
import { BaseGalleryShell } from "@/features/fame-market/components/BaseGalleryShell";
import {
  GalleryArtworkUnavailableView,
  GalleryTokenView,
} from "@/features/fame-market/components/GalleryTokenView";
import { createBaseGalleryRuntime } from "@/features/fame-market/config/baseGallery";
import {
  buildFameMarketMetadata,
  fameMarketBaseUrl,
} from "@/features/fame-market/tokenPresentation";
import {
  fameMarketArtworkPath,
  parseFameMarketArtworkHash,
} from "@/features/fame-market/tokenRoute";
import { baseFameV3Stack } from "@/features/fame/contract";
import { fameForkModeEnabled } from "@/viem/baseRpcUrls";

type Props = {
  params: Promise<{ artworkHash: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const artworkHash = parseFameMarketArtworkHash((await params).artworkHash);
  if (!artworkHash) {
    return {
      title: "Artwork not found | FAME Marketplace",
      robots: { index: false, follow: false },
    };
  }

  const presentation = await getFameMarketArtworkPresentation(artworkHash);
  if (presentation.status === "not-found") {
    return {
      title: "Artwork not found | FAME Marketplace",
      robots: { index: false, follow: false },
    };
  }
  return buildFameMarketMetadata(
    presentation,
    fameMarketArtworkPath(artworkHash),
  );
}

export default async function Page({ params }: Props) {
  const artworkHash = parseFameMarketArtworkHash((await params).artworkHash);
  if (!artworkHash) notFound();

  const presentation = await getFameMarketArtworkPresentation(artworkHash);
  if (presentation.status === "not-found") notFound();

  const canonicalUrl = new URL(
    fameMarketArtworkPath(artworkHash),
    fameMarketBaseUrl(),
  ).toString();
  const shell = (children: ReactNode) => (
    <BaseGalleryShell
      config={createBaseGalleryRuntime(baseFameV3Stack(), {
        forkMode: fameForkModeEnabled(),
      })}
    >
      {children}
    </BaseGalleryShell>
  );

  if (presentation.status === "found") {
    return shell(
      <GalleryTokenView
        tokenId={presentation.tokenId}
        initialRevision={presentation.revision}
        initialMetadata={presentation.metadata}
        canonicalUrl={canonicalUrl}
        expectedArtworkHash={artworkHash}
      />,
    );
  }

  return shell(
    <GalleryArtworkUnavailableView
      metadata={presentation.metadata}
      canonicalUrl={canonicalUrl}
      message={
        presentation.status === "unassigned"
          ? "This artwork is not currently assigned to a Society token, so it is not available to purchase."
          : "The artwork’s current Society token could not be confirmed. Purchasing is disabled until Base state is available."
      }
    />,
  );
}
