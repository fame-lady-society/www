import type { Metadata } from "next";
import { DefaultProvider } from "@/context/default";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.OG_BASE_URL!),
  title: "Fame Lady Names | Fame Lady Society",
  description:
    "Claim your unique name in the Fame Lady Society. Create your identity, link verified addresses, and join the community.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Fame Lady Society",
    images: [
      {
        url: `/images/fls-wrap.gif`,
        width: 400,
        height: 400,
        alt: "Fame Lady Names",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@fameladysociety",
    title: "Fame Lady Names",
    description:
      "Claim your unique name in the Fame Lady Society. Create your identity, link verified addresses, and join the community.",
  },
};

export default function NamingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <DefaultProvider mainnet baseSepolia siwe>
      {children}
    </DefaultProvider>
  );
}
