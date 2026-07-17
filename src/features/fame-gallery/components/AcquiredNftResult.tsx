"use client";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useRef } from "react";
import { baseSepolia } from "viem/chains";
import { usePageAttentionRefresh } from "@/features/society-nft-auction/hooks/usePageAttentionRefresh";
import { useGalleryTokenState } from "../hooks/useGalleryTokenState";
import {
  decodeTestGalleryMetadata,
  type GalleryMetadataResult,
} from "../metadata/testMetadata";
import type { GalleryAcquiredNft } from "../transactions/purchaseQueue";
import { formatTestAmount } from "./ListingCard";

export function AcquiredNftResultView({
  result,
  metadata,
  latestOwner,
}: {
  result: GalleryAcquiredNft;
  metadata: GalleryMetadataResult;
  latestOwner: string | null;
}) {
  const name =
    metadata.status === "ready" && metadata.name
      ? metadata.name
      : `Society NFT #${result.tokenId}`;
  return (
    <Card variant="outlined">
      <CardMedia
        component="img"
        image={metadata.image}
        alt={
          metadata.status === "ready"
            ? `${name} artwork`
            : `Fallback artwork for acquired Society NFT #${result.tokenId}`
        }
        sx={{ aspectRatio: "1 / 1", objectFit: "cover", bgcolor: "grey.900" }}
      />
      <CardContent>
        <Stack spacing={1.5}>
          <div>
            <Typography component="h2" variant="h5">
              You got {name}
            </Typography>
            <Typography color="text.secondary">
              Token #{result.tokenId.toString()}
            </Typography>
          </div>
          {metadata.status !== "ready" ? (
            <Typography color="text.secondary">
              Artwork unavailable. The receipt-backed acquisition facts remain
              verified.
            </Typography>
          ) : null}
          <Divider />
          <Typography variant="body2">
            Recipient: {result.recipient}
          </Typography>
          <Typography variant="body2">
            Owner at end of receipt block: {result.currentOwner}
          </Typography>
          {latestOwner ? (
            <Typography variant="body2">Current owner: {latestOwner}</Typography>
          ) : null}
          <Typography variant="body2">
            NFT unit: {formatTestAmount(result.unit)} TEST
          </Typography>
          <Typography variant="body2">
            Premium: {formatTestAmount(result.premium)} TEST
          </Typography>
          <Typography fontWeight={700}>
            Paid: {formatTestAmount(result.total)} TEST
          </Typography>
          <Link
            href={`${baseSepolia.blockExplorers.default.url}/tx/${result.transactionHash}`}
            target="_blank"
            rel="noreferrer"
          >
            View verified purchase
          </Link>
        </Stack>
      </CardContent>
    </Card>
  );
}

export function AcquiredNftResult({
  result,
}: {
  result: GalleryAcquiredNft;
}) {
  const headingRef = useRef<HTMLDivElement | null>(null);
  const current = useGalleryTokenState(result.tokenId, { enabled: true });
  usePageAttentionRefresh(current.refresh);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const metadata = decodeTestGalleryMetadata(result.tokenUri ?? "");
  const latestOwner =
    current.projection.status === "success"
      ? current.projection.data.owner
      : null;

  return (
    <div ref={headingRef} tabIndex={-1}>
      <AcquiredNftResultView
        result={result}
        metadata={metadata}
        latestOwner={latestOwner}
      />
    </div>
  );
}
