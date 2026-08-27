"use client";

import Image from "next/image";
import Button from "@mui/material/Button";
import CardActionArea from "@mui/material/CardActionArea";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { useId } from "react";
import type { FameMetadataResult } from "@/features/fame/metadata";

export function ArtworkCard({
  metadata,
  purchaseLocked,
  purchaseInProgress = false,
  tokenSymbol = "TEST",
  href,
  onBuy,
  onRetry,
}: {
  metadata: FameMetadataResult;
  purchaseLocked: boolean;
  purchaseInProgress?: boolean;
  tokenSymbol?: string;
  href: string;
  onBuy: () => void;
  onRetry: () => void;
}) {
  const titleId = useId();
  const artworkReady = metadata.status === "ready";
  const displayName =
    artworkReady && metadata.name ? metadata.name : "Untitled artwork";

  return (
    <Card
      aria-labelledby={titleId}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "transparent",
        overflow: "visible",
      }}
    >
      <CardActionArea
        component={NextLink}
        href={href}
        aria-labelledby={titleId}
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          justifyContent: "flex-start",
          borderRadius: 0,
          "&:focus-visible": {
            outline: "2px solid",
            outlineColor: "primary.main",
            outlineOffset: 4,
          },
          "&:hover .fame-artwork": { transform: "scale(1.015)" },
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "1 / 1",
            backgroundColor: "#16140f",
            overflow: "hidden",
          }}
          className="group ring-1 ring-inset ring-[#c9aa67]/20"
        >
          <Image
            src={metadata.image}
            alt={
              artworkReady ? `${displayName} artwork` : "Artwork unavailable"
            }
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 600px) 50vw, 100vw"
            className="fame-artwork"
            style={{
              objectFit: "cover",
              transition: "transform 260ms ease",
            }}
          />
        </div>
        <CardContent sx={{ width: "100%", flexGrow: 1, px: 0, pt: 2, pb: 1 }}>
          <Stack spacing={1}>
            <Typography id={titleId} component="h2" variant="h6">
              {artworkReady ? displayName : "Artwork unavailable"}
            </Typography>
            {!artworkReady ? (
              <Typography color="text.secondary" role="status">
                This artwork could not be loaded.
              </Typography>
            ) : null}
          </Stack>
        </CardContent>
      </CardActionArea>
      <CardActions sx={{ p: 0, pt: 1 }}>
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
