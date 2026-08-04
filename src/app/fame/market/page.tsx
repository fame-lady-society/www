import Alert from "@mui/material/Alert";
import Container from "@mui/material/Container";
import type { Metadata } from "next";
import { BaseGalleryShell } from "@/features/fame-market/components/BaseGalleryShell";
import { GalleryView } from "@/features/fame-market/components/GalleryView";
import { createBaseGalleryRuntime } from "@/features/fame-market/config/baseGallery";
import { parseBaseGalleryForkContracts } from "@/features/fame-market/contracts";

export const metadata: Metadata = {
  title: "FAME Marketplace",
  description: "Browse the FAME artwork marketplace on Base.",
};

export default function Page() {
  const contracts = parseBaseGalleryForkContracts({
    marketplace: process.env.NEXT_PUBLIC_BASE_UNIVERSAL_MARKETPLACE_ADDRESS,
    checkout: process.env.NEXT_PUBLIC_BASE_FAME_CHECKOUT_ADDRESS,
    forkMode: process.env.NEXT_PUBLIC_FAME_FORK_MODE === "1",
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
    <BaseGalleryShell config={createBaseGalleryRuntime(contracts)}>
      <GalleryView />
    </BaseGalleryShell>
  );
}
