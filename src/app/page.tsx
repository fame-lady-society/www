import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.OG_BASE_URL!),
  title: "Fame Lady Society",
  description: "Unstoppable",
  openGraph: {
    images: ["https://fameladysociety.com/images/fls-wrap.gif"],
    siteName: "#itsawrap",
    title: "Fame Lady Society",
    description: "Unstoppable",
  },
  other: {
    ["twitter:title"]: "Fame Lady Society",
    ["twitter:description"]: "FAQ",
    ["twitter:image"]:
      "https://fameladysociety.com/images/Flsociety_morg_mock.jpeg",
    ["twitter:card"]: "summary_large_image",
    ["twitter:site"]: "@FameLadySociety",
    ["twitter:creator"]: "@0xflick",
    ["fc:frame"]: JSON.stringify({
      version: "next",
      imageUrl: "https://www.fameladysociety.com/images/app.png",
      button: {
        title: "Make me FAMEus",
        action: {
          type: "launch_frame",
          url: "https://www.fameladysociety.com/~/blu/funknlove",
          name: "Funk n Love",
          splashImageUrl: "https://www.fameladysociety.com/images/splash.png",
          splashBackgroundColor: "#040404",
        },
      },
    }),
  },
};

export { default } from "@/routes/Home";
