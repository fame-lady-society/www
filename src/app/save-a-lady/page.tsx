import { fetchListings } from "@/lib/openseaListings";
import { SaveLady } from "./SaveLady";
import { Listing } from "opensea-js";
import { AppMain } from "@/layouts/AppMain";
import { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  other: {
    ["fc:miniapp"]: JSON.stringify({
      version: "1",
      imageUrl: "https://www.fameladysociety.com/images/app.png",
      button: {
        title: "Sweep and Wrap",
        action: {
          type: "launch_miniapp",
          url: "https://www.fameladysociety.com/save-a-lady",
          name: "Sweep and Wrap",
          splashImageUrl: "https://www.fameladysociety.com/images/splash.png",
          splashBackgroundColor: "#040404",
        },
      },
    }),
  },
};

export default async function Home() {
  let listings: Listing[] = [];
  try {
    const res = await fetchListings("fameladysquad");
    listings = res.listings;
  } catch (e) {
    // swallow error; client component will attempt fetch and show message
    console.error("Failed SSR listings", e);
  }
  return (
    <AppMain title="save a lady" mobileTitle="">
      <SaveLady initialListings={listings} />
    </AppMain>
  );
}
