import type { Metadata } from "next";
import { BaseGalleryShell } from "@/features/fame-market/components/BaseGalleryShell";
import { GalleryView } from "@/features/fame-market/components/GalleryView";
import { createBaseGalleryRuntime } from "@/features/fame-market/config/baseGallery";
import { baseFameV3Stack } from "@/features/fame/contract";
import { fameForkModeEnabled } from "@/viem/baseRpcUrls";

export const metadata: Metadata = {
  title: "FAME Marketplace",
  description: "Browse the FAME artwork marketplace on Base.",
  openGraph: { images: ["/images/fame/gold-leaf.png"] },
};

export default function Page() {
  return (
    <BaseGalleryShell
      config={createBaseGalleryRuntime(baseFameV3Stack(), {
        forkMode: fameForkModeEnabled(),
      })}
    >
      <GalleryView />
    </BaseGalleryShell>
  );
}
