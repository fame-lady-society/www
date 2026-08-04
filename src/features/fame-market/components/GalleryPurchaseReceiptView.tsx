"use client";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import LaunchIcon from "@mui/icons-material/Launch";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { useMemo, useState } from "react";
import type { Address, Hash } from "viem";
import { useReadContract, useTransactionReceipt } from "wagmi";
import { LinkButton } from "@/components/LinkButton";
import { creatorArtistMagicAbi } from "@/wagmi";
import { formatTokenAmount } from "../../fame-swap/solver/format";
import { tokenForAddress } from "../../fame-swap/tokens";
import { useGalleryRuntime } from "../config/galleryRuntime";
import { formatTestAmount } from "../format";
import { useGalleryMetadata } from "../hooks/useGalleryMetadata";
import type { GalleryMetadataResult } from "../metadata/testMetadata";
import {
  projectGalleryPurchaseReceipt,
  type GalleryPurchaseReceiptProjection,
} from "../transactions/projectPurchaseReceipt";

const TRANSACTION_HASH = /^0x[0-9a-fA-F]{64}$/;

function formatFame(amount: bigint) {
  const unit = 10n ** 18n;
  const rounded = ((amount + unit / 2n) / unit) * unit;
  return `${formatTestAmount(rounded)} FAME`;
}

function formatAsset(amount: bigint, address: Address) {
  const token = tokenForAddress(address);
  if (!token) return amount.toLocaleString();
  return formatTokenAmount(
    amount,
    token,
    token.symbol === "USDC" ? 2 : token.symbol === "FAME" ? 0 : 4,
  );
}

function shortAddress(address: Address) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function openSeaTokenUrl(mirror: Address, tokenId: bigint) {
  return `https://opensea.io/assets/base/${mirror}/${tokenId}`;
}

function pathLabel(path: GalleryPurchaseReceiptProjection["path"]) {
  if (path === "held") return "Held artwork delivery";
  if (path === "mint") return "Mint-pool metadata swap";
  return "Burn-pool metadata swap";
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      justifyContent="space-between"
      spacing={0.5}
    >
      <Typography color="text.secondary">{label}</Typography>
      <Typography
        component="div"
        fontWeight={600}
        textAlign={{ xs: "left", sm: "right" }}
        sx={{ minWidth: 0, overflowWrap: "anywhere" }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

function TokenLink({
  mirror,
  tokenId,
  title,
  body,
}: {
  mirror: Address;
  tokenId: bigint;
  title: string;
  body: string;
}) {
  return (
    <Paper
      component={Link}
      href={openSeaTokenUrl(mirror, tokenId)}
      target="_blank"
      rel="noreferrer"
      variant="outlined"
      underline="none"
      sx={{
        display: "block",
        p: 2,
        color: "inherit",
        transition: "border-color 150ms ease, transform 150ms ease",
        "&:hover": {
          borderColor: "primary.main",
          transform: "translateY(-2px)",
        },
        "&:focus-visible": {
          outline: "2px solid",
          outlineColor: "primary.main",
        },
      }}
    >
      <Stack direction="row" justifyContent="space-between" spacing={2}>
        <div>
          <Typography fontWeight={700}>{title}</Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
            {body}
          </Typography>
        </div>
        <LaunchIcon fontSize="small" aria-hidden />
      </Stack>
    </Paper>
  );
}

function SettlementDetails({
  purchase,
}: {
  purchase: GalleryPurchaseReceiptProjection;
}) {
  if (!purchase.checkout || !purchase.route) {
    return (
      <Stack spacing={1.25}>
        <Fact label="Paid directly" value={formatFame(purchase.total)} />
        <Fact label="NFT liquidity" value={formatFame(purchase.unit)} />
        <Fact
          label="Marketplace premium"
          value={formatFame(purchase.premium)}
        />
      </Stack>
    );
  }

  const { checkout, route } = purchase;
  const netInput = checkout.inputAmount - checkout.inputRefund;
  return (
    <Stack spacing={1.25}>
      <Fact
        label="Net input paid"
        value={formatAsset(netInput, checkout.inputAsset)}
      />
      {checkout.inputRefund > 0n ? (
        <Fact
          label="Returned to wallet"
          value={formatAsset(checkout.inputRefund, checkout.inputAsset)}
        />
      ) : null}
      <Divider sx={{ my: 0.5 }} />
      <Fact
        label="Gross FAME from swap"
        value={formatFame(route.grossAmountOut)}
      />
      <Fact label="Router fee" value={formatFame(route.feeAmount)} />
      <Fact label="Net FAME from swap" value={formatFame(route.netAmountOut)} />
      <Fact
        label="Marketplace payment"
        value={formatFame(checkout.marketplaceFameCharge)}
      />
      {checkout.fameRefund > 0n ? (
        <Fact
          label="FAME returned to wallet"
          value={formatFame(checkout.fameRefund)}
        />
      ) : null}
    </Stack>
  );
}

export function GalleryPurchaseReceiptContent({
  purchase,
  metadata,
  mirror,
  explorerBaseUrl,
  forkMode,
}: {
  purchase: GalleryPurchaseReceiptProjection;
  metadata: GalleryMetadataResult;
  mirror: Address;
  explorerBaseUrl: string;
  forkMode: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const name =
    metadata.status === "ready" && metadata.name
      ? metadata.name
      : `FAME Society #${purchase.shellId}`;
  const expectedMetadataIds =
    purchase.sourceId === null ? [] : [purchase.shellId, purchase.sourceId];
  const metadataEventsComplete = expectedMetadataIds.every((tokenId) =>
    purchase.metadataUpdatedTokenIds.includes(tokenId),
  );

  return (
    <Container
      maxWidth="xl"
      sx={{ px: { xs: 2, sm: 3 }, py: { xs: 3, md: 6 } }}
    >
      <Stack spacing={{ xs: 4, md: 6 }}>
        <Stack spacing={1.5}>
          <LinkButton
            href="/fame/market"
            variant="text"
            startIcon={<ArrowBackIcon />}
            sx={{ alignSelf: "flex-start", minHeight: 44 }}
          >
            Back to FAME Marketplace
          </LinkButton>
          <Stack direction="row" alignItems="center" spacing={1}>
            <CheckCircleOutlineIcon color="success" aria-hidden />
            <Typography color="success.light" fontWeight={700}>
              Purchase complete
            </Typography>
          </Stack>
          <Typography
            component="h1"
            variant="h2"
            sx={{ fontSize: { xs: 40, md: 64 } }}
          >
            You got {name}
          </Typography>
          <Typography color="text.secondary" variant="h6">
            Society #{purchase.shellId} is now with{" "}
            {shortAddress(purchase.recipient)}.
          </Typography>
        </Stack>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 3, md: 5 }}
          alignItems="flex-start"
        >
          <div style={{ flex: "1.35 1 0", minWidth: 0, width: "100%" }}>
            <Paper
              variant="outlined"
              sx={{ p: 1, bgcolor: "common.black", overflow: "hidden" }}
            >
              {!imageFailed ? (
                // The renderer supplies an inline data URI. Next Image cannot
                // improve or proxy it, so preserve the exact on-chain artwork.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={metadata.image}
                  alt={`${name} artwork`}
                  onError={() => setImageFailed(true)}
                  style={{
                    display: "block",
                    width: "100%",
                    height: "auto",
                    maxHeight: "76vh",
                    objectFit: "contain",
                  }}
                />
              ) : (
                <div
                  style={{
                    minHeight: 320,
                    display: "grid",
                    placeItems: "center",
                    color: "#aaa",
                  }}
                >
                  Artwork preview unavailable
                </div>
              )}
            </Paper>
          </div>

          <Stack
            spacing={3}
            sx={{ flex: "0.65 1 320px", minWidth: 0, width: "100%" }}
          >
            <div>
              <Chip icon={<SwapHorizIcon />} label={pathLabel(purchase.path)} />
              <Typography component="h2" variant="h5" sx={{ mt: 2 }}>
                Purchase settlement
              </Typography>
            </div>
            <SettlementDetails purchase={purchase} />

            <Stack
              direction={{ xs: "column", sm: "row", md: "column" }}
              spacing={1.5}
            >
              <Button
                component={Link}
                href={`${explorerBaseUrl}/tx/${purchase.transactionHash}`}
                target="_blank"
                rel="noreferrer"
                variant="contained"
                endIcon={<LaunchIcon />}
                sx={{ minHeight: 48 }}
              >
                View transaction
              </Button>
              <Button
                component={Link}
                href={openSeaTokenUrl(mirror, purchase.shellId)}
                target="_blank"
                rel="noreferrer"
                variant="outlined"
                endIcon={<LaunchIcon />}
                sx={{ minHeight: 48 }}
              >
                Open Society #{purchase.shellId} on OpenSea
              </Button>
            </Stack>
          </Stack>
        </Stack>

        <Box component="section" aria-labelledby="metadata-swap-heading">
          <Typography id="metadata-swap-heading" component="h2" variant="h4">
            {purchase.sourceId === null ? "Token delivery" : "Metadata swap"}
          </Typography>
          {purchase.sourceId === null ? (
            <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 760 }}>
              This artwork was already held by the marketplace, so the NFT moved
              directly to you and no metadata swap was needed.
            </Typography>
          ) : (
            <>
              <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 800 }}>
                The selected pool artwork moved onto your Society NFT. The
                metadata previously on your NFT moved back to the pool token.
                Both token records emitted metadata updates in this transaction.
              </Typography>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                sx={{ mt: 3, "& > *": { flex: 1 } }}
              >
                <TokenLink
                  mirror={mirror}
                  tokenId={purchase.shellId}
                  title={`Your token · Society #${purchase.shellId}`}
                  body="Now displays the artwork you purchased."
                />
                <TokenLink
                  mirror={mirror}
                  tokenId={purchase.sourceId}
                  title={`Pool token · Society #${purchase.sourceId}`}
                  body="Received the metadata displaced by your purchase."
                />
              </Stack>
              {!metadataEventsComplete ? (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  The expected ERC-4906 metadata-update events were not all
                  found in this receipt. The purchase succeeded, but marketplace
                  indexing may need investigation.
                </Alert>
              ) : null}
            </>
          )}
        </Box>

        {purchase.sourceId !== null ? (
          <Paper
            component="section"
            variant="outlined"
            sx={{ p: { xs: 2.5, sm: 3 } }}
          >
            <Typography component="h2" variant="h5">
              OpenSea indexing
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 900 }}>
              OpenSea may take a few minutes to show the new artwork on both
              tokens. If either token still looks stale, open it on OpenSea and
              choose “Refresh metadata.”
            </Typography>
            {forkMode ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                This purchase happened on a local Base fork. Basescan and
                OpenSea cannot see fork-only state; their links point to the
                canonical Base chain and will become live for production
                purchases.
              </Alert>
            ) : null}
          </Paper>
        ) : null}

        {metadata.status === "ready" &&
        (metadata.description || metadata.attributes.length > 0) ? (
          <Box component="section" aria-labelledby="artwork-details-heading">
            <Typography
              id="artwork-details-heading"
              component="h2"
              variant="h4"
            >
              Artwork details
            </Typography>
            {metadata.description ? (
              <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 820 }}>
                {metadata.description}
              </Typography>
            ) : null}
            {metadata.attributes.length > 0 ? (
              <Stack
                direction="row"
                useFlexGap
                flexWrap="wrap"
                gap={1}
                sx={{ mt: 2 }}
              >
                {metadata.attributes.map((attribute) => (
                  <Chip
                    key={`${attribute.traitType}:${attribute.value}`}
                    label={`${attribute.traitType}: ${attribute.value}`}
                    variant="outlined"
                  />
                ))}
              </Stack>
            ) : null}
          </Box>
        ) : null}

        <Paper
          component="section"
          variant="outlined"
          sx={{ p: { xs: 2.5, sm: 3 } }}
        >
          <Typography component="h2" variant="h5">
            Transaction record
          </Typography>
          <Stack spacing={1.25} sx={{ mt: 2 }}>
            <Fact label="Transaction hash" value={purchase.transactionHash} />
            <Fact label="Artwork hash" value={purchase.artworkHash} />
            {purchase.checkout ? (
              <Fact
                label="Executed route hash"
                value={purchase.checkout.routeHash}
              />
            ) : null}
            {purchase.route ? (
              <Fact
                label="Router schema"
                value={`Version ${purchase.route.schemaVersion}`}
              />
            ) : null}
            <Fact
              label="Inventory"
              value={`${purchase.inventoryBefore.toLocaleString()} → ${purchase.inventoryAfter.toLocaleString()}`}
            />
          </Stack>
        </Paper>

        <div>
          <LinkButton
            href="/fame/market"
            variant="outlined"
            startIcon={<ArrowBackIcon />}
          >
            Back to FAME Marketplace
          </LinkButton>
        </div>
      </Stack>
    </Container>
  );
}

function ReceiptStatus({
  title,
  body,
  onRetry,
}: {
  title: string;
  body: string;
  onRetry?: () => void;
}) {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 5, md: 10 } }}>
      <Stack spacing={2} alignItems="flex-start">
        <Typography component="h1" variant="h3">
          {title}
        </Typography>
        <Typography color="text.secondary">{body}</Typography>
        {onRetry ? (
          <Button variant="outlined" onClick={onRetry}>
            Try receipt again
          </Button>
        ) : null}
        <Link component={NextLink} href="/fame/market">
          Return to the FAME Marketplace
        </Link>
      </Stack>
    </Container>
  );
}

export function GalleryPurchaseReceiptView({
  transactionHash,
}: {
  transactionHash: string;
}) {
  const runtime = useGalleryRuntime();
  const validHash = TRANSACTION_HASH.test(transactionHash);
  const hash = validHash ? (transactionHash as Hash) : undefined;
  const receipt = useTransactionReceipt({
    chainId: runtime.chainId,
    hash,
    query: { enabled: validHash },
  });
  const projected = useMemo(() => {
    if (!receipt.data) return { purchase: null, error: null };
    try {
      return {
        purchase: projectGalleryPurchaseReceipt(receipt.data, {
          marketplace: runtime.addresses.gallery,
          mirror: runtime.addresses.mirror,
          fame: runtime.addresses.fame,
          checkout: runtime.checkout?.address ?? null,
          router: runtime.checkout?.router ?? null,
        }),
        error: null,
      };
    } catch (cause) {
      return {
        purchase: null,
        error:
          cause instanceof Error
            ? cause
            : new Error("Receipt could not be decoded."),
      };
    }
  }, [receipt.data, runtime]);
  const tokenUri = useReadContract({
    address: runtime.addresses.creatorMagic,
    abi: creatorArtistMagicAbi,
    functionName: "tokenURI",
    args: [projected.purchase?.shellId ?? 1n],
    chainId: runtime.chainId,
    blockNumber: receipt.data?.blockNumber,
    query: { enabled: projected.purchase !== null },
  });
  const metadata = useGalleryMetadata(
    typeof tokenUri.data === "string" ? tokenUri.data : "",
  );

  if (!validHash) {
    return (
      <ReceiptStatus
        title="Invalid purchase link"
        body="This URL does not contain a complete transaction hash."
      />
    );
  }
  if (receipt.isPending) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 10 } }} role="status">
        <Stack spacing={2}>
          <Typography component="h1" variant="h3">
            Loading purchase
          </Typography>
          <Skeleton variant="rounded" height={420} />
        </Stack>
      </Container>
    );
  }
  if (receipt.isError) {
    return (
      <ReceiptStatus
        title="Purchase receipt unavailable"
        body="The configured Base RPC could not load this transaction receipt. Check the hash and RPC, then try again."
        onRetry={() => void receipt.refetch()}
      />
    );
  }
  if (projected.error || !projected.purchase) {
    return (
      <ReceiptStatus
        title="Not a completed FAME purchase"
        body={
          projected.error?.message ??
          "No purchase receipt was found for this transaction."
        }
        onRetry={() => void receipt.refetch()}
      />
    );
  }

  return (
    <GalleryPurchaseReceiptContent
      purchase={projected.purchase}
      metadata={metadata.metadata}
      mirror={runtime.addresses.mirror}
      explorerBaseUrl={runtime.explorerBaseUrl}
      forkMode={runtime.checkout?.mode === "fork"}
    />
  );
}
