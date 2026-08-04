"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { TransactionsModal } from "@/components/TransactionsModal";
import { displaySafeErrorMessage } from "@/features/fame-swap/solver/diagnostics";
import {
  isGalleryLiquidityActionTerminal,
  type GalleryLiquidityActionState,
} from "../transactions/liquidityAction";

function statusCopy(state: GalleryLiquidityActionState) {
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
      return "Liquidity action confirmed. Current gallery state is updating from a fresh block.";
    case "confirmed_refreshing":
      return "Transaction confirmed, but current gallery state could not be refreshed yet.";
    case "error":
      return state.failure
        ? displaySafeErrorMessage(state.failure.cause)
        : "The liquidity action failed.";
  }
}

export function GalleryLiquidityTransactionModal({
  state,
  open,
  transactions,
  onClose,
  onDone,
}: {
  state: GalleryLiquidityActionState;
  open: boolean;
  transactions: readonly { kind: string; hash?: `0x${string}` }[];
  onClose: () => void;
  onDone: () => void;
}) {
  const terminal = isGalleryLiquidityActionTerminal(state);
  return (
    <TransactionsModal
      open={open}
      onClose={onClose}
      transactions={[...transactions]}
      onTransactionConfirmed={() => undefined}
      title="Marketplace liquidity transaction"
      topContent={
        <Alert
          severity={
            state.status === "error"
              ? "error"
              : state.status.startsWith("confirmed")
                ? "success"
                : "info"
          }
          role={state.status === "error" ? "alert" : "status"}
        >
          {statusCopy(state)}
        </Alert>
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
