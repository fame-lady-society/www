import type { Metadata } from "next";
import { Layout } from "@/features/fame/layout";
import { getCachedMarketStats } from "@/features/fame-landing/cachedMarketStats";
import { presentLandingMarket } from "@/features/fame-landing/pricePresentation";

export const revalidate = 300;

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
  const stats = await getCachedMarketStats();
  return <Layout market={presentLandingMarket(stats)} />;
}
