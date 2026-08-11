import type { Metadata } from "next";
import { BaseGalleryShell } from "@/features/fame-market/components/BaseGalleryShell";
import { GalleryPurchaseReceiptView } from "@/features/fame-market/components/GalleryPurchaseReceiptView";
import { createBaseGalleryRuntime } from "@/features/fame-market/config/baseGallery";
import { baseFameV3Stack } from "@/features/fame/contract";
import { fameForkModeEnabled } from "@/viem/baseRpcUrls";

export const metadata: Metadata = {
  title: "FAME purchase",
  description: "View a completed FAME Marketplace purchase on Base.",
};

export default async function Page({
  params,
}: {
  params: Promise<{ transactionHash: string }>;
}) {
  const { transactionHash } = await params;

  return (
    <BaseGalleryShell
      config={createBaseGalleryRuntime(baseFameV3Stack(), {
        forkMode: fameForkModeEnabled(),
      })}
    >
      <GalleryPurchaseReceiptView transactionHash={transactionHash} />
    </BaseGalleryShell>
  );
}
