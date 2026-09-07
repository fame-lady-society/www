import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BaseGalleryShell } from "@/features/fame-market/components/BaseGalleryShell";
import { GalleryTokenView } from "@/features/fame-market/components/GalleryTokenView";
import { createBaseGalleryRuntime } from "@/features/fame-market/config/baseGallery";
import {
  buildFameMarketTokenMetadata,
  fameMarketBaseUrl,
  fameMarketTokenCanonicalPath,
  getFameMarketTokenPresentation,
  parseFameMarketTokenId,
} from "@/features/fame-market/tokenPresentation";
import { baseFameV3Stack } from "@/features/fame/contract";
import { fameForkModeEnabled } from "@/viem/baseRpcUrls";

type Props = {
  params: Promise<{ tokenId: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tokenId = parseFameMarketTokenId((await params).tokenId);
  if (tokenId === null) {
    return {
      title: "Token not found | FAME Marketplace",
      robots: { index: false, follow: false },
    };
  }
  return buildFameMarketTokenMetadata(
    await getFameMarketTokenPresentation(tokenId),
  );
}

export default async function Page({ params }: Props) {
  const tokenId = parseFameMarketTokenId((await params).tokenId);
  if (tokenId === null) notFound();

  const presentation = await getFameMarketTokenPresentation(tokenId);
  const canonicalUrl = new URL(
    fameMarketTokenCanonicalPath(presentation),
    fameMarketBaseUrl(),
  ).toString();

  return (
    <BaseGalleryShell
      config={createBaseGalleryRuntime(baseFameV3Stack(), {
        forkMode: fameForkModeEnabled(),
      })}
    >
      <GalleryTokenView
        tokenId={tokenId}
        initialRevision={presentation.revision}
        initialMetadata={presentation.metadata}
        canonicalUrl={canonicalUrl}
      />
    </BaseGalleryShell>
  );
}
