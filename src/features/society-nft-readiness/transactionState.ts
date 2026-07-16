import type { Hash } from "viem";

export type ReadinessTransactionStatus =
  | "idle"
  | "switching"
  | "awaiting_wallet"
  | "confirming"
  | "verifying"
  | "confirmed"
  | "error";

export type ReadinessTransactionErrorKind =
  | "switch_failed"
  | "wallet_request_failed"
  | "receipt_reverted"
  | "receipt_failed"
  | "verification_failed"
  | "verification_mismatch";

export interface ReadinessTransactionError {
  kind: ReadinessTransactionErrorKind;
}

const READINESS_TRANSACTION_ERROR_MESSAGES: Record<
  ReadinessTransactionErrorKind,
  string
> = {
  switch_failed: "The network switch was not completed. Try again.",
  wallet_request_failed: "The wallet request was not completed. Try again.",
  receipt_reverted: "The transaction reverted on Base. Try again.",
  receipt_failed: "The transaction could not be confirmed on Base. Try again.",
  verification_failed:
    "The transaction confirmed, but Society NFT readiness could not be verified. Try again.",
  verification_mismatch:
    "FAME still reports Society NFT generation as disabled. Try again.",
};

export function readinessTransactionError(
  kind: ReadinessTransactionErrorKind,
): ReadinessTransactionError {
  return { kind };
}

export interface ReadinessTransactionState {
  status: ReadinessTransactionStatus;
  hash: Hash | null;
  error: ReadinessTransactionError | null;
}

export const initialReadinessTransactionState: ReadinessTransactionState = {
  status: "idle",
  hash: null,
  error: null,
};

export type ReadinessTransactionEvent =
  | { type: "switch_requested" }
  | { type: "wallet_requested" }
  | { type: "broadcast"; hash: Hash }
  | { type: "receipt_confirmed" }
  | { type: "verification_confirmed" }
  | { type: "failed"; error: ReadinessTransactionError }
  | { type: "reset" };

export function readinessTransactionReducer(
  state: ReadinessTransactionState,
  event: ReadinessTransactionEvent,
): ReadinessTransactionState {
  switch (event.type) {
    case "switch_requested":
      return { status: "switching", hash: null, error: null };
    case "wallet_requested":
      return { status: "awaiting_wallet", hash: null, error: null };
    case "broadcast":
      return { ...state, status: "confirming", hash: event.hash, error: null };
    case "receipt_confirmed":
      return { ...state, status: "verifying", error: null };
    case "verification_confirmed":
      return { ...state, status: "confirmed", error: null };
    case "failed":
      return { ...state, status: "error", error: event.error };
    case "reset":
      return initialReadinessTransactionState;
  }
}

export function isReadinessTransactionPending(
  state: ReadinessTransactionState,
): boolean {
  return (
    state.status === "switching" ||
    state.status === "awaiting_wallet" ||
    state.status === "confirming" ||
    state.status === "verifying"
  );
}

export interface ReadinessTransactionStatusCopy {
  title: string;
  detail: string;
}

export function readinessTransactionStatusCopy(
  state: ReadinessTransactionState,
): ReadinessTransactionStatusCopy | null {
  switch (state.status) {
    case "idle":
      return null;
    case "switching":
      return {
        title: "Switch to Base",
        detail: "Confirm the network change in your wallet.",
      };
    case "awaiting_wallet":
      return {
        title: "Confirm in your wallet",
        detail: "Review and submit the Society NFT readiness update.",
      };
    case "confirming":
      return {
        title: "Transaction submitted",
        detail: "Waiting for Base confirmation.",
      };
    case "verifying":
      return {
        title: "Confirmed on Base",
        detail: "Verifying Society NFT readiness.",
      };
    case "confirmed":
      return {
        title: "Society NFT generation enabled",
        detail: "Your wallet is ready for qualifying FAME receipts.",
      };
    case "error":
      return {
        title: "Transaction not completed",
        detail: state.error
          ? READINESS_TRANSACTION_ERROR_MESSAGES[state.error.kind]
          : "The transaction could not be completed.",
      };
  }
}
