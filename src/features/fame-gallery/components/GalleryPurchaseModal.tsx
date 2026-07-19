"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { TransactionsModal } from "@/components/TransactionsModal";
import { displaySafeErrorMessage } from "@/features/fame-swap/solver/diagnostics";
import { BASE_SEPOLIA_TEST_GALLERY_CONFIG } from "../config/baseSepoliaTestGallery";
import type { GalleryPurchaseState } from "../transactions/purchaseQueue";

function isReceiptTimeout(cause: unknown) {
  return (
    cause instanceof Error &&
    (cause.name === "WaitForTransactionReceiptTimeoutError" ||
      cause.message.startsWith(
        "Timed out while waiting for transaction with hash",
      ))
  );
}

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
      return "Waiting for two Base Sepolia approval confirmations…";
    case "resolving_fulfillment":
      return "Finding a current route for this artwork…";
    case "simulating_purchase":
      return "Checking the current purchase with the contract…";
    case "awaiting_purchase_wallet":
      return "Confirm the gallery purchase in your wallet.";
    case "confirming_purchase":
      return "Waiting for two Base Sepolia confirmations…";
    case "verifying":
      return "Verifying the artwork delivered by the purchase…";
    case "confirmed_unverified":
      return `Purchase transaction confirmed, but the delivered artwork could not be verified. ${
        state.failure
          ? displaySafeErrorMessage(state.failure.cause)
          : "Refresh the page to check the delivered artwork."
      }`;
    case "refreshing":
      return "Purchase verified. Refreshing the gallery…";
    case "verified":
      return state.refreshFailure
        ? "Purchase verified. Some gallery data could not be refreshed yet."
        : "Purchase verified.";
    case "error":
      if (
        state.failure?.stage === "approval_receipt" &&
        isReceiptTimeout(state.failure.cause)
      ) {
        return "Timed out while waiting for the TEST approval transaction to be confirmed.";
      }
      if (
        state.failure?.stage === "purchase_receipt" &&
        isReceiptTimeout(state.failure.cause)
      ) {
        return "Timed out while waiting for the gallery purchase transaction to be confirmed.";
      }
      return state.failure
        ? displaySafeErrorMessage(state.failure.cause)
        : "The gallery purchase failed.";
  }
}

export function GalleryPurchaseModalContent({
  state,
  transactions,
}: {
  state: GalleryPurchaseState;
  transactions: readonly { kind: string; hash?: `0x${string}` }[];
}) {
  const submittedTransactions = transactions.filter(
    (transaction): transaction is { kind: string; hash: `0x${string}` } =>
      transaction.hash !== undefined,
  );

  return (
    <Stack spacing={2} sx={{ mb: 2 }}>
      <Alert
        severity={
          state.status === "error"
            ? "error"
            : state.status === "confirmed_unverified" || state.refreshFailure
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
      {submittedTransactions.length > 0 ? (
        <Stack spacing={0.75} sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2">Transactions</Typography>
          {submittedTransactions.map((transaction) => (
            <Link
              key={`${transaction.kind}:${transaction.hash}`}
              href={`${BASE_SEPOLIA_TEST_GALLERY_CONFIG.explorerBaseUrl}/tx/${transaction.hash}`}
              target="_blank"
              rel="noreferrer"
              sx={{
                display: "block",
                minWidth: 0,
                maxWidth: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {transaction.kind}: {transaction.hash}
            </Link>
          ))}
        </Stack>
      ) : null}
    </Stack>
  );
}

export function GalleryPurchaseModalActions({
  state,
  onRetry,
  onDone,
}: {
  state: GalleryPurchaseState;
  onRetry: () => void;
  onDone: () => void;
}) {
  const terminal =
    state.status === "verified" ||
    state.status === "confirmed_unverified" ||
    state.status === "error";

  return (
    <Stack spacing={1} sx={{ mt: 2 }}>
      {state.status === "error" && state.terms && !state.purchaseHash ? (
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
  );
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
  const terminal =
    state.status === "verified" ||
    state.status === "confirmed_unverified" ||
    state.status === "error";
  return (
    <TransactionsModal
      open={open}
      onClose={onClose}
      transactions={[...transactions]}
      onTransactionConfirmed={() => undefined}
      title={terminal ? "Purchase transaction" : "Submitting transaction"}
      topContent={
        <GalleryPurchaseModalContent
          state={state}
          transactions={transactions}
        />
      }
      bottomContent={
        <GalleryPurchaseModalActions
          state={state}
          onRetry={onRetry}
          onDone={onDone}
        />
      }
    />
  );
}
