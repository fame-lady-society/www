import type { Metadata } from "next";
import { GalleryView } from "@/features/fame-gallery/components/GalleryView";

export const metadata: Metadata = {
  title: "TEST gallery",
  description: "Browse the Base Sepolia TEST gallery.",
};

export default function Page() {
  return <GalleryView />;
}
