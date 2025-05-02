import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "@/styles/tailwind.css";
import { DefaultProvider } from "@/context/default";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.OG_BASE_URL!),
  title: {
    template: "FAMEus - %s",
    default: "Home",
  },
  description: "The FAMEus DAO is redefining web3",
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
    description: "The FAMEus DAO is redefining web3",
    title: "The future of web3",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <DefaultProvider base>{children}</DefaultProvider>;
}
