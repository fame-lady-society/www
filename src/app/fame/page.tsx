import type { Metadata } from "next";
import { Layout } from "@/features/fame/layout";
import { fetchMetadata } from "frames.js/next";
import { baseUrl } from "@/app/frames/frames";

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

export default async function Page({}: {}) {
  return <Layout />;
}
