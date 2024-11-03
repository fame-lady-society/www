import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "@/styles/tailwind.css";
import { DefaultProvider } from "@/context/default";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.OG_BASE_URL!),
  title: "Transparency",
  description: "$FAME presale transparency report",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "FAMEus",
    images: [
      {
        url: `/images/fame/gold-leaf-square.png`,
        width: 400,
        height: 400,
        alt: "$FAME transparency",
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
        alt: "$FAME transparency",
      },
    ],
    title: "$FAME transparency",
    description: "$FAME presale transparency report",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <DefaultProvider mainnet base>
      {children}
    </DefaultProvider>
  );
}
