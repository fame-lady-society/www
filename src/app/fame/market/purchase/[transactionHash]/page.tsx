import Alert from "@mui/material/Alert";
import Container from "@mui/material/Container";
import type { Metadata } from "next";
import { BaseGalleryShell } from "@/features/fame-market/components/BaseGalleryShell";
import { GalleryPurchaseReceiptView } from "@/features/fame-market/components/GalleryPurchaseReceiptView";
import { createBaseGalleryRuntime } from "@/features/fame-market/config/baseGallery";
import { parseBaseGalleryContracts } from "@/features/fame-market/contracts";
import {
  baseFameCheckoutAddress,
  baseUniversalMarketplaceAddress,
} from "@/features/fame/contract";
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
  const contracts = parseBaseGalleryContracts({
    marketplace: baseUniversalMarketplaceAddress,
    checkout: baseFameCheckoutAddress,
  });

  if (!contracts) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="error">
          The Base marketplace address is not configured.
        </Alert>
      </Container>
    );
  }

  return (
    <BaseGalleryShell
      config={createBaseGalleryRuntime(contracts, {
        forkMode: fameForkModeEnabled(),
      })}
    >
      <GalleryPurchaseReceiptView transactionHash={transactionHash} />
    </BaseGalleryShell>
  );
}
