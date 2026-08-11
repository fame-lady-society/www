import type { Metadata } from "next";
import "@/styles/tailwind.css";
import { DefaultProvider } from "@/context/default";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.OG_BASE_URL!),
  title: {
    template: "FAMEus Recovery - %s",
    default: "FAMEus Recovery",
  },
  description:
    "FAMEus governance is paused. These legacy pages remain available for existing holders to manage and unwrap Governance Society NFTs.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "FAMEus",
    images: [
      {
        url: `/images/fame/gold-leaf-square.png`,
        width: 400,
        height: 400,
        alt: "$FAME",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@fameladysociety",
    images: [
      {
        url: `/images/fame/gold-leaf-square.png`,
        width: 400,
        height: 400,
        alt: "$FAME",
      },
    ],
    description:
      "FAMEus governance is paused. Legacy recovery remains available for existing holders.",
    title: "FAMEus Recovery",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <DefaultProvider>
      {children}
    </DefaultProvider>
  );
}
