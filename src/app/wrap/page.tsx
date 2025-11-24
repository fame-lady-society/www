import type { Metadata } from "next";
import { RedirectType, redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Wrap Your Lady",
  description: "Wrap your Fame Lady.",
  other: {
    ["fc:miniapp"]: JSON.stringify({
      version: "1",
      imageUrl: "https://www.fameladysociety.com/images/app.png",
      button: {
        title: "Wrap",
        action: {
          type: "launch_miniapp",
          url: "https://www.fameladysociety.com/mainnet/wrap",
          name: "Wrap",
          splashImageUrl: "https://www.fameladysociety.com/images/splash.png",
          splashBackgroundColor: "#040404",
        },
      },
    }),
  },
};

export default async function Page() {
  redirect(`/mainnet/wrap`, RedirectType.replace);
}
