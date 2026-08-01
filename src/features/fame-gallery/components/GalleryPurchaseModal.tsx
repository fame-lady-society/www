"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { TransactionsModal } from "@/components/TransactionsModal";
import { displaySafeErrorMessage } from "@/features/fame-swap/solver/diagnostics";
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

function purchaseStatusCopy(
  state: GalleryPurchaseState,
  tokenSymbol: string,
  networkName: string,
) {
  switch (state.status) {
    case "idle":
      return `Choose an artwork to buy with ${tokenSymbol}.`;
    case "connecting":
      return "Connect a wallet to continue.";
    case "switching_chain":
      return `Switching to ${networkName}…`;
    case "checking_allowance":
      return `Checking your current ${tokenSymbol} allowance…`;
    case "simulating_approval":
      return `Checking the exact ${tokenSymbol} approval with the contract…`;
    case "awaiting_approval_wallet":
      return `Approve the exact ${tokenSymbol} amount in your wallet.`;
    case "confirming_approval":
      return `Waiting for ${networkName} approval confirmation…`;
    case "resolving_fulfillment":
      return "Finding a current route for this artwork…";
    case "simulating_purchase":
      return "Checking the current purchase with the contract…";
    case "awaiting_purchase_wallet":
      return "Confirm the gallery purchase in your wallet.";
    case "confirming_purchase":
      return `Waiting for ${networkName} confirmation…`;
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
        return `Timed out while waiting for the ${tokenSymbol} approval transaction to be confirmed.`;
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
  tokenSymbol = "TEST",
  networkName = "Base Sepolia",
  explorerBaseUrl = "https://sepolia.basescan.org",
}: {
  state: GalleryPurchaseState;
  transactions: readonly { kind: string; hash?: `0x${string}` }[];
  tokenSymbol?: string;
  networkName?: string;
  explorerBaseUrl?: string;
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
        {purchaseStatusCopy(state, tokenSymbol, networkName)}
      </Alert>
      {submittedTransactions.length > 0 ? (
        <Stack spacing={0.75} sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2">Transactions</Typography>
          {submittedTransactions.map((transaction) => (
            <Link
              key={`${transaction.kind}:${transaction.hash}`}
              href={`${explorerBaseUrl}/tx/${transaction.hash}`}
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
  onDone,
}: {
  state: GalleryPurchaseState;
  onDone: () => void;
}) {
  const terminal =
    state.status === "verified" ||
    state.status === "confirmed_unverified" ||
    state.status === "error";

  return (
    <Stack spacing={1} sx={{ mt: 2 }}>
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
  onDone,
  tokenSymbol = "TEST",
  networkName = "Base Sepolia",
  explorerBaseUrl = "https://sepolia.basescan.org",
}: {
  state: GalleryPurchaseState;
  open: boolean;
  transactions: readonly { kind: string; hash?: `0x${string}` }[];
  onClose: () => void;
  onDone: () => void;
  tokenSymbol?: string;
  networkName?: string;
  explorerBaseUrl?: string;
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
          tokenSymbol={tokenSymbol}
          networkName={networkName}
          explorerBaseUrl={explorerBaseUrl}
        />
      }
      bottomContent={
        <GalleryPurchaseModalActions state={state} onDone={onDone} />
      }
    />
  );
}
