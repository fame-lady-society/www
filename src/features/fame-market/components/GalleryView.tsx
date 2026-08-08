"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { base } from "viem/chains";
import { useConnection, useSwitchChain } from "wagmi";
import { LinkButton } from "@/components/LinkButton";
import { needsConnectedChainSwitch } from "@/utils/connectedChain";
import { formatTestAmount } from "../format";
import { displaySafeErrorMessage } from "../../fame-swap/solver/diagnostics";
import { formatTokenAmount } from "../../fame-swap/solver/format";
import { FAME_SWAP_TOKENS } from "../../fame-swap/tokens";
import { useGalleryRuntime } from "../config/galleryRuntime";
import { useGalleryDiscovery } from "../hooks/useGalleryDiscovery";
import { useGalleryCheckoutQuote } from "../hooks/useGalleryCheckoutQuote";
import { useGalleryGlobalState } from "../hooks/useGalleryGlobalState";
import { useGalleryMetadata } from "../hooks/useGalleryMetadata";
import { useGalleryPoolState } from "../hooks/useGalleryPoolState";
import { useGalleryPurchase } from "../hooks/useGalleryPurchase";
import type { GalleryMetadataResult } from "../metadata/testMetadata";
import type {
  GalleryArtworkTarget,
  GalleryCheckoutQuote,
  GalleryPaymentAsset,
} from "../types";
import type { Hash } from "viem";
import type { GalleryPurchaseState } from "../transactions/purchaseQueue";
import { ArtworkCard } from "./ArtworkCard";
import { GalleryPurchaseModal } from "./GalleryPurchaseModal";
import { GalleryLiquidityCta } from "./GalleryLiquidityOverview";
import { SocietyRedemptionAccordion } from "./SocietyRedemptionAccordion";

export type GalleryViewContentState =
  | { status: "loading" }
  | { status: "failure"; message: string }
  | { status: "incomplete" }
  | { status: "empty" }
  | { status: "ready" };

export type PresentedGalleryArtwork = {
  stableKey: string;
  artworkHash?: Hash;
  metadata?: GalleryMetadataResult;
  tokenUri?: string;
};

export function galleryPurchaseReceiptHref(state: GalleryPurchaseState) {
  return state.status === "verified" && state.purchaseHash
    ? `/fame/market/purchase/${state.purchaseHash}`
    : null;
}

export function GalleryFundingLink({ chainId }: { chainId: number }) {
  if (chainId !== base.id) return null;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2.5, sm: 3.5 },
        borderLeftWidth: 3,
        borderLeftColor: "primary.main",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
      >
        <div>
          <Typography component="h2" variant="h6">
            Get FAME
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Buy FAME with ETH, WETH, or USDC on the swap page.
          </Typography>
        </div>
        <LinkButton
          href="/fame/swap"
          variant="outlined"
          sx={{ minHeight: 44, flexShrink: 0 }}
        >
          Open FAME swap
        </LinkButton>
      </Stack>
    </Paper>
  );
}

function formatPaymentAmount(amount: bigint, asset: GalleryPaymentAsset) {
  const token = FAME_SWAP_TOKENS.find(({ symbol }) => symbol === asset);
  if (!token) throw new Error(`Unsupported gallery payment asset: ${asset}`);
  return formatTokenAmount(amount, token, asset === "USDC" ? 2 : 4);
}

function formatFameAmount(amount: bigint) {
  const unit = 10n ** 18n;
  const roundedAmount = ((amount + unit / 2n) / unit) * unit;
  return formatTestAmount(roundedAmount);
}

function QuoteLine({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={2}>
      <Typography color="text.secondary">{label}</Typography>
      <Typography fontWeight={600} textAlign="right">
        {value}
      </Typography>
    </Stack>
  );
}

export function GalleryPaymentPanel({
  paymentAsset,
  checkoutEnabled,
  quote,
  quoteLoading,
  quoteError,
  locked,
  onPaymentAssetChange,
  onRefreshQuote,
}: {
  paymentAsset: GalleryPaymentAsset;
  checkoutEnabled: boolean;
  quote: GalleryCheckoutQuote | null;
  quoteLoading: boolean;
  quoteError: Error | null;
  locked: boolean;
  onPaymentAssetChange: (asset: GalleryPaymentAsset) => void;
  onRefreshQuote: () => void;
}) {
  const quoteExpired = quote ? quote.expiresAt.getTime() <= Date.now() : false;
  let paymentDetails: ReactNode;
  if (paymentAsset === "FAME") {
    paymentDetails = null;
  } else if (quoteLoading) {
    paymentDetails = (
      <Alert severity="info">Finding a protected {paymentAsset} route…</Alert>
    );
  } else if (quoteError || !quote || quoteExpired) {
    let errorMessage = "No protected checkout route is available.";
    if (quoteExpired) {
      errorMessage = "This checkout quote expired. Refresh it before buying.";
    } else if (quoteError) {
      errorMessage = displaySafeErrorMessage(quoteError);
    }
    paymentDetails = (
      <Alert
        severity="error"
        action={
          <Button color="inherit" onClick={onRefreshQuote} disabled={locked}>
            Refresh quote
          </Button>
        }
      >
        {errorMessage}
      </Alert>
    );
  } else {
    paymentDetails = (
      <Stack spacing={0.75}>
        <QuoteLine
          label="Maximum input funded"
          value={formatPaymentAmount(quote.maximumInput, paymentAsset)}
        />
        <QuoteLine
          label="Marketplace FAME charge"
          value={`${formatFameAmount(quote.marketplaceFameCharge)} FAME`}
        />
        <QuoteLine
          label="Estimated surplus FAME"
          value={`${formatFameAmount(quote.estimatedSurplusFame)} FAME`}
        />
        <Typography color="text.secondary" sx={{ pt: 0.5 }}>
          Excess swap output is returned to your wallet as FAME. The final
          refund depends on liquidity when the transaction executes.
        </Typography>
      </Stack>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={1.5}
        >
          <div>
            <Typography component="h2" variant="h6">
              Pay with
            </Typography>
            <Typography color="text.secondary">
              FAME is direct. ETH, USDC, and WETH swap and purchase atomically.
            </Typography>
          </div>
          <Select
            size="small"
            value={paymentAsset}
            disabled={locked}
            onChange={(event) =>
              onPaymentAssetChange(event.target.value as GalleryPaymentAsset)
            }
            sx={{ minWidth: 132 }}
          >
            <MenuItem value="FAME">FAME</MenuItem>
            {checkoutEnabled ? <MenuItem value="ETH">ETH</MenuItem> : null}
            {checkoutEnabled ? <MenuItem value="USDC">USDC</MenuItem> : null}
            {checkoutEnabled ? <MenuItem value="WETH">WETH</MenuItem> : null}
          </Select>
        </Stack>

        {paymentDetails}
      </Stack>
    </Paper>
  );
}

export function GalleryViewContent({
  state,
  paused = false,
  onRefresh,
  children,
  title = "TEST gallery",
}: {
  state: GalleryViewContentState;
  paused?: boolean;
  onRefresh?: () => void;
  children?: ReactNode;
  title?: string;
}) {
  if (state.status === "loading") {
    return (
      <Paper
        variant="outlined"
        sx={{ p: { xs: 3, sm: 4 } }}
        role="status"
        aria-live="polite"
      >
        <Stack spacing={2}>
          <Typography component="h2" variant="h5">
            Loading {title}…
          </Typography>
          <Box
            className="fame-skeleton"
            sx={{ height: 12, width: "64%", borderRadius: 0.5 }}
          />
          <Box
            className="fame-skeleton"
            sx={{ height: 220, width: "100%", borderRadius: 0.5 }}
          />
        </Stack>
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
          No artwork is available right now
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Try again later.
        </Typography>
      </Paper>
    );
  }

  if (state.status === "incomplete") {
    return (
      <Paper variant="outlined" sx={{ p: 4 }} role="status">
        <Typography component="h2" variant="h5">
          Artwork availability could not be confirmed
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Reload this page to try again.
        </Typography>
      </Paper>
    );
  }

  return (
    <Stack spacing={3}>
      {paused ? (
        <Alert severity="warning">
          Purchases are temporarily paused. You can still browse the artwork.
        </Alert>
      ) : null}
      {children}
    </Stack>
  );
}

export const GalleryArtworkGrid = memo(function GalleryArtworkGrid({
  artworks,
  totalPrice,
  purchaseLocked = false,
  activeArtworkKey = null,
  scanning = false,
  onBuy,
  onRetry,
  tokenSymbol = "TEST",
  purchaseTokenSymbol = tokenSymbol,
}: {
  artworks: readonly PresentedGalleryArtwork[];
  totalPrice: bigint;
  purchaseLocked?: boolean;
  activeArtworkKey?: string | null;
  scanning?: boolean;
  onBuy: (stableKey: string) => void;
  onRetry: (stableKey: string) => void;
  tokenSymbol?: string;
  purchaseTokenSymbol?: string;
}) {
  return (
    <Stack spacing={3}>
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          backgroundColor: "primary.main",
          color: "primary.contrastText",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={1}
        >
          <Typography component="h2" variant="h4">
            Every artwork
          </Typography>
          <Typography variant="h5" fontFamily="monospace" fontWeight={600}>
            {formatTestAmount(totalPrice)} {tokenSymbol}
          </Typography>
        </Stack>
      </Paper>
      <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {artworks.map((artwork) =>
          artwork.metadata ? (
            <ArtworkCard
              key={`${artwork.stableKey}:${artwork.artworkHash ?? ""}`}
              metadata={artwork.metadata}
              purchaseLocked={purchaseLocked}
              purchaseInProgress={
                purchaseLocked && activeArtworkKey === artwork.stableKey
              }
              onBuy={() => onBuy(artwork.stableKey)}
              onRetry={() => onRetry(artwork.stableKey)}
              tokenSymbol={purchaseTokenSymbol}
            />
          ) : (
            <GalleryMetadataArtworkCard
              key={`${artwork.stableKey}:${artwork.artworkHash ?? ""}`}
              tokenUri={artwork.tokenUri ?? ""}
              purchaseLocked={purchaseLocked}
              purchaseInProgress={
                purchaseLocked && activeArtworkKey === artwork.stableKey
              }
              onBuy={() => onBuy(artwork.stableKey)}
              onRetry={() => onRetry(artwork.stableKey)}
              tokenSymbol={purchaseTokenSymbol}
            />
          ),
        )}
      </div>
      {scanning ? (
        <Typography color="text.secondary" role="status" aria-live="polite">
          Finding more artwork…
        </Typography>
      ) : null}
    </Stack>
  );
});

function GalleryMetadataArtworkCard({
  tokenUri,
  purchaseLocked,
  purchaseInProgress,
  tokenSymbol,
  onBuy,
  onRetry,
}: {
  tokenUri: string;
  purchaseLocked: boolean;
  purchaseInProgress: boolean;
  tokenSymbol: string;
  onBuy: () => void;
  onRetry: () => void;
}) {
  const query = useGalleryMetadata(tokenUri);
  if (query.isLoading) {
    return (
      <Paper variant="outlined" sx={{ p: 3 }} role="status">
        <Typography>Loading artwork…</Typography>
      </Paper>
    );
  }

  return (
    <ArtworkCard
      metadata={query.metadata}
      purchaseLocked={purchaseLocked}
      purchaseInProgress={purchaseInProgress}
      tokenSymbol={tokenSymbol}
      onBuy={onBuy}
      onRetry={() => {
        onRetry();
        void query.retry();
      }}
    />
  );
}

function useGalleryChainOnPageLoad(targetChainId: number) {
  const connection = useConnection();
  const { mutate: switchChain } = useSwitchChain();
  const shouldSwitch = needsConnectedChainSwitch({
    isConnected: connection.isConnected,
    connectedChainId: connection.chainId,
    targetChainId,
  });

  useEffect(() => {
    if (shouldSwitch) {
      switchChain({ chainId: targetChainId });
    }
  }, [shouldSwitch, switchChain, targetChainId]);
}

export function GalleryView() {
  const config = useGalleryRuntime();
  const router = useRouter();
  const openedPurchaseReceipt = useRef<string | null>(null);
  const [paymentAsset, setPaymentAsset] = useState<GalleryPaymentAsset>("FAME");
  useGalleryChainOnPageLoad(config.chainId);
  const global = useGalleryGlobalState();
  const pool = useGalleryPoolState();
  const poolTargets =
    pool.projection.status === "success" ? pool.projection.data.targets : [];
  const discovery = useGalleryDiscovery({ poolTargets });

  const refresh = useCallback(async () => {
    await Promise.all([global.refresh(), pool.refresh()]);
  }, [global, pool]);
  const globalState =
    global.projection.status === "success" ? global.projection.data : null;
  const checkoutQuote = useGalleryCheckoutQuote({
    paymentAsset,
    globalState,
  });
  const purchase = useGalleryPurchase({
    globalState,
    catalog: discovery.catalog,
    heldTargets: discovery.heldTargets,
    refreshGlobal: global.refresh,
    refreshPool: pool.refresh,
    revalidateAffectedTokenIds: discovery.revalidateAffectedTokenIds,
    getPendingInitialHeldTokenIds: discovery.getPendingInitialHeldTokenIds,
    recoverHeldTokenIds: discovery.recoverHeldTokenIds,
    paymentAsset,
    checkoutQuote: checkoutQuote.quote,
  });
  const revalidateAffectedTokenIds = discovery.revalidateAffectedTokenIds;
  const refreshPool = pool.refresh;
  const buy = purchase.buy;
  const targetsByKey = useMemo(
    () => new Map(discovery.catalog.map((target) => [target.targetId, target])),
    [discovery.catalog],
  );
  const artworks = useMemo<PresentedGalleryArtwork[]>(
    () =>
      discovery.catalog.map((target) => ({
        stableKey: target.targetId,
        artworkHash: target.artworkHash ?? undefined,
        tokenUri: target.tokenUri ?? "",
      })),
    [discovery.catalog],
  );

  let state: GalleryViewContentState;
  if (global.projection.status === "failure") {
    state = { status: "failure", message: global.projection.message };
  } else if (pool.projection.status === "failure") {
    state = { status: "failure", message: pool.projection.message };
  } else if (
    global.projection.status === "idle" ||
    global.projection.status === "loading" ||
    pool.projection.status === "idle" ||
    pool.projection.status === "loading" ||
    (artworks.length === 0 && discovery.isScanning)
  ) {
    state = { status: "loading" };
  } else if (artworks.length === 0 && !discovery.scanCompleted) {
    state = { status: "incomplete" };
  } else if (artworks.length === 0) {
    state = { status: "empty" };
  } else {
    state = { status: "ready" };
  }

  const totalPrice = globalState ? globalState.unit + globalState.premium : 0n;
  const alternativePaymentReady =
    paymentAsset === "FAME" ||
    (checkoutQuote.quote !== null &&
      checkoutQuote.quote.expiresAt.getTime() > Date.now() &&
      !checkoutQuote.isLoading);
  const purchaseReceiptHref = galleryPurchaseReceiptHref(purchase.state);

  useEffect(() => {
    if (
      purchaseReceiptHref === null ||
      openedPurchaseReceipt.current === purchaseReceiptHref
    ) {
      return;
    }
    openedPurchaseReceipt.current = purchaseReceiptHref;
    router.push(purchaseReceiptHref);
  }, [purchaseReceiptHref, router]);

  const retryArtwork = useCallback(
    (stableKey: string) => {
      const target = targetsByKey.get(stableKey);
      if (!target) return;
      if (target.kind === "held") {
        void revalidateAffectedTokenIds([target.tokenId]);
        return;
      }
      void refreshPool();
    },
    [refreshPool, revalidateAffectedTokenIds, targetsByKey],
  );

  const buyArtwork = useCallback(
    (stableKey: string) => {
      const target = targetsByKey.get(stableKey);
      if (target) buy(target);
    },
    [buy, targetsByKey],
  );

  return (
    <Container
      maxWidth="xl"
      sx={{ px: { xs: 2, sm: 4 }, py: { xs: 6, sm: 9 } }}
    >
      <Stack spacing={{ xs: 3.5, sm: 5 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "flex-end" }}
          spacing={2}
        >
          <div>
            <Typography variant="overline" color="primary.main">
              FAME / MARKET
            </Typography>
            <Typography
              component="h1"
              variant="h1"
              sx={{ mt: 1.5, fontSize: { xs: "3.6rem", sm: "5.8rem" } }}
            >
              {config.labels.title}
            </Typography>
            <Typography
              color="text.secondary"
              sx={{ mt: 2.5, maxWidth: 680, lineHeight: 1.7 }}
            >
              {config.labels.description}
            </Typography>
          </div>
        </Stack>

        <GalleryLiquidityCta />

        <SocietyRedemptionAccordion />

        {config.checkout ? null : (
          <GalleryFundingLink chainId={config.chainId} />
        )}

        {globalState ? (
          <GalleryPaymentPanel
            paymentAsset={paymentAsset}
            checkoutEnabled={config.checkout !== null}
            quote={checkoutQuote.quote}
            quoteLoading={checkoutQuote.isLoading}
            quoteError={checkoutQuote.error}
            locked={purchase.locked}
            onPaymentAssetChange={setPaymentAsset}
            onRefreshQuote={() => void checkoutQuote.refresh()}
          />
        ) : null}

        <GalleryViewContent
          state={state}
          paused={globalState?.paused}
          onRefresh={() => void refresh()}
          title={config.labels.title}
        >
          {state.status === "ready" && globalState ? (
            <GalleryArtworkGrid
              artworks={artworks}
              totalPrice={totalPrice}
              purchaseLocked={
                globalState.paused ||
                purchase.locked ||
                !alternativePaymentReady
              }
              activeArtworkKey={purchase.activeArtworkKey}
              scanning={discovery.isScanning}
              onBuy={buyArtwork}
              onRetry={retryArtwork}
              tokenSymbol={config.token.symbol}
              purchaseTokenSymbol={paymentAsset}
            />
          ) : null}
        </GalleryViewContent>

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
      </Stack>
    </Container>
  );
}
