"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { WalletConnectButton } from "@/components/WalletConnectControl";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { LinkButton } from "@/components/LinkButton";
import { formatTestAmount } from "../format";
import { useGalleryGlobalState } from "../hooks/useGalleryGlobalState";
import { useGalleryLiquidityAction } from "../hooks/useGalleryLiquidityAction";
import {
  useGalleryLiquidityPosition,
  useGalleryOwnedSociety,
} from "../hooks/useGalleryLiquidityReads";
import { providerPerSaleShareAfterDeposit } from "../liquidity/position";
import type { GalleryLiquidityToken } from "../liquidity/reads";
import type { GalleryLiquidityTokenListState } from "../liquidity/viewState";
import { GALLERY_VISIBLE_TOKEN_BATCH_LIMIT } from "../queryKeys";
import { isGalleryLiquidityActionTerminal } from "../transactions/liquidityAction";
import type { GalleryGlobalState } from "../types";
import { GalleryLiquidityTokenCard } from "./GalleryLiquidityTokenCard";
import { GalleryLiquidityTransactionModal } from "./GalleryLiquidityTransactionModal";

const EMPTY_LIQUIDITY_TOKENS: readonly GalleryLiquidityToken[] = [];

export function GalleryStakeDepositContent({
  state,
  selectedIds,
  global,
  providerUnitCount,
  operatorApproved,
  busy,
  walletControl,
  onToggle,
  onDeposit,
  onRetry,
  renderToken,
}: {
  state: GalleryLiquidityTokenListState;
  selectedIds: readonly bigint[];
  global: GalleryGlobalState | null;
  providerUnitCount: bigint;
  operatorApproved: boolean;
  busy: boolean;
  walletControl?: ReactNode;
  onToggle: (tokenId: bigint) => void;
  onDeposit: () => void;
  onRetry?: () => void;
  renderToken?: (
    token: GalleryLiquidityToken,
    selected: boolean,
    disabled: boolean,
    onToggle: () => void,
  ) => ReactNode;
}) {
  const [visibleCount, setVisibleCount] = useState(
    GALLERY_VISIBLE_TOKEN_BATCH_LIMIT,
  );
  const selected = new Set(selectedIds);
  const capReached = Boolean(
    global &&
      providerUnitCount === 0n &&
      global.activeProviderCount >= global.activeProviderCap,
  );
  const projectedShare = global
    ? providerPerSaleShareAfterDeposit(
        global.providerFee,
        providerUnitCount,
        global.totalProviderUnits,
        selectedIds.length,
      )
    : null;

  if (state.status === "disconnected") {
    return (
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={2} alignItems="flex-start">
          <Typography component="h2" variant="h5">
            Connect your wallet
          </Typography>
          <Typography color="text.secondary">
            Connect on Base to discover Society NFTs owned by this wallet.
          </Typography>
          {walletControl}
        </Stack>
      </Paper>
    );
  }
  if (state.status === "loading") {
    return (
      <Paper variant="outlined" sx={{ p: 3 }} role="status">
        Loading your Society NFTs…
      </Paper>
    );
  }
  if (state.status === "error") {
    return (
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
    );
  }
  if (state.status === "empty") {
    return (
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography component="h2" variant="h5">
          No Society NFTs found
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          This ownership scan reads the Society mirror directly and does not
          depend on marketplace checkout.
        </Typography>
      </Paper>
    );
  }

  return (
    <Stack spacing={3}>
      {capReached ? (
        <Alert severity="warning">
          The marketplace currently has {global?.activeProviderCap.toString()}{" "}
          active providers. Existing providers can add units, but a new provider
          position cannot open until a slot is free.
        </Alert>
      ) : null}
      <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            spacing={1}
          >
            <div>
              <Typography component="h2" variant="h5">
                Choose Society NFTs
              </Typography>
              <Typography color="text.secondary">
                {selectedIds.length} selected / 8 maximum
              </Typography>
            </div>
            <Typography fontWeight={700}>
              {projectedShare === null || selectedIds.length === 0
                ? "Select a Society to see your current share"
                : `${formatTestAmount(projectedShare)} FAME per marketplace sale`}
            </Typography>
          </Stack>
          <Typography color="text.secondary" variant="body2">
            This is the resulting current per-sale provider share for your
            credited units after the selected batch, using current contract
            state.
          </Typography>
        </Stack>
      </Paper>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {state.tokens.slice(0, visibleCount).map((token) => {
          const isSelected = selected.has(token.tokenId);
          const disabled =
            busy || capReached || (!isSelected && selectedIds.length >= 8);
          const toggle = () => onToggle(token.tokenId);
          return renderToken ? (
            <div key={token.tokenId.toString()}>
              {renderToken(token, isSelected, disabled, toggle)}
            </div>
          ) : (
            <GalleryLiquidityTokenCard
              key={token.tokenId.toString()}
              token={token}
              selected={isSelected}
              selectable
              disabled={disabled}
              onSelect={toggle}
            />
          );
        })}
      </div>
      {state.tokens.length > visibleCount ? (
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
          sx={{ alignSelf: "flex-start" }}
        >
          Show more Society NFTs
        </Button>
      ) : null}

      <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack spacing={2} alignItems="flex-start">
          <Typography>
            Approval uses the normal Society NFT operator permission. The final
            staking action deposits all selected NFTs in one atomic batch—either
            every selected Society is credited or none are.
          </Typography>
          <Typography color="warning.main" fontWeight={700}>
            Do not transfer Society NFTs or FAME directly to the marketplace
            address. Raw transfers are uncredited donations.
          </Typography>
          <Button
            variant="contained"
            disabled={busy || capReached || selectedIds.length === 0}
            onClick={onDeposit}
            sx={{ minHeight: 48 }}
          >
            {operatorApproved ? "Stake" : "Approve and stake"}{" "}
            {selectedIds.length} Society{" "}
            {selectedIds.length === 1 ? "NFT" : "NFTs"}
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}

export function GalleryStakeDepositView() {
  const global = useGalleryGlobalState();
  const position = useGalleryLiquidityPosition(global.blockNumber);
  const ownership = useGalleryOwnedSociety(global.blockNumber);
  const [selectedIds, setSelectedIds] = useState<bigint[]>([]);
  const transaction = useGalleryLiquidityAction({
    authorization: "operator",
    refresh: async () => {
      await global.refresh();
    },
  });
  const globalState =
    global.projection.status === "success" ? global.projection.data : null;
  const providerUnitCount =
    position.projection.status === "success"
      ? position.projection.data.unitCount
      : 0n;
  const tokens =
    ownership.projection.status === "success"
      ? ownership.projection.data
      : EMPTY_LIQUIDITY_TOKENS;

  useEffect(() => {
    const owned = new Set(tokens.map(({ tokenId }) => tokenId));
    setSelectedIds((current) =>
      current.filter((tokenId) => owned.has(tokenId)),
    );
  }, [tokens]);

  const viewState = useMemo<GalleryLiquidityTokenListState>(() => {
    if (!ownership.account) return { status: "disconnected" };
    if (global.projection.status === "failure") {
      return { status: "error", message: global.projection.message };
    }
    if (position.projection.status === "failure") {
      return { status: "error", message: position.projection.message };
    }
    if (ownership.projection.status === "failure") {
      return { status: "error", message: ownership.projection.message };
    }
    if (
      global.projection.status !== "success" ||
      position.projection.status !== "success" ||
      ownership.projection.status === "loading" ||
      ownership.projection.status === "idle"
    )
      return { status: "loading" };
    return ownership.projection.data.length === 0
      ? { status: "empty" }
      : { status: "ready", tokens: ownership.projection.data };
  }, [
    global.projection,
    ownership.account,
    ownership.projection,
    position.projection,
  ]);

  const toggle = (tokenId: bigint) => {
    setSelectedIds((current) => {
      if (current.includes(tokenId))
        return current.filter((value) => value !== tokenId);
      if (current.length >= 8) return current;
      return [...current, tokenId].sort((left, right) =>
        left < right ? -1 : 1,
      );
    });
  };
  const terminal = isGalleryLiquidityActionTerminal(transaction.state);

  return (
    <Container
      maxWidth="lg"
      sx={{ px: { xs: 2, sm: 3 }, py: { xs: 4, sm: 6 } }}
    >
      <Stack spacing={{ xs: 3, sm: 4 }}>
        <div>
          <LinkButton href="/fame/market/stake" variant="text">
            ← Liquidity overview
          </LinkButton>
          <Typography component="h1" variant="h3" sx={{ mt: 1 }}>
            Stake Society NFTs
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 760 }}>
            Select up to eight wallet-owned Society NFTs, approve the
            marketplace operator once, then submit one atomic batch deposit.
          </Typography>
        </div>
        <GalleryStakeDepositContent
          state={viewState}
          selectedIds={selectedIds}
          global={globalState}
          providerUnitCount={providerUnitCount}
          operatorApproved={transaction.operatorApproved}
          busy={transaction.busy}
          walletControl={<WalletConnectButton />}
          onToggle={toggle}
          onDeposit={() =>
            transaction.submit({ kind: "deposit", tokenIds: selectedIds })
          }
          onRetry={() => {
            void Promise.allSettled([
              global.refresh(),
              position.refresh(),
              ownership.refresh(),
            ]);
          }}
        />
        {transaction.state.status !== "idle" && !transaction.modalOpen ? (
          <Button
            variant="outlined"
            onClick={() => transaction.setModalOpen(true)}
            sx={{ alignSelf: "flex-start" }}
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
