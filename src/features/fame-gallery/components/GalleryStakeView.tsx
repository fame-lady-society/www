"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ConnectKitButton } from "connectkit";
import { LinkButton } from "@/components/LinkButton";
import { useGalleryGlobalState } from "../hooks/useGalleryGlobalState";
import { useGalleryLiquidityPosition } from "../hooks/useGalleryLiquidityReads";
import {
  GalleryLiquidityEducationCard,
  GalleryProviderPositionCard,
} from "./GalleryLiquidityOverview";

export function GalleryStakeView() {
  const global = useGalleryGlobalState();
  const position = useGalleryLiquidityPosition(global.blockNumber);
  const globalState =
    global.projection.status === "success" ? global.projection.data : null;

  return (
    <Container
      maxWidth="lg"
      sx={{ px: { xs: 2, sm: 3 }, py: { xs: 4, sm: 6 } }}
    >
      <Stack spacing={{ xs: 3, sm: 4 }}>
        <div>
          <LinkButton href="/fame/gallery" variant="text">
            ← FAME Gallery
          </LinkButton>
          <Typography component="h1" variant="h3" sx={{ mt: 1 }}>
            Marketplace liquidity
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 760 }}>
            Provide whole Society NFTs to the gallery, earn your current share
            of provider premiums per marketplace transaction, and exit through
            the marketplace’s credited position controls.
          </Typography>
          <Button
            variant="outlined"
            disabled={global.isRefreshing}
            onClick={() => void global.refresh()}
            sx={{ mt: 2 }}
          >
            {global.isRefreshing ? "Refreshing…" : "Refresh current state"}
          </Button>
        </div>

        {global.projection.status === "failure" ? (
          <Alert severity="error">{global.projection.message}</Alert>
        ) : null}

        <GalleryLiquidityEducationCard global={globalState} showCta={false} />
        <GalleryProviderPositionCard
          global={globalState}
          position={position.projection}
          walletControl={<ConnectKitButton />}
        />
      </Stack>
    </Container>
  );
}
