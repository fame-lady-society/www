import Alert from "@mui/material/Alert";
import Container from "@mui/material/Container";
import type { ReactNode } from "react";
import { BaseGalleryShell } from "@/features/fame-market/components/BaseGalleryShell";
import { createBaseGalleryRuntime } from "@/features/fame-market/config/baseGallery";
import { parseBaseGalleryContracts } from "@/features/fame-market/contracts";
import {
  baseFameCheckoutAddress,
  baseUniversalMarketplaceAddress,
} from "@/features/fame/contract";
import { fameForkModeEnabled } from "@/viem/baseRpcUrls";

export default function Layout({ children }: { children: ReactNode }) {
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
      {children}
    </BaseGalleryShell>
  );
}
