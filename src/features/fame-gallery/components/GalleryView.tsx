"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { formatUnits, isAddressEqual } from "viem";
import { base } from "viem/chains";
import { useConnection, useSwitchChain } from "wagmi";
import { LinkButton } from "@/components/LinkButton";
import { needsConnectedChainSwitch } from "@/utils/connectedChain";
import { formatTestAmount } from "../format";
import { displaySafeErrorMessage } from "../../fame-swap/solver/diagnostics";
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
import { ArtworkCard } from "./ArtworkCard";
import { AcquiredNftResult } from "./AcquiredNftResult";
import { GalleryPurchaseModal } from "./GalleryPurchaseModal";

export type GalleryViewContentState =
  | { status: "loading" }
  | { status: "failure"; message: string }
  | { status: "incomplete" }
  | { status: "empty" }
  | { status: "ready" };

export type PresentedGalleryArtwork = {
  stableKey: string;
  metadata?: GalleryMetadataResult;
  tokenUri?: string;
};

export function GalleryFundingLink({ chainId }: { chainId: number }) {
  if (chainId !== base.id) return null;

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
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
  const decimals = asset === "USDC" ? 6 : 18;
  const [whole, fraction = ""] = formatUnits(amount, decimals).split(".");
  const trimmed = fraction.replace(/0+$/u, "").slice(0, 8);
  return `${whole}${trimmed ? `.${trimmed}` : ""} ${asset}`;
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
  marketplaceFameCharge,
  quote,
  quoteLoading,
  quoteError,
  locked,
  onPaymentAssetChange,
  onRefreshQuote,
}: {
  paymentAsset: GalleryPaymentAsset;
  checkoutEnabled: boolean;
  marketplaceFameCharge: bigint;
  quote: GalleryCheckoutQuote | null;
  quoteLoading: boolean;
  quoteError: Error | null;
  locked: boolean;
  onPaymentAssetChange: (asset: GalleryPaymentAsset) => void;
  onRefreshQuote: () => void;
}) {
  const quoteExpired = quote ? quote.expiresAt.getTime() <= Date.now() : false;
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

        {paymentAsset === "FAME" ? (
          <Stack spacing={0.75}>
            <QuoteLine
              label="Maximum input funded"
              value={`${formatTestAmount(marketplaceFameCharge)} FAME`}
            />
            <QuoteLine
              label="Marketplace FAME charge"
              value={`${formatTestAmount(marketplaceFameCharge)} FAME`}
            />
          </Stack>
        ) : quoteLoading ? (
          <Alert severity="info">
            Finding a protected {paymentAsset} route…
          </Alert>
        ) : quoteError || !quote || quoteExpired ? (
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                onClick={onRefreshQuote}
                disabled={locked}
              >
                Refresh quote
              </Button>
            }
          >
            {quoteExpired
              ? "This checkout quote expired. Refresh it before buying."
              : (quoteError ? displaySafeErrorMessage(quoteError) : null) ??
                "No protected checkout route is available."}
          </Alert>
        ) : (
          <Stack spacing={0.75}>
            <QuoteLine
              label="Maximum input funded"
              value={formatPaymentAmount(quote.maximumInput, paymentAsset)}
            />
            <QuoteLine
              label="Marketplace FAME charge"
              value={`${formatTestAmount(quote.marketplaceFameCharge)} FAME`}
            />
            <QuoteLine
              label="Estimated input residue"
              value={formatPaymentAmount(
                quote.estimatedInputResidue,
                paymentAsset,
              )}
            />
            <QuoteLine
              label="Protected FAME"
              value={`${formatTestAmount(quote.protectedFame)} FAME`}
            />
            <QuoteLine
              label="Estimated surplus FAME"
              value={`${formatTestAmount(quote.estimatedSurplusFame)} FAME`}
            />
            <Typography color="text.secondary" sx={{ pt: 0.5 }}>
              Excess swap output is returned to your wallet as FAME. The final
              refund depends on liquidity when the transaction executes.
            </Typography>
          </Stack>
        )}
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
      <Paper variant="outlined" sx={{ p: 4 }} role="status" aria-live="polite">
        <Typography component="h2" variant="h5">
          Loading {title}…
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
}: {
  artworks: readonly PresentedGalleryArtwork[];
  totalPrice: bigint;
  purchaseLocked?: boolean;
  activeArtworkKey?: string | null;
  scanning?: boolean;
  onBuy: (stableKey: string) => void;
  onRetry: (stableKey: string) => void;
  tokenSymbol?: string;
}) {
  return (
    <Stack spacing={3}>
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={1}
        >
          <Typography component="h2" variant="h5">
            Every artwork
          </Typography>
          <Typography variant="h5" fontWeight={700}>
            {formatTestAmount(totalPrice)} {tokenSymbol}
          </Typography>
        </Stack>
      </Paper>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {artworks.map((artwork) =>
          artwork.metadata ? (
            <ArtworkCard
              key={artwork.stableKey}
              metadata={artwork.metadata}
              purchaseLocked={purchaseLocked}
              purchaseInProgress={
                purchaseLocked && activeArtworkKey === artwork.stableKey
              }
              onBuy={() => onBuy(artwork.stableKey)}
              onRetry={() => onRetry(artwork.stableKey)}
              tokenSymbol={tokenSymbol}
            />
          ) : (
            <GalleryMetadataArtworkCard
              key={artwork.stableKey}
              tokenUri={artwork.tokenUri ?? ""}
              purchaseLocked={purchaseLocked}
              purchaseInProgress={
                purchaseLocked && activeArtworkKey === artwork.stableKey
              }
              onBuy={() => onBuy(artwork.stableKey)}
              onRetry={() => onRetry(artwork.stableKey)}
              tokenSymbol={tokenSymbol}
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

function AcquiredNftResultWithMetadata({
  result,
  tokenUri,
  tokenSymbol,
  explorerBaseUrl,
}: {
  result: Parameters<typeof AcquiredNftResult>[0]["result"];
  tokenUri: string;
  tokenSymbol: string;
  explorerBaseUrl: string;
}) {
  const metadata = useGalleryMetadata(tokenUri);
  return (
    <AcquiredNftResult
      result={result}
      metadata={metadata.metadata}
      tokenSymbol={tokenSymbol}
      explorerBaseUrl={explorerBaseUrl}
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
  const [paymentAsset, setPaymentAsset] = useState<GalleryPaymentAsset>("FAME");
  useGalleryChainOnPageLoad(config.chainId);
  const connection = useConnection();
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

  const connectedOwner =
    Boolean(connection.address && globalState) &&
    isAddressEqual(connection.address!, globalState!.owner);
  const totalPrice = globalState ? globalState.unit + globalState.premium : 0n;
  const alternativePaymentReady =
    paymentAsset === "FAME" ||
    (checkoutQuote.quote !== null &&
      checkoutQuote.quote.expiresAt.getTime() > Date.now() &&
      !checkoutQuote.isLoading);

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
              {config.labels.title}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 680 }}>
              {config.labels.description}
            </Typography>
          </div>
          {connectedOwner && config.adminHref ? (
            <LinkButton href={config.adminHref} variant="text">
              Open admin
            </LinkButton>
          ) : null}
        </Stack>

        {config.checkout ? null : (
          <GalleryFundingLink chainId={config.chainId} />
        )}

        {globalState ? (
          <GalleryPaymentPanel
            paymentAsset={paymentAsset}
            checkoutEnabled={config.checkout !== null}
            marketplaceFameCharge={totalPrice}
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
            />
          ) : null}
        </GalleryViewContent>

        {purchase.state.acquisition && purchase.selectedTarget ? (
          <AcquiredNftResultWithMetadata
            result={purchase.state.acquisition}
            tokenUri={purchase.selectedTarget.tokenUri ?? ""}
            tokenSymbol={config.token.symbol}
            explorerBaseUrl={config.explorerBaseUrl}
          />
        ) : null}

        {purchase.state.status !== "idle" && !purchase.modalOpen ? (
          <Button
            type="button"
            variant="outlined"
            onClick={() => purchase.setModalOpen(true)}
            sx={{ minHeight: 44, alignSelf: "flex-start" }}
          >
            {purchase.state.status === "verified"
              ? "View purchase"
              : "View purchase transaction"}
          </Button>
        ) : null}

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
