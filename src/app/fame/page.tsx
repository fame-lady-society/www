import type { Metadata } from "next";
import { FameLandingPage } from "@/features/fame-landing/components/FameLandingPage";
import { getCachedMarketStats } from "@/features/fame-landing/cachedMarketStats";
import { FameShell } from "@/features/fame/components/FameShell";

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
  return (
    <FameShell>
      <FameLandingPage stats={stats} />
    </FameShell>
  );
}
