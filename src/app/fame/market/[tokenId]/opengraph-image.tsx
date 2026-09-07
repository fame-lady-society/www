import { notFound } from "next/navigation";
import { createFameMarketOpenGraphImage } from "@/features/fame-market/openGraphImage";
import {
  getFameMarketTokenPresentation,
  parseFameMarketTokenId,
} from "@/features/fame-market/tokenPresentation";

export const alt = "FAME Marketplace artwork";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ tokenId: string }>;
}) {
  const tokenId = parseFameMarketTokenId((await params).tokenId);
  if (tokenId === null) notFound();

  const presentation = await getFameMarketTokenPresentation(tokenId);
  return createFameMarketOpenGraphImage(presentation);
}
