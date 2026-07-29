import type { Metadata } from "next";
import { Layout } from "@/features/fame/layout";
import { fetchMetadata } from "frames.js/next";
import { baseUrl } from "@/app/frames/frames";
import { getFamePools } from "@/service/fame";
import type { BurnPoolToken } from "@/features/fame/burnPoolImage";

export async function generateMetadata(): Promise<Metadata> {
  let frameMetadata;
  try {
    frameMetadata = await fetchMetadata(new URL(`/fame/frame`, baseUrl));
  } catch (error) {
    console.warn("Failed to fetch frame metadata during build:", error);
    frameMetadata = undefined;
  }

  return {
    metadataBase: new URL("https://www.fameladysociety.com"),
    title: "$FAME",
    description: "The home of $FAME.",
    openGraph: {
      images: ["/images/fame/gold-leaf.png"],
    },
    ...(frameMetadata && { other: frameMetadata }),
  };
}

export default async function Page({}: {}) {
  let burnPool: BurnPoolToken[] = [];
  let mintPool: Array<{ image: string }> = [];

  try {
    const pools = await getFamePools();
    burnPool = pools.burnPool;
    mintPool = pools.mintPool;
  } catch (error) {
    console.warn("Failed to fetch fame pools during build:", error);
  }

  return (
    <Layout
      burnPool={burnPool}
      unrevealed={mintPool.map(({ image }) => image)}
    />
  );
}

export const dynamic = "force-dynamic";
