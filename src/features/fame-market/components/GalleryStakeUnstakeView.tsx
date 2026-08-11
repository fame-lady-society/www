"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { WalletConnectButton } from "@/components/WalletConnectControl";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePublicClient } from "wagmi";
import { LinkButton } from "@/components/LinkButton";
import { useGalleryRuntime } from "../config/galleryRuntime";
import { formatTestAmountRoundedToUnit } from "../format";
import { useGalleryGlobalState } from "../hooks/useGalleryGlobalState";
import {
  type GalleryLiquidityAllowanceState,
  useGalleryLiquidityAction,
} from "../hooks/useGalleryLiquidityAction";
import {
  useGalleryLiquidityInventory,
  useGalleryLiquidityPosition,
} from "../hooks/useGalleryLiquidityReads";
import {
  readLiquidityInventory,
  readLiquidityProviderPosition,
  type GalleryLiquidityProviderPosition,
  type GalleryLiquidityReadClient,
  type GalleryLiquidityToken,
} from "../liquidity/reads";
import type {
  GalleryLiquidityProviderViewState,
  GalleryLiquidityTokenListState,
} from "../liquidity/viewState";
import { GALLERY_VISIBLE_TOKEN_BATCH_LIMIT } from "../queryKeys";
import { galleryCollectionTokenIds, galleryReadAddresses } from "../reads";
import { isGalleryLiquidityActionTerminal } from "../transactions/liquidityAction";
import { GalleryLiquidityTokenCard } from "./GalleryLiquidityTokenCard";
import { GalleryLiquidityTransactionModal } from "./GalleryLiquidityTransactionModal";

export function GalleryStakeUnstakeContent({
  state,
  provider,
  selectedTokenId,
  premium,
  fameAllowance,
  chainMismatch = false,
  busy,
  selectionInvalidatedMessage,
  walletControl,
  onSelect,
  onApproveWithdrawal,
  onWithdrawal,
  onRetry,
  onRetryPosition,
  onRetryAllowance,
  renderToken,
}: {
  state: GalleryLiquidityTokenListState;
  provider: GalleryLiquidityProviderViewState;
  selectedTokenId: bigint | null;
  premium: bigint | null;
  fameAllowance: GalleryLiquidityAllowanceState;
  chainMismatch?: boolean;
  busy: boolean;
  selectionInvalidatedMessage?: string | null;
  walletControl?: ReactNode;
  onSelect: (tokenId: bigint) => void;
  onApproveWithdrawal: () => void;
  onWithdrawal: () => void;
  onRetry?: () => void;
  onRetryPosition?: () => void;
  onRetryAllowance?: () => void;
  renderToken?: (
    token: GalleryLiquidityToken,
    selected: boolean,
    disabled: boolean,
    onSelect: () => void,
  ) => ReactNode;
}) {
  const [visibleCount, setVisibleCount] = useState(
    GALLERY_VISIBLE_TOKEN_BATCH_LIMIT,
  );
  const invalidationRef = useRef<HTMLParagraphElement>(null);
  const isProvider = provider.status === "ready" && provider.unitCount > 0n;
  const selectedTokenAvailable = Boolean(
    selectedTokenId !== null &&
      state.status === "ready" &&
      state.tokens.some(({ tokenId }) => tokenId === selectedTokenId),
  );
  const selectionActionable =
    isProvider && selectedTokenAvailable && !busy && !chainMismatch;
  const allowanceReady =
    premium !== null &&
    fameAllowance.status === "ready" &&
    fameAllowance.amount >= premium;

  useEffect(() => {
    if (selectionInvalidatedMessage) invalidationRef.current?.focus();
  }, [selectionInvalidatedMessage]);

  return (
    <Stack spacing={3} sx={{ minWidth: 0 }}>
      {selectionInvalidatedMessage ? (
        <Typography
          ref={invalidationRef}
          tabIndex={-1}
          role="status"
          aria-live="polite"
        >
          {selectionInvalidatedMessage}
        </Typography>
      ) : null}

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, minWidth: 0 }}>
        <Stack spacing={2}>
          <div>
            <Typography component="h2" variant="h5">
              Provider withdrawal
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Choose one Society currently held by the marketplace.
            </Typography>
          </div>
          {provider.status === "disconnected" ? (
            <Stack spacing={1.5} alignItems="flex-start">
              <Typography>
                Connect a wallet to check whether it has a credited provider
                position.
              </Typography>
              {walletControl}
            </Stack>
          ) : provider.status === "loading" ? (
            <Typography role="status">
              Loading this wallet’s provider position and withdrawal premium…
            </Typography>
          ) : provider.status === "error" ? (
            <Alert
              severity="error"
              action={
                onRetryPosition ? (
                  <Button color="inherit" onClick={onRetryPosition}>
                    Try again
                  </Button>
                ) : undefined
              }
            >
              {provider.message}
            </Alert>
          ) : isProvider ? (
            <Typography>
              You have {provider.unitCount.toString()} credited provider{" "}
              {provider.unitCount === 1n ? "unit" : "units"}. Select the exact
              Society you want to withdraw below.
            </Typography>
          ) : (
            <Stack spacing={1.5} alignItems="flex-start">
              <Typography color="text.secondary">
                This wallet has no credited provider position. The live
                inventory below remains public and read-only.
              </Typography>
              <LinkButton href="/fame/market/stake/deposit" variant="contained">
                Stake Society NFTs
              </LinkButton>
            </Stack>
          )}
        </Stack>
      </Paper>

      <div>
        <Typography component="h2" variant="h4">
          Current marketplace Society inventory
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Anyone can browse every Society currently owned by the marketplace.
          Active providers can select exactly one.
        </Typography>
      </div>

      {state.status === "loading" || state.status === "disconnected" ? (
        <Paper variant="outlined" sx={{ p: 3 }} role="status">
          Loading current marketplace inventory…
        </Paper>
      ) : state.status === "error" ? (
        <Alert
          severity="error"
          action={
            onRetry ? (
              <Button color="inherit" onClick={onRetry}>
                Try again
              </Button>
            ) : undefined
          }
        >
          {state.message}
        </Alert>
      ) : state.status === "empty" ? (
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography>
            No Society NFTs are currently owned by the marketplace.
          </Typography>
        </Paper>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {state.tokens.slice(0, visibleCount).map((token) => {
            const selected = selectedTokenId === token.tokenId;
            const disabled = busy || !isProvider;
            const select = () => onSelect(token.tokenId);
            return renderToken ? (
              <div key={token.tokenId.toString()}>
                {renderToken(token, selected, disabled, select)}
              </div>
            ) : (
              <GalleryLiquidityTokenCard
                key={token.tokenId.toString()}
                token={token}
                selected={selected}
                selectable={isProvider}
                disabled={disabled}
                onSelect={select}
              />
            );
          })}
        </div>
      )}
      {state.status === "ready" && state.tokens.length > visibleCount ? (
        <Button
          variant="outlined"
          onClick={() =>
            setVisibleCount((current) =>
              Math.min(
                current + GALLERY_VISIBLE_TOKEN_BATCH_LIMIT,
                state.tokens.length,
              ),
            )
          }
          sx={{ alignSelf: "flex-start", minHeight: 44 }}
        >
          Show more marketplace Society NFTs
        </Button>
      ) : null}

      {isProvider && selectedTokenId !== null ? (
        <Paper
          variant="outlined"
          sx={{ p: { xs: 2, sm: 3 }, width: "100%", minWidth: 0 }}
        >
          <Stack spacing={2} alignItems="flex-start" sx={{ minWidth: 0 }}>
            <div>
              <Typography component="h2" variant="h5">
                Selected Society #{selectedTokenId.toString()}
              </Typography>
              <Typography sx={{ mt: 1 }}>
                {premium === null
                  ? "Premium unavailable."
                  : `Premium: ${formatTestAmountRoundedToUnit(premium)} FAME.${
                      premium > 0n ? " Reaches 0 after 24 hours." : ""
                    }`}
              </Typography>
            </div>

            {chainMismatch ? (
              <Alert severity="warning">
                Your wallet is connected to a different network. Switch to the
                marketplace network before approving or withdrawing.
              </Alert>
            ) : !selectedTokenAvailable ? (
              <Alert severity="warning">
                This selection is not actionable until inventory refreshes and
                confirms that the Society is still available.
              </Alert>
            ) : premium === null ? (
              <Alert severity="error">
                The withdrawal premium is unavailable. Retry the provider
                position read before continuing.
              </Alert>
            ) : fameAllowance.status === "loading" ? (
              <Typography role="status">Checking FAME allowance…</Typography>
            ) : fameAllowance.status === "error" ? (
              <Alert
                severity="error"
                action={
                  onRetryAllowance ? (
                    <Button color="inherit" onClick={onRetryAllowance}>
                      Retry allowance
                    </Button>
                  ) : undefined
                }
              >
                {fameAllowance.message}
              </Alert>
            ) : fameAllowance.status !== "ready" ? (
              <Typography role="status">Checking FAME allowance…</Typography>
            ) : !allowanceReady ? (
              <Button
                variant="contained"
                disabled={!selectionActionable}
                onClick={onApproveWithdrawal}
                sx={{ minHeight: 48, width: { xs: "100%", sm: "auto" } }}
              >
                Approve {formatTestAmountRoundedToUnit(premium)} FAME
              </Button>
            ) : (
              <Button
                variant="contained"
                disabled={!selectionActionable}
                onClick={onWithdrawal}
                sx={{ minHeight: 48, width: { xs: "100%", sm: "auto" } }}
              >
                Withdraw Society #{selectedTokenId.toString()}
              </Button>
            )}
          </Stack>
        </Paper>
      ) : null}
    </Stack>
  );
}

export function GalleryStakeUnstakeView() {
  const runtime = useGalleryRuntime();
  const publicClient = usePublicClient({ chainId: runtime.chainId });
  const global = useGalleryGlobalState();
  const position = useGalleryLiquidityPosition(global.blockNumber);
  const inventory = useGalleryLiquidityInventory(global.blockNumber);
  const [selectedTokenId, setSelectedTokenId] = useState<bigint | null>(null);
  const [selectionInvalidatedMessage, setSelectionInvalidatedMessage] =
    useState<string | null>(null);
  const [refreshSnapshot, setRefreshSnapshot] = useState<{
    account: `0x${string}`;
    blockNumber: bigint;
    position: GalleryLiquidityProviderPosition;
    inventory: readonly GalleryLiquidityToken[] | null;
  } | null>(null);
  const accountKey = position.account?.toLowerCase() ?? null;
  const previousAccountKey = useRef(accountKey);
  const collectionTokenIds = useMemo(
    () => galleryCollectionTokenIds(runtime.collection),
    [runtime.collection],
  );
  const transaction = useGalleryLiquidityAction({
    authorization: "fame",
    refresh: async (call) => {
      const latestAccount = position.account;
      const client = publicClient as unknown as
        | GalleryLiquidityReadClient
        | undefined;
      if (!client || !latestAccount) {
        throw new Error("Current provider and inventory state is unavailable.");
      }
      const blockNumber = await client.getBlockNumber();
      const addresses = galleryReadAddresses(runtime.addresses);
      const positionProjection = await readLiquidityProviderPosition(
        client,
        blockNumber,
        latestAccount,
        addresses,
      );
      if (positionProjection.status !== "success") {
        throw new Error(
          positionProjection.status === "failure"
            ? positionProjection.message
            : "Current provider state is unavailable.",
        );
      }

      if (call.kind === "withdrawal_approval") {
        setRefreshSnapshot({
          account: latestAccount,
          blockNumber,
          position: positionProjection.data,
          inventory: null,
        });
        return;
      }

      const inventoryProjection = await readLiquidityInventory(
        client,
        blockNumber,
        collectionTokenIds,
        addresses,
      );
      if (inventoryProjection.status !== "success") {
        throw new Error(
          inventoryProjection.status === "failure"
            ? inventoryProjection.message
            : "Current inventory state is unavailable.",
        );
      }
      setRefreshSnapshot({
        account: latestAccount,
        blockNumber,
        position: positionProjection.data,
        inventory: inventoryProjection.data,
      });
      await global.refresh();
      return call.kind === "withdrawal"
        ? {
            selectedTokenAvailable: inventoryProjection.data.some(
              ({ tokenId }) => tokenId === call.tokenId,
            ),
          }
        : undefined;
    },
  });
  const activeRefreshSnapshot =
    refreshSnapshot &&
    position.account &&
    refreshSnapshot.account.toLowerCase() === position.account.toLowerCase()
      ? refreshSnapshot
      : null;
  const effectivePositionProjection = useMemo(
    () =>
      activeRefreshSnapshot
        ? {
            status: "success" as const,
            blockNumber: activeRefreshSnapshot.blockNumber,
            data: activeRefreshSnapshot.position,
          }
        : position.projection,
    [activeRefreshSnapshot, position.projection],
  );
  const effectiveInventoryProjection = useMemo(
    () =>
      activeRefreshSnapshot?.inventory
        ? {
            status: "success" as const,
            blockNumber: activeRefreshSnapshot.blockNumber,
            data: activeRefreshSnapshot.inventory,
          }
        : inventory.projection,
    [activeRefreshSnapshot, inventory.projection],
  );
  const providerState = useMemo<GalleryLiquidityProviderViewState>(() => {
    if (!position.account) return { status: "disconnected" };
    if (
      effectivePositionProjection.status === "idle" ||
      effectivePositionProjection.status === "loading"
    ) {
      return { status: "loading" };
    }
    if (effectivePositionProjection.status === "failure") {
      return { status: "error", message: effectivePositionProjection.message };
    }
    return {
      status: "ready",
      unitCount: effectivePositionProjection.data.unitCount,
    };
  }, [effectivePositionProjection, position.account]);

  useEffect(() => {
    if (previousAccountKey.current !== accountKey) {
      setRefreshSnapshot(null);
      if (selectedTokenId !== null) {
        setSelectedTokenId(null);
        setSelectionInvalidatedMessage(
          "The selected Society was cleared because the connected account changed.",
        );
      }
    }
    previousAccountKey.current = accountKey;
  }, [accountKey, selectedTokenId]);

  useEffect(() => {
    if (
      selectedTokenId !== null &&
      providerState.status === "ready" &&
      providerState.unitCount === 0n
    ) {
      setSelectedTokenId(null);
      setSelectionInvalidatedMessage(
        "The selected Society was cleared because this wallet no longer has a provider position.",
      );
    }
  }, [providerState, selectedTokenId]);

  useEffect(() => {
    if (
      selectedTokenId !== null &&
      effectiveInventoryProjection.status === "success" &&
      !effectiveInventoryProjection.data.some(
        ({ tokenId }) => tokenId === selectedTokenId,
      )
    ) {
      setSelectedTokenId(null);
      setSelectionInvalidatedMessage(
        "The selected Society is no longer available. Choose another current marketplace Society.",
      );
    }
  }, [effectiveInventoryProjection, selectedTokenId]);

  useEffect(() => {
    if (
      refreshSnapshot &&
      position.projection.status === "success" &&
      position.projection.blockNumber >= refreshSnapshot.blockNumber &&
      (refreshSnapshot.inventory === null ||
        (inventory.projection.status === "success" &&
          inventory.projection.blockNumber >= refreshSnapshot.blockNumber))
    ) {
      setRefreshSnapshot(null);
    }
  }, [inventory.projection, position.projection, refreshSnapshot]);

  const viewState = useMemo<GalleryLiquidityTokenListState>(() => {
    if (effectiveInventoryProjection.status === "loading") {
      return { status: "loading" };
    }
    if (effectiveInventoryProjection.status === "failure") {
      return { status: "error", message: effectiveInventoryProjection.message };
    }
    return effectiveInventoryProjection.data.length === 0
      ? { status: "empty" }
      : { status: "ready", tokens: effectiveInventoryProjection.data };
  }, [effectiveInventoryProjection]);
  const premium =
    effectivePositionProjection.status === "success"
      ? effectivePositionProjection.data.withdrawalPremium
      : null;
  const terminal = isGalleryLiquidityActionTerminal(transaction.state);

  return (
    <Container
      maxWidth="lg"
      sx={{ px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 6 }, minWidth: 0 }}
    >
      <Stack spacing={{ xs: 3, sm: 4 }} sx={{ minWidth: 0 }}>
        <div>
          <LinkButton href="/fame/market/stake" variant="text">
            ← Liquidity overview
          </LinkButton>
          <Typography component="h1" variant="h3" sx={{ mt: 1 }}>
            Withdraw marketplace liquidity
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 760 }}>
            Choose one Society currently held by the marketplace and submit the
            provider-specific withdrawal premium as your consent ceiling.
          </Typography>
          <Button
            variant="outlined"
            disabled={global.isRefreshing || transaction.busy}
            onClick={() => void global.refresh()}
            sx={{ mt: 2, minHeight: 44 }}
          >
            {global.isRefreshing ? "Refreshing…" : "Refresh inventory"}
          </Button>
        </div>
        <GalleryStakeUnstakeContent
          state={viewState}
          provider={providerState}
          selectedTokenId={selectedTokenId}
          premium={premium}
          fameAllowance={transaction.fameAllowance}
          chainMismatch={transaction.chainMismatch}
          busy={transaction.busy}
          selectionInvalidatedMessage={selectionInvalidatedMessage}
          walletControl={<WalletConnectButton />}
          onSelect={(tokenId) => {
            setSelectionInvalidatedMessage(null);
            setSelectedTokenId((current) =>
              current === tokenId ? null : tokenId,
            );
          }}
          onApproveWithdrawal={() => {
            if (premium !== null) {
              void transaction.submit({
                kind: "withdrawal_approval",
                amount: premium,
              });
            }
          }}
          onWithdrawal={() => {
            if (selectedTokenId === null || premium === null) return;
            const frozenTokenId = selectedTokenId;
            const frozenPremium = premium;
            void transaction
              .submit({
                kind: "withdrawal",
                tokenId: frozenTokenId,
                maxPremium: frozenPremium,
              })
              .then((result) => {
                if (
                  result?.status === "failed" &&
                  result.stage === "contention"
                ) {
                  setSelectedTokenId(null);
                  setSelectionInvalidatedMessage(
                    "The selected Society is no longer available. Choose another current marketplace Society.",
                  );
                }
              });
          }}
          onRetry={() => void inventory.refresh()}
          onRetryPosition={() => void position.refresh()}
          onRetryAllowance={() => void transaction.retryFameAllowance()}
        />
        {transaction.state.status !== "idle" && !transaction.modalOpen ? (
          <Button
            variant="outlined"
            onClick={() => transaction.setModalOpen(true)}
            sx={{ alignSelf: "flex-start", minHeight: 44 }}
          >
            View liquidity transaction
          </Button>
        ) : null}
        <GalleryLiquidityTransactionModal
          state={transaction.state}
          open={transaction.modalOpen}
          transactions={transaction.transactions}
          onClose={() => transaction.setModalOpen(false)}
          onDone={() => {
            if (terminal) transaction.reset();
            transaction.setModalOpen(false);
          }}
          onRetryRefresh={() => void transaction.retryRefresh()}
          refreshRetrying={transaction.refreshRetrying}
        />
      </Stack>
    </Container>
  );
}
