import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "@/styles/tailwind.css";
import { DefaultProvider } from "@/context/default";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.OG_BASE_URL!),
  title: "Save a Lady",
  description: "Save a Fame Lady.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "FAMEus",
    images: [
      {
        url: `/images/fls-wrap.gif`,
        width: 400,
        height: 400,
        alt: "Save a Fame Lady!",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@fameladysociety",
    images: [
      {
        url: `/images/reveal/fls_title.png`,
        width: 400,
        height: 400,
        alt: "It's a wrap!",
      },
    ],
    title: "#itsawrap",
    description: "Save a Fame Lady.",
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
