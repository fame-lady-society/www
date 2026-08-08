"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { TransactionsModal } from "@/components/TransactionsModal";
import { displaySafeErrorMessage } from "@/features/fame-swap/solver/diagnostics";
import {
  isGalleryLiquidityActionBusy,
  isGalleryLiquidityActionTerminal,
  type GalleryLiquidityActionState,
} from "../transactions/liquidityAction";

export function galleryLiquidityStatusCopy(state: GalleryLiquidityActionState) {
  switch (state.status) {
    case "idle":
      return "Choose a liquidity action.";
    case "switching_chain":
      return "Switching to the gallery network…";
    case "simulating_approval":
      return "Checking the Society NFT staking approval with the contract…";
    case "awaiting_approval_wallet":
      return "Confirm the Society NFT staking approval in your wallet.";
    case "confirming_approval":
      return "Waiting for one network approval confirmation…";
    case "simulating":
      return "Checking the exact liquidity action with the contract…";
    case "awaiting_wallet":
      return "Confirm the liquidity action in your wallet.";
    case "confirming":
      return "Waiting for one network confirmation…";
    case "confirmed":
      return state.call?.kind === "withdrawal_approval"
        ? "Approval confirmed. Review the refreshed premium and allowance before starting the separate withdrawal action."
        : "Liquidity action confirmed and current gallery state refreshed.";
    case "confirmed_refreshing":
      return "Transaction confirmed, but current gallery state could not be refreshed yet.";
    case "error":
      return state.failure
        ? displaySafeErrorMessage(state.failure.cause)
        : "The liquidity action failed.";
  }
}

export function GalleryLiquidityTransactionStatus({
  state,
  onRetryRefresh,
  refreshRetrying = false,
}: {
  state: GalleryLiquidityActionState;
  onRetryRefresh: () => void;
  refreshRetrying?: boolean;
}) {
  return (
    <Stack spacing={2}>
      <Alert
        severity={
          state.status === "error"
            ? "error"
            : state.status.startsWith("confirmed")
              ? "success"
              : "info"
        }
        role={state.status === "error" ? "alert" : "status"}
        aria-live={state.status === "error" ? "assertive" : "polite"}
        aria-atomic="true"
      >
        {galleryLiquidityStatusCopy(state)}
      </Alert>
      {state.status === "confirmed_refreshing" ? (
        <Button
          variant="contained"
          onClick={onRetryRefresh}
          disabled={refreshRetrying}
          sx={{ minHeight: 48 }}
        >
          {refreshRetrying
            ? "Refreshing current state…"
            : "Retry current-state refresh"}
        </Button>
      ) : null}
    </Stack>
  );
}

export function GalleryLiquidityTransactionModal({
  state,
  open,
  transactions,
  onClose,
  onDone,
  onRetryRefresh,
  refreshRetrying,
}: {
  state: GalleryLiquidityActionState;
  open: boolean;
  transactions: readonly { kind: string; hash?: `0x${string}` }[];
  onClose: () => void;
  onDone: () => void;
  onRetryRefresh: () => void;
  refreshRetrying: boolean;
}) {
  const terminal = isGalleryLiquidityActionTerminal(state);
  const locked = isGalleryLiquidityActionBusy(state);
  return (
    <TransactionsModal
      open={open}
      onClose={locked ? () => undefined : onClose}
      transactions={[...transactions]}
      onTransactionConfirmed={() => undefined}
      title="Marketplace liquidity transaction"
      topContent={
        <GalleryLiquidityTransactionStatus
          state={state}
          onRetryRefresh={onRetryRefresh}
          refreshRetrying={refreshRetrying}
        />
      }
      bottomContent={
        terminal ? (
          <Stack sx={{ mt: 2 }}>
            <Button variant="outlined" onClick={onDone} sx={{ minHeight: 44 }}>
              Done
            </Button>
          </Stack>
        ) : null
      }
    />
  );
}
