"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ConnectKitButton } from "connectkit";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { LinkButton } from "@/components/LinkButton";
import { formatTestAmount } from "../format";
import { useGalleryGlobalState } from "../hooks/useGalleryGlobalState";
import { useGalleryLiquidityAction } from "../hooks/useGalleryLiquidityAction";
import {
  useGalleryLiquidityInventory,
  useGalleryLiquidityPosition,
} from "../hooks/useGalleryLiquidityReads";
import type { GalleryLiquidityToken } from "../liquidity/reads";
import type {
  GalleryLiquidityProviderViewState,
  GalleryLiquidityTokenListState,
} from "../liquidity/viewState";
import { GALLERY_VISIBLE_TOKEN_BATCH_LIMIT } from "../queryKeys";
import { isGalleryLiquidityActionTerminal } from "../transactions/liquidityAction";
import { GalleryLiquidityTokenCard } from "./GalleryLiquidityTokenCard";
import { GalleryLiquidityTransactionModal } from "./GalleryLiquidityTransactionModal";

const EMPTY_LIQUIDITY_TOKENS: readonly GalleryLiquidityToken[] = [];

export function GalleryStakeUnstakeContent({
  state,
  provider,
  selectedTokenId,
  premium,
  fameAllowance,
  fameAllowanceLoading = false,
  busy,
  walletControl,
  onSelect,
  onRandomWithdrawal,
  onApproveSelectedWithdrawal,
  onSelectedWithdrawal,
  onRetry,
  onRetryPosition,
  onRetryGlobal,
  renderToken,
}: {
  state: GalleryLiquidityTokenListState;
  provider: GalleryLiquidityProviderViewState;
  selectedTokenId: bigint | null;
  premium: bigint | null;
  fameAllowance: bigint;
  fameAllowanceLoading?: boolean;
  busy: boolean;
  walletControl?: ReactNode;
  onSelect: (tokenId: bigint) => void;
  onRandomWithdrawal: () => void;
  onApproveSelectedWithdrawal: () => void;
  onSelectedWithdrawal: () => void;
  onRetry?: () => void;
  onRetryPosition?: () => void;
  onRetryGlobal?: () => void;
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
  const isProvider = provider.status === "ready" && provider.unitCount > 0n;
  const allowanceReady = premium !== null && fameAllowance >= premium;
  const inventoryCount = state.status === "ready" ? state.tokens.length : 0;

  return (
    <Stack spacing={3}>
      <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack spacing={2}>
          <div>
            <Typography component="h2" variant="h5">
              Provider exits
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Exits remain available while marketplace purchase checkout is
              paused.
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
              Loading this wallet’s provider position…
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
            <Stack spacing={1.5} alignItems="flex-start">
              <Typography>
                You have {provider.unitCount.toString()} credited provider{" "}
                {provider.unitCount === 1n ? "unit" : "units"}.
              </Typography>
              <Button
                variant="contained"
                disabled={busy || inventoryCount === 0}
                onClick={onRandomWithdrawal}
                sx={{ minHeight: 48 }}
              >
                Receive one pseudorandom Society
              </Button>
              <Typography color="text.secondary" variant="body2">
                This free exit removes one credited unit and returns a
                pseudorandom Society currently owned by the pool, with no FAME
                cost.
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={1.5} alignItems="flex-start">
              <Typography color="text.secondary">
                This wallet has no credited provider position. The live
                inventory below remains public and read-only.
              </Typography>
              <LinkButton
                href="/fame/market/stake/deposit"
                variant="contained"
              >
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
          Providers may select one card for a premium-paid exit.
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          sx={{ alignSelf: "flex-start" }}
        >
          Show more pool Society NFTs
        </Button>
      ) : null}

      {isProvider && selectedTokenId !== null ? (
        <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 } }}>
          <Stack spacing={2} alignItems="flex-start">
            {premium === null ? (
              <Alert
                severity="error"
                action={
                  onRetryGlobal ? (
                    <Button color="inherit" onClick={onRetryGlobal}>
                      Try again
                    </Button>
                  ) : undefined
                }
              >
                The live FAME premium is unavailable. Refresh current state
                before confirming a selected exit.
              </Alert>
            ) : null}
            <div>
              <Typography component="h2" variant="h5">
                Selected Society #{selectedTokenId.toString()}
              </Typography>
              <Typography sx={{ mt: 1 }}>
                {premium === null
                  ? "The selected exit price is loading."
                  : `This selected exit pays ${formatTestAmount(premium)} FAME directly.`}{" "}
                Your exiting unit is removed before provider-fee distribution,
                so there is no self-rebate.
              </Typography>
            </div>
            <Typography color="text.secondary" variant="body2">
              The live premium is submitted as your maximum. If it rises before
              execution, the transaction reverts instead of charging more.
            </Typography>
            {premium === null ? null : !allowanceReady ? (
              <Button
                variant="contained"
                disabled={busy || fameAllowanceLoading}
                onClick={onApproveSelectedWithdrawal}
                sx={{ minHeight: 48 }}
              >
                Approve {formatTestAmount(premium)} FAME
              </Button>
            ) : (
              <Button
                variant="contained"
                disabled={busy}
                onClick={onSelectedWithdrawal}
                sx={{ minHeight: 48 }}
              >
                Confirm selected exit
              </Button>
            )}
          </Stack>
        </Paper>
      ) : null}
    </Stack>
  );
}

export function GalleryStakeUnstakeView() {
  const global = useGalleryGlobalState();
  const position = useGalleryLiquidityPosition(global.blockNumber);
  const inventory = useGalleryLiquidityInventory(global.blockNumber);
  const [selectedTokenId, setSelectedTokenId] = useState<bigint | null>(null);
  const transaction = useGalleryLiquidityAction({
    authorization: "fame",
    refresh: async () => {
      await global.refresh();
    },
  });
  const globalState =
    global.projection.status === "success" ? global.projection.data : null;
  const providerState = useMemo<GalleryLiquidityProviderViewState>(() => {
    if (!position.account) return { status: "disconnected" };
    if (
      position.projection.status === "idle" ||
      position.projection.status === "loading"
    ) {
      return { status: "loading" };
    }
    if (position.projection.status === "failure") {
      return { status: "error", message: position.projection.message };
    }
    return {
      status: "ready",
      unitCount: position.projection.data.unitCount,
    };
  }, [position.account, position.projection]);
  const tokens =
    inventory.projection.status === "success"
      ? inventory.projection.data
      : EMPTY_LIQUIDITY_TOKENS;

  useEffect(() => {
    if (
      selectedTokenId !== null &&
      !tokens.some(({ tokenId }) => tokenId === selectedTokenId)
    ) {
      setSelectedTokenId(null);
    }
  }, [selectedTokenId, tokens]);

  const viewState = useMemo<GalleryLiquidityTokenListState>(() => {
    if (inventory.projection.status === "loading") return { status: "loading" };
    if (inventory.projection.status === "failure")
      return { status: "error", message: inventory.projection.message };
    return inventory.projection.data.length === 0
      ? { status: "empty" }
      : { status: "ready", tokens: inventory.projection.data };
  }, [inventory.projection]);
  const premium = globalState?.premium ?? null;
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
            Exit marketplace liquidity
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 760 }}>
            Browse the live marketplace inventory, receive a free pseudorandom
            Society, or select one current pool Society and pay the live premium
            directly in FAME.
          </Typography>
          <Button
            variant="outlined"
            disabled={global.isRefreshing}
            onClick={() => void global.refresh()}
            sx={{ mt: 2 }}
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
          fameAllowanceLoading={transaction.fameAllowanceLoading}
          busy={transaction.busy}
          walletControl={<ConnectKitButton />}
          onSelect={(tokenId) =>
            setSelectedTokenId((current) =>
              current === tokenId ? null : tokenId,
            )
          }
          onRandomWithdrawal={() =>
            transaction.submit({ kind: "random_withdrawal" })
          }
          onApproveSelectedWithdrawal={() =>
            premium !== null
              ? transaction.submit({
                  kind: "selected_withdrawal_approval",
                  amount: premium,
                })
              : undefined
          }
          onSelectedWithdrawal={() => {
            if (selectedTokenId !== null && premium !== null) {
              transaction.submit({
                kind: "selected_withdrawal",
                tokenId: selectedTokenId,
                maxPremium: premium,
              });
            }
          }}
          onRetry={() => void inventory.refresh()}
          onRetryPosition={() => void position.refresh()}
          onRetryGlobal={() => void global.refresh()}
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
        />
      </Stack>
    </Container>
  );
}
