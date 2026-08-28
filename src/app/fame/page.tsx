import type { Metadata } from "next";
import { Layout } from "@/features/fame/layout";
import {
  emptyLandingMarket,
  presentLandingMarket,
} from "@/features/fame-landing/pricePresentation";
import { readFameLandingSnapshot } from "@/features/fame-landing/snapshot";

export const revalidate = 0;

const fameSocialCard = {
  url: "/images/fame/fame-social-card.png",
  width: 1200,
  height: 630,
  alt: "$FAME — Hold the token. Meet Society.",
} as const;

export const metadata: Metadata = {
  metadataBase: new URL("https://www.fameladysociety.com"),
  title: "$FAME",
  description: "The home of $FAME.",
  openGraph: { images: [fameSocialCard] },
  twitter: {
    card: "summary_large_image",
    site: "@FameLadySociety",
    title: "$FAME",
    description: "The home of $FAME.",
    images: [fameSocialCard],
  },
  // Keep frame discovery local and static; the landing must not fetch itself.
  other: {
    "fc:frame": JSON.stringify({
      version: "next",
      imageUrl: "/images/fame/gold-leaf.png",
      button: { title: "FAME" },
    }),
  },
};

export default async function Page() {
  const result = await readFameLandingSnapshot();
  const market =
    result.status === "available"
      ? presentLandingMarket(result.snapshot)
      : emptyLandingMarket();
  return <Layout market={market} />;
}
