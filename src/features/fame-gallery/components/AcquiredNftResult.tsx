"use client";

import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useRef, useState } from "react";
import { formatTestAmount } from "../format";
import type { GalleryMetadataResult } from "../metadata/testMetadata";
import type { GalleryVerifiedAcquisition } from "../types";

export function AcquiredNftResult({
  result,
  metadata,
  tokenSymbol = "TEST",
  explorerBaseUrl = "https://sepolia.basescan.org",
}: {
  result: GalleryVerifiedAcquisition;
  metadata: GalleryMetadataResult;
  tokenSymbol?: string;
  explorerBaseUrl?: string;
}) {
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const [imageAttempt, setImageAttempt] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const ready = metadata.status === "ready";
  const name = ready && metadata.name ? metadata.name : "Acquired artwork";

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <Card variant="outlined">
      {!imageFailed ? (
        <CardMedia
          key={imageAttempt}
          component="img"
          image={metadata.image}
          alt={ready ? `${name} artwork` : "Acquired artwork unavailable"}
          onError={() => setImageFailed(true)}
          sx={{ aspectRatio: "1 / 1", objectFit: "cover", bgcolor: "grey.900" }}
        />
      ) : null}
      <CardContent>
        <Stack spacing={1.5}>
          <div>
            <Typography
              ref={headingRef}
              tabIndex={-1}
              component="h2"
              variant="h5"
            >
              You got {name}
            </Typography>
          </div>
          {!ready || imageFailed ? (
            <Stack spacing={1} alignItems="flex-start">
              <Typography color="text.secondary">
                The artwork image could not be shown. Your verified purchase
                details are still available.
              </Typography>
              <Button
                type="button"
                variant="outlined"
                onClick={() => {
                  setImageFailed(false);
                  setImageAttempt((attempt) => attempt + 1);
                }}
                sx={{ minHeight: 44 }}
              >
                Retry image
              </Button>
            </Stack>
          ) : null}
          <Divider />
          <Typography variant="body2">Recipient: {result.recipient}</Typography>
          <Typography variant="body2">
            NFT unit: {formatTestAmount(result.unit)} {tokenSymbol}
          </Typography>
          <Typography variant="body2">
            Premium: {formatTestAmount(result.premium)} {tokenSymbol}
          </Typography>
          <Typography fontWeight={700}>
            Paid: {formatTestAmount(result.total)} {tokenSymbol}
          </Typography>
          <Link
            href={`${explorerBaseUrl}/tx/${result.transactionHash}`}
            target="_blank"
            rel="noreferrer"
          >
            View purchase transaction
          </Link>
        </Stack>
      </CardContent>
    </Card>
  );
}
