import type { Metadata } from "next";
import { Layout } from "@/features/fame/layout";
import { fetchMetadata } from "frames.js/next";
import { baseUrl } from "@/app/frames/frames";
import { getDN404Storage } from "@/service/fame";
import { fameFromNetwork } from "@/features/fame/contract";
import { client as baseClient } from "@/viem/base-client";
import { base } from 'viem/chains'

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL("https://www.fameladysociety.com"),
    title: "$FAME",
    description: "The home of $FAME.",
    openGraph: {
      images: ["/images/fame/gold-leaf.png"],
    },
    other: await fetchMetadata(new URL(`/fame/frame`, baseUrl)),
  };
}

export default async function Page({ }: {}) {
  const { burnPool } = await getDN404Storage(baseClient, fameFromNetwork(base.id));
  return <Layout burnPool={burnPool.map((tokenId) => Number(tokenId))} />;
}
