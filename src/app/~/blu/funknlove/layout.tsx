import { DefaultProvider } from "@/context/default";
import { AppMain } from "@/layouts/AppMain";
import { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.OG_BASE_URL!),
  title: "Funk n Love",
  description:
    "An open edition music NFT where 100% of the proceeds go to charity",
  openGraph: {
    images: ["https://www.fameladysociety.com/~/blu/funknlove/cover.png"],
    siteName: "Funk n Love",
    title: "Funk n Love",
    description:
      "An open edition music NFT where 100% of the proceeds go to charity",
    url: "https://www.fameladysociety.com/~/blu/funknlove",
  },
  other: {
    ["twitter:title"]: "Funk n Love",
    ["twitter:description"]:
      "An open edition music NFT where 100% of the proceeds go to charity",
    ["twitter:image"]:
      "https://www.fameladysociety.com/~/blu/funknlove/cover.png",
    ["twitter:card"]: "summary_large_image",
  },
};

export default async function Home({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DefaultProvider mainnet sepolia siwe>
      <AppMain
        title="Funk n Love"
        mobileTitle="FnL"
        disableDesktopMenu
        fixedHeader
      >
        {children}
      </AppMain>
    </DefaultProvider>
  );
}
