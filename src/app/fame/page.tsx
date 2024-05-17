import type { Metadata } from "next";
import Fame from "@/routes/Fame";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.fameladysociety.com"),
  title: "$FAME",
  description: "The home of $FAME.",
  openGraph: {
    images: ["/images/fame/fame.png"],
  },
};

export default async function Page({}: {}) {
  return <Fame />;
}
