import Alert from "@mui/material/Alert";
import Container from "@mui/material/Container";
import type { Metadata } from "next";
import { BaseGalleryShell } from "@/features/fame-market/components/BaseGalleryShell";
import { GalleryView } from "@/features/fame-market/components/GalleryView";
import { createBaseGalleryRuntime } from "@/features/fame-market/config/baseGallery";
import { parseBaseGalleryContracts } from "@/features/fame-market/contracts";
import { FameShell } from "@/features/fame/components/FameShell";
import {
  baseFameCheckoutAddress,
  baseUniversalMarketplaceAddress,
} from "@/features/fame/contract";
import { fameForkModeEnabled } from "@/viem/baseRpcUrls";

export const metadata: Metadata = {
  title: "FAME Marketplace",
  description: "Browse the FAME artwork marketplace on Base.",
  openGraph: { images: ["/images/fame/gold-leaf.png"] },
};

export default function Page() {
  const contracts = parseBaseGalleryContracts({
    marketplace: baseUniversalMarketplaceAddress,
    checkout: baseFameCheckoutAddress,
  });

  if (!contracts) {
    return (
      <FameShell title="FAME Marketplace" activeFamePage="marketplace">
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Alert severity="error">
            The Base marketplace address is not configured.
          </Alert>
        </Container>
      </FameShell>
    );
  }

  return (
    <BaseGalleryShell
      config={createBaseGalleryRuntime(contracts, {
        forkMode: fameForkModeEnabled(),
      })}
    >
      <GalleryView />
    </BaseGalleryShell>
  );
}
