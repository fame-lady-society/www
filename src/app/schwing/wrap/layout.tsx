import type { Metadata } from "next";

import "@/styles/tailwind.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.OG_BASE_URL!),
  title: {
    template: "Schwing - %s",
    default: "Schwing Wrap",
  },
  description: "Schwing NFT wrapping tools.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Schwing",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@fameladysociety",
    description: "Schwing NFT wrapping tools.",
    title: "Schwing Wrap",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
