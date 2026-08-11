"use client";

import Alert from "@mui/material/Alert";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import { LinkButton } from "@/components/LinkButton";
import { baseLegacyUniversalMarketplaceAddress } from "@/features/fame/contract";
import { useGalleryGlobalState } from "../hooks/useGalleryGlobalState";
import { useGalleryLiquidityPosition } from "../hooks/useGalleryLiquidityReads";
import { hasLegacyPosition } from "../liquidity/legacyPosition";
import { GalleryStakeUnstakeView } from "./GalleryStakeUnstakeView";

export function LegacyPositionRecoveryLink({
  blockNumber,
}: {
  blockNumber: bigint | null;
}) {
  const position = useGalleryLiquidityPosition(
    blockNumber,
    baseLegacyUniversalMarketplaceAddress,
  );
  if (!hasLegacyPosition(position.projection)) return null;

  return (
    <Alert
      severity="info"
      action={
        <LinkButton href="/fame/market/stake/legacy" variant="outlined">
          Withdraw
        </LinkButton>
      }
    >
      This wallet has a provider position in the retired marketplace.
    </Alert>
  );
}

export function LegacyPositionRecoveryGate() {
  const global = useGalleryGlobalState();
  const position = useGalleryLiquidityPosition(global.blockNumber);
  if (hasLegacyPosition(position.projection)) {
    return <GalleryStakeUnstakeView marketplaceKind="legacy" />;
  }

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, py: 4 }}>
      <Stack alignItems="flex-start">
        <LinkButton href="/fame/market/stake" variant="text">
          ← Active marketplace liquidity
        </LinkButton>
      </Stack>
    </Container>
  );
}
