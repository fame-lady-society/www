"use client";

import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useModal } from "connectkit";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatUnits } from "viem";
import { useConnection } from "wagmi";
import { BASE_SEPOLIA_TEST_GALLERY_CONFIG } from "../config/baseSepoliaTestGallery";
import { useGalleryTokenState } from "../hooks/useGalleryTokenState";
import {
  decodeTestGalleryMetadata,
  type GalleryMetadataResult,
} from "../metadata/testMetadata";

export function formatTestAmount(amount: bigint) {
  const [whole, fraction = ""] = formatUnits(amount, 18).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const trimmedFraction = fraction.replace(/0+$/, "");
  return trimmedFraction ? `${grouped}.${trimmedFraction}` : grouped;
}

export function ListingCardView({
  tokenId,
  unit,
  premium,
  metadata,
  walletConnected,
  onBuy,
}: {
  tokenId: bigint;
  unit: bigint;
  premium: bigint;
  metadata: GalleryMetadataResult;
  walletConnected: boolean;
  onBuy: () => void;
}) {
  const displayName =
    metadata.status === "ready" && metadata.name
      ? metadata.name
      : `Society NFT #${tokenId}`;

  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardMedia
        component="img"
        image={metadata.image}
        alt={
          metadata.status === "ready"
            ? `${displayName} artwork`
            : `Fallback artwork for Society NFT #${tokenId}`
        }
        sx={{ aspectRatio: "1 / 1", objectFit: "cover", bgcolor: "grey.900" }}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack spacing={1.5}>
          <div>
            <Typography component="h2" variant="h5">
              {displayName}
            </Typography>
            <Typography color="text.secondary">
              Token #{tokenId.toString()}
            </Typography>
          </div>
          {metadata.status !== "ready" ? (
            <Typography color="text.secondary" role="status">
              Artwork unavailable. Contract facts remain current.
            </Typography>
          ) : metadata.description ? (
            <Typography color="text.secondary">
              {metadata.description}
            </Typography>
          ) : null}
          <Divider />
          <Stack spacing={0.75}>
            <Stack direction="row" justifyContent="space-between" spacing={2}>
              <Typography color="text.secondary">NFT unit</Typography>
              <Typography>{formatTestAmount(unit)} TEST</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" spacing={2}>
              <Typography color="text.secondary">Premium</Typography>
              <Typography>{formatTestAmount(premium)} TEST</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" spacing={2}>
              <Typography fontWeight={700}>Total</Typography>
              <Typography fontWeight={700}>
                {formatTestAmount(unit + premium)} TEST
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          type="button"
          variant="contained"
          fullWidth
          onClick={onBuy}
          sx={{ minHeight: 48 }}
        >
          {walletConnected ? "Buy with TEST" : "Buy with TEST"}
        </Button>
      </CardActions>
    </Card>
  );
}

function UnavailableListingCard({
  tokenId,
  loading,
}: {
  tokenId: bigint;
  loading: boolean;
}) {
  return (
    <Card variant="outlined" sx={{ minHeight: 260 }}>
      <CardContent>
        <Stack spacing={1}>
          <Typography component="h2" variant="h5">
            Society NFT #{tokenId.toString()}
          </Typography>
          <Typography
            color="text.secondary"
            role={loading ? "status" : "alert"}
            aria-live={loading ? "polite" : "assertive"}
          >
            {loading
              ? "Loading verified listing…"
              : "This listing is no longer available or could not be read."}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

export function ListingCard({
  tokenId,
  unit,
  onBuy,
}: {
  tokenId: bigint;
  unit: bigint;
  onBuy?: (tokenId: bigint) => void;
}) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const account = useConnection();
  const modal = useModal();
  const token = useGalleryTokenState(tokenId, { enabled: visible });

  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { rootMargin: "240px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const activeProjection =
    token.projection.status === "success" &&
    token.projection.data.listing.active &&
    token.projection.data.owner.toLowerCase() ===
      BASE_SEPOLIA_TEST_GALLERY_CONFIG.addresses.gallery.toLowerCase()
      ? token.projection
      : null;
  const metadata = useMemo(
    () =>
      activeProjection
        ? decodeTestGalleryMetadata(activeProjection.data.tokenUri)
        : null,
    [activeProjection],
  );

  const buy = () => {
    if (!account.isConnected) {
      modal.setOpen(true);
      return;
    }
    onBuy?.(tokenId);
  };
  return (
    <div ref={cardRef}>
      {activeProjection && metadata ? (
        <ListingCardView
          tokenId={tokenId}
          unit={unit}
          premium={activeProjection.data.listing.premium}
          metadata={metadata}
          walletConnected={account.isConnected}
          onBuy={buy}
        />
      ) : (
        <UnavailableListingCard
          tokenId={tokenId}
          loading={
            !visible ||
            token.projection.status === "idle" ||
            token.projection.status === "loading"
          }
        />
      )}
    </div>
  );
}
