"use client";

import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useId } from "react";
import type { GalleryMetadataResult } from "../metadata/testMetadata";

export function ArtworkCard({
  metadata,
  purchaseLocked,
  purchaseInProgress = false,
  tokenSymbol = "TEST",
  onBuy,
  onRetry,
}: {
  metadata: GalleryMetadataResult;
  purchaseLocked: boolean;
  purchaseInProgress?: boolean;
  tokenSymbol?: string;
  onBuy: () => void;
  onRetry: () => void;
}) {
  const titleId = useId();
  const artworkReady = metadata.status === "ready";
  const displayName =
    artworkReady && metadata.name ? metadata.name : "Untitled artwork";

  return (
    <Card
      variant="outlined"
      aria-labelledby={titleId}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardMedia
        component="img"
        image={metadata.image}
        alt={artworkReady ? `${displayName} artwork` : "Artwork unavailable"}
        loading="lazy"
        decoding="async"
        sx={{ aspectRatio: "1 / 1", objectFit: "cover", bgcolor: "grey.900" }}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack spacing={1}>
          <Typography id={titleId} component="h2" variant="h5">
            {artworkReady ? displayName : "Artwork unavailable"}
          </Typography>
          {artworkReady && metadata.description ? (
            <Typography color="text.secondary">
              {metadata.description}
            </Typography>
          ) : !artworkReady ? (
            <Typography color="text.secondary" role="status">
              This artwork could not be loaded.
            </Typography>
          ) : null}
        </Stack>
      </CardContent>
      <CardActions sx={{ p: 2, pt: 0 }}>
        {artworkReady ? (
          <Button
            type="button"
            variant="contained"
            fullWidth
            disabled={purchaseLocked}
            onClick={onBuy}
            sx={{ minHeight: 48 }}
          >
            {purchaseInProgress
              ? "Purchase in progress…"
              : `Buy with ${tokenSymbol}`}
          </Button>
        ) : (
          <Button
            type="button"
            variant="outlined"
            fullWidth
            onClick={onRetry}
            sx={{ minHeight: 48 }}
          >
            Retry
          </Button>
        )}
      </CardActions>
    </Card>
  );
}
