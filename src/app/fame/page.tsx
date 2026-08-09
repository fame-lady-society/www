import type { Metadata } from "next";
import { Layout } from "@/features/fame/layout";
import {
  emptyLandingMarket,
  presentLandingMarket,
} from "@/features/fame-landing/pricePresentation";
import { readFameLandingSnapshot } from "@/features/fame-landing/snapshot";

export const revalidate = 0;

export const metadata: Metadata = {
  metadataBase: new URL("https://www.fameladysociety.com"),
  title: "$FAME",
  description: "The home of $FAME.",
  openGraph: { images: ["/images/fame/gold-leaf.png"] },
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
