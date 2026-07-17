"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useCallback, type ReactNode } from "react";
import { usePageAttentionRefresh } from "@/features/society-nft-auction/hooks/usePageAttentionRefresh";
import { useGalleryDiscovery } from "../hooks/useGalleryDiscovery";
import { useGalleryGlobalState } from "../hooks/useGalleryGlobalState";
import { ListingCard } from "./ListingCard";

export type GalleryViewContentState =
  | { status: "loading" }
  | { status: "failure"; message: string }
  | { status: "empty" }
  | { status: "ready" }
  | { status: "incomplete" };

export function GalleryViewContent({
  state,
  onRefresh,
  children,
}: {
  state: GalleryViewContentState;
  onRefresh?: () => void;
  children?: ReactNode;
}) {
  if (state.status === "loading") {
    return (
      <Paper variant="outlined" sx={{ p: 4 }} role="status" aria-live="polite">
        <Typography component="h2" variant="h5">
          Loading TEST gallery…
        </Typography>
      </Paper>
    );
  }
  if (state.status === "failure") {
    return (
      <Alert
        severity="error"
        role="alert"
        action={
          onRefresh ? (
            <Button
              type="button"
              color="inherit"
              onClick={onRefresh}
              sx={{ minHeight: 44 }}
            >
              Try again
            </Button>
          ) : undefined
        }
      >
        {state.message}
      </Alert>
    );
  }
  if (state.status === "empty") {
    return (
      <Paper variant="outlined" sx={{ p: 4 }}>
        <Typography component="h2" variant="h5">
          No active TEST listings
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Discovery completed and no gallery-owned token is currently listed.
        </Typography>
      </Paper>
    );
  }

  return (
    <Stack spacing={3}>
      {state.status === "incomplete" ? (
        <Alert
          severity="warning"
          action={
            onRefresh ? (
              <Button
                type="button"
                color="inherit"
                onClick={onRefresh}
                sx={{ minHeight: 44 }}
              >
                Retry catch-up
              </Button>
            ) : undefined
          }
        >
          Discovery is incomplete. Only listings revalidated against current
          contract state are shown.
        </Alert>
      ) : null}
      {children}
    </Stack>
  );
}

export function GalleryView() {
  const global = useGalleryGlobalState();
  const discovery = useGalleryDiscovery();
  const refresh = useCallback(async () => {
    await Promise.all([global.refresh(), discovery.refresh()]);
  }, [discovery, global]);

  usePageAttentionRefresh(refresh);

  let state: GalleryViewContentState;
  let listings: ReactNode = null;
  if (
    global.projection.status === "idle" ||
    global.projection.status === "loading" ||
    discovery.projection.status === "loading"
  ) {
    state = { status: "loading" };
  } else if (global.projection.status === "failure") {
    state = { status: "failure", message: global.projection.message };
  } else if (discovery.projection.status === "failure") {
    state = { status: "failure", message: discovery.projection.message };
  } else if (
    discovery.projection.status === "complete" &&
    discovery.projection.activeTokenIds.length === 0
  ) {
    state = { status: "empty" };
  } else {
    const unit = global.projection.data.unit;
    state = {
      status:
        discovery.projection.status === "discovery_incomplete"
          ? "incomplete"
          : "ready",
    };
    listings =
      discovery.projection.activeTokenIds.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {discovery.projection.activeTokenIds.map((tokenId) => (
            <ListingCard
              key={tokenId.toString()}
              tokenId={tokenId}
              unit={unit}
            />
          ))}
        </div>
      ) : (
        <Typography color="text.secondary">
          No currently verified active listing is available.
        </Typography>
      );
  }

  return (
    <Container
      maxWidth="lg"
      sx={{ px: { xs: 2, sm: 3 }, py: { xs: 4, sm: 6 } }}
    >
      <Stack spacing={{ xs: 3, sm: 4 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "flex-end" }}
          spacing={2}
        >
          <div>
            <Typography component="h1" variant="h3">
              TEST gallery
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 680 }}>
              Buy Society NFTs from the deployed Base Sepolia gallery using
              TEST. Wallet connection is only needed when you buy.
            </Typography>
          </div>
          <Button
            component={Link}
            href="/fame/gallery/test/admin"
            variant="text"
          >
            Open admin
          </Button>
        </Stack>

        <GalleryViewContent
          state={state}
          onRefresh={() => void refresh().catch(() => undefined)}
        >
          {listings}
        </GalleryViewContent>
      </Stack>
    </Container>
  );
}
