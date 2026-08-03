import Alert from "@mui/material/Alert";
import Container from "@mui/material/Container";
import type { ReactNode } from "react";
import { BaseGalleryShell } from "@/features/fame-gallery/components/BaseGalleryShell";
import { createBaseGalleryRuntime } from "@/features/fame-gallery/config/baseGallery";
import { parseBaseGalleryForkContracts } from "@/features/fame-gallery/contracts";

export default function Layout({ children }: { children: ReactNode }) {
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
      {children}
    </BaseGalleryShell>
  );
}
