"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { isAddressEqual } from "viem";
import { baseSepolia } from "viem/chains";
import { useConnection, useSwitchChain } from "wagmi";
import { needsConnectedChainSwitch } from "@/utils/connectedChain";
import { formatTestAmount } from "../format";
import { useGalleryDiscovery } from "../hooks/useGalleryDiscovery";
import { useGalleryGlobalState } from "../hooks/useGalleryGlobalState";
import { useGalleryPoolState } from "../hooks/useGalleryPoolState";
import { useGalleryPurchase } from "../hooks/useGalleryPurchase";
import {
  decodeTestGalleryMetadata,
  type GalleryMetadataResult,
} from "../metadata/testMetadata";
import type { GalleryArtworkTarget } from "../types";
import { ArtworkCard } from "./ArtworkCard";
import { AcquiredNftResult } from "./AcquiredNftResult";
import { GalleryPurchaseModal } from "./GalleryPurchaseModal";

export type GalleryViewContentState =
  | { status: "loading" }
  | { status: "failure"; message: string }
  | { status: "empty" }
  | { status: "ready" };

export type PresentedGalleryArtwork = {
  stableKey: string;
  metadata: GalleryMetadataResult;
};

export function GalleryViewContent({
  state,
  paused = false,
  onRefresh,
  children,
}: {
  state: GalleryViewContentState;
  paused?: boolean;
  onRefresh?: () => void;
  children?: ReactNode;
}) {
  if (state.status === "loading") {
    return (
      <Paper variant="outlined" sx={{ p: 4 }} role="status" aria-live="polite">
        <Typography component="h2" variant="h5">
          Loading TEST gallery…
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
}: {
  artworks: readonly PresentedGalleryArtwork[];
  totalPrice: bigint;
  purchaseLocked?: boolean;
  activeArtworkKey?: string | null;
  scanning?: boolean;
  onBuy: (stableKey: string) => void;
  onRetry: (stableKey: string) => void;
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
            {formatTestAmount(totalPrice)} TEST
          </Typography>
        </Stack>
      </Paper>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {artworks.map((artwork) => (
          <ArtworkCard
            key={artwork.stableKey}
            metadata={artwork.metadata}
            purchaseLocked={purchaseLocked}
            purchaseInProgress={
              purchaseLocked && activeArtworkKey === artwork.stableKey
            }
            onBuy={() => onBuy(artwork.stableKey)}
            onRetry={() => onRetry(artwork.stableKey)}
          />
        ))}
      </div>
      {scanning ? (
        <Typography color="text.secondary" role="status" aria-live="polite">
          Finding more artwork…
        </Typography>
      ) : null}
    </Stack>
  );
});

function useBaseSepoliaOnPageLoad() {
  const connection = useConnection();
  const { mutate: switchChain } = useSwitchChain();
  const shouldSwitch = needsConnectedChainSwitch({
    isConnected: connection.isConnected,
    connectedChainId: connection.chainId,
    targetChainId: baseSepolia.id,
  });

  useEffect(() => {
    if (shouldSwitch) {
      switchChain({ chainId: baseSepolia.id });
    }
  }, [shouldSwitch, switchChain]);
}

export function GalleryView() {
  useBaseSepoliaOnPageLoad();
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
  const purchase = useGalleryPurchase({
    globalState,
    catalog: discovery.catalog,
    heldTargets: discovery.heldTargets,
    refreshGlobal: global.refresh,
    refreshPool: pool.refresh,
    revalidateAffectedTokenIds: discovery.revalidateAffectedTokenIds,
    recoverHeldTokenIds: discovery.recoverHeldTokenIds,
  });
  const revalidateAffectedTokenIds = discovery.revalidateAffectedTokenIds;
  const refreshPool = pool.refresh;
  const buy = purchase.buy;
  const metadataCache = useRef(new Map<string, GalleryMetadataResult>());

  const targetsByKey = useMemo(
    () => new Map(discovery.catalog.map((target) => [target.targetId, target])),
    [discovery.catalog],
  );
  const artworks = useMemo<PresentedGalleryArtwork[]>(
    () => {
      const activeUris = new Set<string>();
      const presented = discovery.catalog.map((target) => {
        const tokenUri = target.tokenUri ?? "";
        activeUris.add(tokenUri);
        let metadata = metadataCache.current.get(tokenUri);
        if (!metadata) {
          metadata = decodeTestGalleryMetadata(tokenUri);
          metadataCache.current.set(tokenUri, metadata);
        }
        return { stableKey: target.targetId, metadata };
      });
      for (const tokenUri of metadataCache.current.keys()) {
        if (!activeUris.has(tokenUri)) metadataCache.current.delete(tokenUri);
      }
      return presented;
    },
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
  } else if (artworks.length === 0) {
    state = { status: "empty" };
  } else {
    state = { status: "ready" };
  }

  const connectedOwner =
    Boolean(connection.address && globalState) &&
    isAddressEqual(connection.address!, globalState!.owner);
  const totalPrice = globalState ? globalState.unit + globalState.premium : 0n;

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
              TEST gallery
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 680 }}>
              Choose an artwork and buy it with TEST. Wallet connection is only
              needed when you buy.
            </Typography>
          </div>
          {connectedOwner ? (
            <Button
              component={NextLink}
              href="/fame/gallery/test/admin"
              variant="text"
            >
              Open admin
            </Button>
          ) : null}
        </Stack>

        <GalleryViewContent
          state={state}
          paused={globalState?.paused}
          onRefresh={() => void refresh()}
        >
          {state.status === "ready" && globalState ? (
            <GalleryArtworkGrid
              artworks={artworks}
              totalPrice={totalPrice}
              purchaseLocked={globalState.paused || purchase.locked}
              activeArtworkKey={purchase.activeArtworkKey}
              scanning={discovery.isScanning}
              onBuy={buyArtwork}
              onRetry={retryArtwork}
            />
          ) : null}
        </GalleryViewContent>

        {purchase.state.acquisition && purchase.selectedTarget ? (
          <AcquiredNftResult
            result={purchase.state.acquisition}
            metadata={decodeTestGalleryMetadata(
              purchase.selectedTarget.tokenUri ?? "",
            )}
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
          onRetry={purchase.retry}
          onDone={() => purchase.setModalOpen(false)}
        />
      </Stack>
    </Container>
  );
}
