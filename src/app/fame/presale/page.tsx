import type { Metadata } from "next";
import { FamePresale } from "@/routes/FamePresale";

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL(process.env.OG_BASE_URL!),
    title: "$FAME",
    description: "The FAMEus Presale",
    openGraph: {
      images: ["/images/fame/eyes.png"],
      description: "The FAMEus Presale",
      title: "$FAME",
    },
  };
}

export default async function Page() {
  return <FamePresale network="base" />;
}
