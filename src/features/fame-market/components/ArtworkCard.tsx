"use client";

import Image from "next/image";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
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
      <div
        style={{
          position: "relative",
          aspectRatio: "1 / 1",
          backgroundColor: "#212121",
        }}
      >
        <Image
          src={metadata.image}
          alt={artworkReady ? `${displayName} artwork` : "Artwork unavailable"}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 600px) 50vw, 100vw"
          style={{ objectFit: "cover" }}
        />
      </div>
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack spacing={1}>
          <Typography id={titleId} component="h2" variant="h5">
            {artworkReady ? displayName : "Artwork unavailable"}
          </Typography>
          {!artworkReady ? (
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
