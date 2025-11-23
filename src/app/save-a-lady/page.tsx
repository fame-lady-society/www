import { fetchListings } from "@/lib/openseaListings";
import { SaveLady } from "./SaveLady";
import { Listing } from "opensea-js";
import { AppMain } from "@/layouts/AppMain";
import { Typography } from "@mui/material";

export const revalidate = 60; // keep listings reasonably fresh

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
    <AppMain title="save a lady">
      <SaveLady initialListings={listings} />
    </AppMain>
  );
}
