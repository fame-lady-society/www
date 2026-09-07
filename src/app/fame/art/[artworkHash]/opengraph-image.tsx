import { notFound } from "next/navigation";
import { getFameMarketArtworkPresentation } from "@/features/fame-market/artworkPresentation";
import { createFameMarketOpenGraphImage } from "@/features/fame-market/openGraphImage";
import { parseFameMarketArtworkHash } from "@/features/fame-market/tokenRoute";

export const alt = "FAME Marketplace artwork";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ artworkHash: string }>;
}) {
  const artworkHash = parseFameMarketArtworkHash((await params).artworkHash);
  if (!artworkHash) notFound();

  const presentation = await getFameMarketArtworkPresentation(artworkHash);
  if (presentation.status === "not-found") notFound();
  return createFameMarketOpenGraphImage(presentation);
}
