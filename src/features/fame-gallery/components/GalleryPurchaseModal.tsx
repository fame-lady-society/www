"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { TransactionsModal } from "@/components/TransactionsModal";
import { displaySafeErrorMessage } from "@/features/fame-swap/solver/diagnostics";
import type { GalleryPurchaseState } from "../transactions/purchaseQueue";

function purchaseStatusCopy(state: GalleryPurchaseState) {
  switch (state.status) {
    case "idle":
      return "Choose an artwork to buy with TEST.";
    case "connecting":
      return "Connect a wallet to continue.";
    case "switching_chain":
      return "Switching to Base Sepolia…";
    case "checking_allowance":
      return "Checking your current TEST allowance…";
    case "simulating_approval":
      return "Checking the exact TEST approval with the contract…";
    case "awaiting_approval_wallet":
      return "Approve the exact TEST amount in your wallet.";
    case "confirming_approval":
      return "Waiting for the TEST approval to become visible…";
    case "resolving_fulfillment":
      return "Finding a current route for this artwork…";
    case "simulating_purchase":
      return "Checking the current purchase with the contract…";
    case "awaiting_purchase_wallet":
      return "Confirm the gallery purchase in your wallet.";
    case "confirming_purchase":
      return "Waiting for one Base Sepolia confirmation…";
    case "verifying":
      return "Verifying the artwork delivered by the purchase…";
    case "refreshing":
      return "Purchase verified. Refreshing the gallery…";
    case "verified":
      return state.refreshFailure
        ? "Purchase verified. Some gallery data could not be refreshed yet."
        : "Purchase verified.";
    case "error":
      return state.failure
        ? displaySafeErrorMessage(state.failure.cause)
        : "The gallery purchase failed.";
  }
}

export function GalleryPurchaseModal({
  state,
  open,
  transactions,
  onClose,
  onRetry,
  onDone,
}: {
  state: GalleryPurchaseState;
  open: boolean;
  transactions: readonly { kind: string; hash?: `0x${string}` }[];
  onClose: () => void;
  onRetry: () => void;
  onDone: () => void;
}) {
  const terminal = state.status === "verified" || state.status === "error";
  return (
    <TransactionsModal
      open={open}
      onClose={onClose}
      transactions={[...transactions]}
      onTransactionConfirmed={() => undefined}
      topContent={
        <Stack spacing={2} sx={{ mb: 2 }}>
          <Alert
            severity={
              state.status === "error"
                ? "error"
                : state.refreshFailure
                  ? "warning"
                  : state.status === "verified"
                    ? "success"
                    : "info"
            }
            role={state.status === "error" ? "alert" : "status"}
            aria-live={state.status === "error" ? "assertive" : "polite"}
          >
            {purchaseStatusCopy(state)}
          </Alert>
          {state.status === "error" && state.terms ? (
            <Button
              type="button"
              variant="contained"
              onClick={onRetry}
              sx={{ minHeight: 44 }}
            >
              Retry purchase
            </Button>
          ) : null}
          {terminal ? (
            <Button
              type="button"
              variant="outlined"
              onClick={onDone}
              sx={{ minHeight: 44 }}
            >
              Done
            </Button>
          ) : null}
        </Stack>
      }
    />
  );
}
