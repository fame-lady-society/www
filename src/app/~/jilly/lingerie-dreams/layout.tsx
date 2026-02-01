import { AppMain } from "@/layouts/AppMain";
import { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.OG_BASE_URL!),
  title: "Lingerie Dreams",
  description: "A 1/1 limited edition Music NFT",
  openGraph: {
    images: [
      "https://www.fameladysociety.com/~/jilly/lingerie-dreams/social.jpeg",
    ],
    siteName: "Lingerie Dreams",
    title: "Lingerie Dreams",
    description: "A 1/1 limited edition Music NFT",
    url: "https://www.fameladysociety.com/~/jilly/lingerie-dreams",
  },
  other: {
    ["twitter:title"]: "Lingerie Dreams",
    ["twitter:description"]: "A 1/1 limited edition Music NFT",
    ["twitter:image"]:
      "https://www.fameladysociety.com/~/jilly/lingerie-dreams/social.jpeg",
    ["twitter:card"]: "summary_large_image",
    ["twitter:site"]: "@FAMEorDIE",
    ["twitter:creator"]: "@FAMEorDIE",
  },
};

export default async function Home({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <AppMain title="Lingerie Dreams" mobileTitle="LD" disableDesktopMenu>
        <div className="w-full px-4 py-8">
          <div className="max-w-4xl mx-auto">{children}</div>
        </div>
      </AppMain>
  );
}
