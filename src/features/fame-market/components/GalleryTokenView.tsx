"use client";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import type {
  FameArtworkRevision,
  FameMetadataResult,
} from "@/features/fame/metadata";
import { useNotifications } from "@/features/notifications/Context";
import { LinkButton } from "@/components/LinkButton";
import { appendGalleryCatalogTargets } from "../catalog/catalogAssembler";
import { useGalleryRuntime } from "../config/galleryRuntime";
import { formatTestAmount } from "../format";
import { useGalleryCheckoutQuote } from "../hooks/useGalleryCheckoutQuote";
import { useGalleryDiscovery } from "../hooks/useGalleryDiscovery";
import { useGalleryGlobalState } from "../hooks/useGalleryGlobalState";
import { useGalleryMetadata } from "../hooks/useGalleryMetadata";
import { useGalleryPurchase } from "../hooks/useGalleryPurchase";
import { useGalleryPurchaseReceiptRedirect } from "../hooks/useGalleryPurchaseReceiptRedirect";
import { useGalleryTokenAvailability } from "../hooks/useGalleryTokenAvailability";
import type {
  GalleryArtworkTarget,
  GalleryCheckoutQuote,
  GalleryHookProjection,
  GalleryPaymentAsset,
  GalleryTokenAvailability,
} from "../types";
import { fameMarketTokenFallbackName } from "../tokenRoute";
import { GalleryPaymentPanel, useGalleryChainOnPageLoad } from "./GalleryView";
import { GalleryPurchaseDisclosureModal } from "./GalleryPurchaseDisclosureModal";
import { GalleryPurchaseModal } from "./GalleryPurchaseModal";

export type GalleryTokenDetailState =
  | { status: "loading" }
  | { status: "failure"; message: string }
  | { status: "unlisted" }
  | { status: "listed"; target: GalleryArtworkTarget };

export function galleryTokenDetailState(
  projection: GalleryHookProjection<GalleryTokenAvailability>,
): GalleryTokenDetailState {
  if (projection.status === "failure") {
    return { status: "failure", message: projection.message };
  }
  if (projection.status !== "success") return { status: "loading" };
  return projection.data.target
    ? { status: "listed", target: projection.data.target }
    : { status: "unlisted" };
}

function AvailabilityPanel({
  state,
  onRetry,
  children,
}: {
  state: GalleryTokenDetailState;
  onRetry: () => void;
  children?: ReactNode;
}) {
  if (state.status === "loading") {
    return (
      <Paper variant="outlined" sx={{ p: 3 }} role="status" aria-live="polite">
        <Typography component="h2" variant="h6">
          Checking marketplace availability…
        </Typography>
        <Box
          component="div"
          className="fame-skeleton"
          sx={{ mt: 2, width: "72%", height: 12, borderRadius: 0.5 }}
        />
      </Paper>
    );
  }

  if (state.status === "failure") {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" onClick={onRetry}>
            Try again
          </Button>
        }
      >
        Marketplace availability could not be confirmed. No purchase will be
        offered until current Base state is available.
      </Alert>
    );
  }

  if (state.status === "unlisted") {
    return (
      <Paper component="section" variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={1.25}>
          <Chip
            label="Not currently for sale"
            variant="outlined"
            sx={{ alignSelf: "flex-start" }}
          />
          <Typography component="h2" variant="h5">
            This token is not in the marketplace
          </Typography>
          <Typography color="text.secondary">
            This permanent page will stay available if the token is listed again
            later.
          </Typography>
        </Stack>
      </Paper>
    );
  }

  return <>{children}</>;
}

export function GalleryTokenPurchasePanel({
  state,
  totalPrice,
  tokenSymbol,
  paymentAsset,
  checkoutEnabled,
  quote,
  quoteLoading,
  quoteError,
  paused,
  purchaseLocked,
  purchaseInProgress,
  artworkReady,
  onPaymentAssetChange,
  onRefreshQuote,
  onBuy,
  onRetryAvailability,
  onRetryArtwork,
}: {
  state: GalleryTokenDetailState;
  totalPrice: bigint | null;
  tokenSymbol: string;
  paymentAsset: GalleryPaymentAsset;
  checkoutEnabled: boolean;
  quote: GalleryCheckoutQuote | null;
  quoteLoading: boolean;
  quoteError: Error | null;
  paused: boolean;
  purchaseLocked: boolean;
  purchaseInProgress: boolean;
  artworkReady: boolean;
  onPaymentAssetChange: (asset: GalleryPaymentAsset) => void;
  onRefreshQuote: () => void;
  onBuy: () => void;
  onRetryAvailability: () => void;
  onRetryArtwork: () => void;
}) {
  return (
    <AvailabilityPanel state={state} onRetry={onRetryAvailability}>
      {state.status === "listed" ? (
        <Stack spacing={2.5}>
          {paused ? (
            <Alert severity="warning">
              Purchases are temporarily paused. You can still view and share
              this token.
            </Alert>
          ) : null}
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="baseline"
              spacing={2}
            >
              <div>
                <Typography color="text.secondary" variant="body2">
                  Marketplace price
                </Typography>
                <Typography component="h2" variant="h5" sx={{ mt: 0.5 }}>
                  Available now
                </Typography>
              </div>
              <Typography
                variant="h5"
                fontFamily="monospace"
                fontWeight={600}
                textAlign="right"
              >
                {totalPrice === null
                  ? "Loading…"
                  : `${formatTestAmount(totalPrice)} ${tokenSymbol}`}
              </Typography>
            </Stack>
          </Paper>
          {totalPrice !== null ? (
            <GalleryPaymentPanel
              paymentAsset={paymentAsset}
              checkoutEnabled={checkoutEnabled}
              quote={quote}
              quoteLoading={quoteLoading}
              quoteError={quoteError}
              locked={purchaseLocked}
              onPaymentAssetChange={onPaymentAssetChange}
              onRefreshQuote={onRefreshQuote}
            />
          ) : null}
          {!artworkReady ? (
            <Alert
              severity="warning"
              action={
                <Button color="inherit" onClick={onRetryArtwork}>
                  Retry artwork
                </Button>
              }
            >
              The artwork preview could not be confirmed, so purchasing is
              disabled.
            </Alert>
          ) : null}
          <Button
            type="button"
            variant="contained"
            size="large"
            fullWidth
            disabled={purchaseLocked || !artworkReady || totalPrice === null}
            onClick={onBuy}
            sx={{ minHeight: 54 }}
          >
            {purchaseInProgress
              ? "Purchase in progress…"
              : `Buy with ${paymentAsset}`}
          </Button>
        </Stack>
      ) : null}
    </AvailabilityPanel>
  );
}

export function GalleryTokenDetailContent({
  metadata,
  onRetryArtwork,
  onShare,
  purchasePanel,
}: {
  metadata: FameMetadataResult;
  onRetryArtwork: () => void;
  onShare: () => void;
  purchasePanel: ReactNode;
}) {
  const artworkReady = metadata.status === "ready";
  const name =
    artworkReady && metadata.name
      ? metadata.name
      : fameMarketTokenFallbackName();

  return (
    <Container
      maxWidth="xl"
      sx={{ px: { xs: 2, sm: 4 }, py: { xs: 3, sm: 6, lg: 8 } }}
    >
      <Stack spacing={{ xs: 3, md: 5 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          spacing={2}
        >
          <LinkButton
            href="/fame/market"
            variant="text"
            startIcon={<ArrowBackIcon />}
          >
            Back to FAME Marketplace
          </LinkButton>
          <Button
            type="button"
            variant="outlined"
            startIcon={<ShareOutlinedIcon />}
            onClick={onShare}
          >
            Share
          </Button>
        </Stack>

        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={{ xs: 4, lg: 7 }}
          alignItems="flex-start"
        >
          <Stack spacing={2} sx={{ flex: "1.25 1 0", width: "100%" }}>
            <Paper
              variant="outlined"
              sx={{
                position: "relative",
                width: "100%",
                aspectRatio: "1 / 1",
                overflow: "hidden",
                bgcolor: "#11100d",
              }}
            >
              <Image
                src={metadata.image}
                alt={artworkReady ? `${name} artwork` : "Artwork unavailable"}
                fill
                priority
                sizes="(min-width: 1200px) 58vw, 100vw"
                className="fame-artwork"
                style={{ objectFit: "contain" }}
              />
            </Paper>
            {!artworkReady ? (
              <Alert
                severity="warning"
                action={
                  <Button color="inherit" onClick={onRetryArtwork}>
                    Retry
                  </Button>
                }
              >
                The current artwork metadata could not be loaded.
              </Alert>
            ) : null}
          </Stack>

          <Stack
            spacing={3}
            sx={{ flex: "0.75 1 360px", width: "100%", minWidth: 0 }}
          >
            <Stack spacing={1.5}>
              <Typography variant="overline" color="primary.main">
                FAME / MARKET
              </Typography>
              <Typography
                component="h1"
                variant="h2"
                sx={{ fontSize: { xs: 46, sm: 60, lg: 68 } }}
              >
                {name}
              </Typography>
            </Stack>

            {purchasePanel}

            {artworkReady && metadata.description ? (
              <Typography
                color="text.secondary"
                sx={{ lineHeight: 1.75, whiteSpace: "pre-line" }}
              >
                {metadata.description}
              </Typography>
            ) : null}
          </Stack>
        </Stack>
      </Stack>
    </Container>
  );
}

export function GalleryTokenView({
  tokenId,
  initialRevision,
  initialMetadata,
  canonicalUrl,
}: {
  tokenId: number;
  initialRevision: FameArtworkRevision | null;
  initialMetadata: FameMetadataResult;
  canonicalUrl: string;
}) {
  const config = useGalleryRuntime();
  const router = useRouter();
  const { addNotification } = useNotifications();
  const tokenIdBigInt = BigInt(tokenId);
  const [paymentAsset, setPaymentAsset] = useState<GalleryPaymentAsset>("FAME");
  useGalleryChainOnPageLoad(config.chainId);

  const availability = useGalleryTokenAvailability(tokenIdBigInt);
  const state = galleryTokenDetailState(availability.projection);
  const target = state.status === "listed" ? state.target : null;
  const poolTargets = useMemo(
    () => (target && target.kind !== "held" ? [target] : []),
    [target],
  );
  const discovery = useGalleryDiscovery({
    poolTargets,
    enabled: target !== null,
    scanOnMount: false,
  });
  const catalog = useMemo(
    () =>
      target
        ? appendGalleryCatalogTargets(discovery.catalog, [target])
        : discovery.catalog,
    [discovery.catalog, target],
  );
  const heldTargets = useMemo(
    () =>
      target?.kind === "held"
        ? appendGalleryCatalogTargets(discovery.heldTargets, [target])
        : discovery.heldTargets,
    [discovery.heldTargets, target],
  );

  const global = useGalleryGlobalState({ enabled: target !== null });
  const globalState =
    global.projection.status === "success" ? global.projection.data : null;
  const checkoutQuote = useGalleryCheckoutQuote({
    paymentAsset,
    globalState,
  });
  const purchase = useGalleryPurchase({
    globalState,
    catalog,
    heldTargets,
    refreshGlobal: global.refresh,
    refreshPool: availability.refresh,
    revalidateAffectedTokenIds: discovery.revalidateAffectedTokenIds,
    getPendingInitialHeldTokenIds: discovery.getPendingInitialHeldTokenIds,
    recoverHeldTokenIds: discovery.recoverHeldTokenIds,
    paymentAsset,
    checkoutQuote: checkoutQuote.quote,
  });

  const liveRevision = {
    tokenId: tokenId.toString(),
    tokenUri: target?.tokenUri ?? "",
    artworkHash: target?.artworkHash ?? undefined,
  } satisfies FameArtworkRevision;
  const initialRevisionMatches =
    initialRevision?.tokenUri === liveRevision.tokenUri &&
    initialRevision.artworkHash === liveRevision.artworkHash;
  const liveMetadata = useGalleryMetadata(
    liveRevision,
    initialRevisionMatches ? initialMetadata : undefined,
  );
  const metadata =
    target?.tokenUri && !liveMetadata.isLoading
      ? liveMetadata.metadata
      : initialMetadata;
  const artworkReady = metadata.status === "ready";
  const totalPrice = globalState
    ? globalState.unit + globalState.premium
    : null;
  const alternativePaymentReady =
    paymentAsset === "FAME" ||
    (checkoutQuote.quote !== null &&
      checkoutQuote.quote.expiresAt.getTime() > Date.now() &&
      !checkoutQuote.isLoading);
  const purchaseLocked =
    globalState === null ||
    globalState.paused ||
    purchase.locked ||
    !alternativePaymentReady ||
    target?.artworkHash === null ||
    target?.tokenUri === null;

  useGalleryPurchaseReceiptRedirect(purchase.state);

  const retryAvailability = useCallback(() => {
    void Promise.all([availability.refresh(), global.refresh()]);
  }, [availability, global]);
  const retryArtwork = useCallback(() => {
    if (target?.tokenUri) {
      void liveMetadata.retry();
      return;
    }
    router.refresh();
  }, [liveMetadata, router, target?.tokenUri]);
  const share = useCallback(async () => {
    const name =
      metadata.status === "ready" && metadata.name
      ? metadata.name
        : fameMarketTokenFallbackName();
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${name} | FAME Marketplace`,
          text: `View ${name} in the FAME Marketplace.`,
          url: canonicalUrl,
        });
        return;
      }
      if (!navigator.clipboard) {
        throw new Error("Sharing is not supported by this browser.");
      }
      await navigator.clipboard.writeText(canonicalUrl);
      addNotification({
        id: `fame-market-token-${tokenId}-copied`,
        message: "Token link copied",
        type: "success",
      });
    } catch (cause) {
      if (cause instanceof Error && cause.name === "AbortError") return;
      console.error(`[fame market token:${tokenId}] Sharing failed`, cause);
      addNotification({
        id: `fame-market-token-${tokenId}-share-error`,
        message:
          cause instanceof Error
            ? cause.message
            : "The token link could not be shared.",
        type: "error",
      });
    }
  }, [addNotification, canonicalUrl, metadata, tokenId]);

  let resolvedState = state;
  if (state.status === "listed" && global.projection.status === "failure") {
    resolvedState = {
      status: "failure",
      message: global.projection.message,
    };
  }

  const purchasePanel = (
    <GalleryTokenPurchasePanel
      state={resolvedState}
      totalPrice={totalPrice}
      tokenSymbol={config.token.symbol}
      paymentAsset={paymentAsset}
      checkoutEnabled={config.checkout !== null}
      quote={checkoutQuote.quote}
      quoteLoading={checkoutQuote.isLoading}
      quoteError={checkoutQuote.error}
      paused={globalState?.paused ?? false}
      purchaseLocked={purchaseLocked}
      purchaseInProgress={purchase.locked}
      artworkReady={artworkReady}
      onPaymentAssetChange={setPaymentAsset}
      onRefreshQuote={() => void checkoutQuote.refresh()}
      onBuy={() => {
        if (target) purchase.buy(target);
      }}
      onRetryAvailability={retryAvailability}
      onRetryArtwork={retryArtwork}
    />
  );

  return (
    <>
      <GalleryTokenDetailContent
        metadata={metadata}
        onRetryArtwork={retryArtwork}
        onShare={() => void share()}
        purchasePanel={purchasePanel}
      />
      <GalleryPurchaseModal
        state={purchase.state}
        open={purchase.modalOpen}
        transactions={purchase.transactions}
        onClose={() => purchase.setModalOpen(false)}
        onDone={() => purchase.setModalOpen(false)}
        tokenSymbol={paymentAsset}
        networkName={config.labels.network}
        explorerBaseUrl={config.explorerBaseUrl}
      />
      <GalleryPurchaseDisclosureModal
        open={purchase.disclosureModalOpen}
        onCancel={purchase.cancelDisclosure}
        onUnderstand={purchase.acceptDisclosure}
      />
    </>
  );
}
