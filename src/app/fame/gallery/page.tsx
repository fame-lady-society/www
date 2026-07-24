import Alert from "@mui/material/Alert";
import Container from "@mui/material/Container";
import type { Metadata } from "next";
import { BaseGalleryShell } from "@/features/fame-gallery/components/BaseGalleryShell";
import { GalleryView } from "@/features/fame-gallery/components/GalleryView";
import {
  createBaseGalleryRuntime,
  parseBaseMarketplaceAddress,
} from "@/features/fame-gallery/config/baseGallery";

export const metadata: Metadata = {
  title: "FAME gallery",
  description: "Browse the FAME artwork gallery on Base.",
};

export default function Page() {
  const marketplaceAddress = parseBaseMarketplaceAddress(
    process.env.NEXT_PUBLIC_BASE_UNIVERSAL_MARKETPLACE_ADDRESS,
  );

  if (!marketplaceAddress) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="error">
          The Base gallery marketplace address is not configured.
        </Alert>
      </Container>
    );
  }

  return (
    <BaseGalleryShell config={createBaseGalleryRuntime(marketplaceAddress)}>
      <GalleryView />
    </BaseGalleryShell>
  );
}
