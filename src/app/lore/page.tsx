import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.OG_BASE_URL!),
  title: "Fame Lady Society - Lore",
  description:
    "The HERstoric story of Fame Lady Society - from the first all-female PFP collection to a community-owned revolution.",
  openGraph: {
    images: ["https://fameladysociety.com/images/Flsociety_morg_mock.jpeg"],
    siteName: "Fame Lady Society",
    title: "Fame Lady Society - Lore",
    description:
      "The HERstoric story of Fame Lady Society - from the first all-female PFP collection to a community-owned revolution.",
  },
  other: {
    ["twitter:title"]: "Fame Lady Society - Lore",
    ["twitter:description"]:
      "The HERstoric story of Fame Lady Society - from the first all-female PFP collection to a community-owned revolution.",
    ["twitter:image"]:
      "https://fameladysociety.com/images/Flsociety_morg_mock.jpeg",
    ["twitter:card"]: "summary_large_image",
    ["twitter:site"]: "@FameLadySociety",
  },
};

export { default } from "@/routes/Lore";
