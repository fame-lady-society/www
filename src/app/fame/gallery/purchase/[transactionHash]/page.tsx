import Alert from "@mui/material/Alert";
import Container from "@mui/material/Container";
import type { Metadata } from "next";
import { BaseGalleryShell } from "@/features/fame-gallery/components/BaseGalleryShell";
import { GalleryPurchaseReceiptView } from "@/features/fame-gallery/components/GalleryPurchaseReceiptView";
import { createBaseGalleryRuntime } from "@/features/fame-gallery/config/baseGallery";
import { parseBaseGalleryForkContracts } from "@/features/fame-gallery/contracts";

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
  const contracts = parseBaseGalleryForkContracts({
    marketplace: process.env.NEXT_PUBLIC_BASE_UNIVERSAL_MARKETPLACE_ADDRESS,
    checkout: process.env.NEXT_PUBLIC_BASE_FAME_CHECKOUT_ADDRESS,
    forkMode: process.env.NEXT_PUBLIC_FAME_FORK_MODE === "1",
  });

  if (!contracts) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="error">
          The Base gallery marketplace address is not configured.
        </Alert>
      </Container>
    );
  }

  return (
    <BaseGalleryShell config={createBaseGalleryRuntime(contracts)}>
      <GalleryPurchaseReceiptView transactionHash={transactionHash} />
    </BaseGalleryShell>
  );
}
