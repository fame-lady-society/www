import type { Hash } from "viem";
import type { ReplacementReason } from "viem/actions";

export type AuctionTransactionAction = "bid" | "settle";
export type AuctionTransactionStatus =
  | "idle"
  | "simulating"
  | "awaiting_wallet"
  | "confirming"
  | "refreshing"
  | "confirmed"
  | "error";

export type AuctionTransactionErrorKind =
  | "wallet_rejected"
  | "bid_too_low"
  | "bidding_closed"
  | "settlement_unavailable"
  | "contract_reverted"
  | "rpc_failure"
  | "broadcast_failure"
  | "receipt_reverted"
  | "receipt_failure"
  | "replacement_cancelled"
  | "replacement_replaced"
  | "refresh_failure"
  | "environment_changed";

export interface AuctionTransactionError {
  kind: AuctionTransactionErrorKind;
  message: string;
  retryable: boolean;
  shouldRefresh: boolean;
}

export interface AuctionBidFormState {
  value: string;
  touched: boolean;
}

export function auctionBidFormAfterResult(
  state: AuctionBidFormState,
  resultStatus: "confirmed" | "resolved_by_refresh" | "failed" | "blocked",
): AuctionBidFormState {
  return resultStatus === "confirmed" ? { value: "", touched: false } : state;
}

export interface AuctionTransactionState {
  status: AuctionTransactionStatus;
  action: AuctionTransactionAction | null;
  hash: Hash | null;
  replacement: { reason: ReplacementReason; hash: Hash } | null;
  error: AuctionTransactionError | null;
}

export const initialAuctionTransactionState: AuctionTransactionState = {
  status: "idle",
  action: null,
  hash: null,
  replacement: null,
  error: null,
};

export type AuctionTransactionEvent =
  | { type: "started"; action: AuctionTransactionAction }
  | { type: "wallet_requested" }
  | { type: "broadcast"; hash: Hash }
  | { type: "replaced"; reason: ReplacementReason; hash: Hash }
  | { type: "refreshing" }
  | { type: "confirmed" }
  | { type: "failed"; error: AuctionTransactionError }
  | { type: "reset" };

export function auctionTransactionReducer(
  state: AuctionTransactionState,
  event: AuctionTransactionEvent,
): AuctionTransactionState {
  switch (event.type) {
    case "started":
      return {
        status: "simulating",
        action: event.action,
        hash: null,
        replacement: null,
        error: null,
      };
    case "wallet_requested":
      return { ...state, status: "awaiting_wallet", error: null };
    case "broadcast":
      return { ...state, status: "confirming", hash: event.hash };
    case "replaced":
      return {
        ...state,
        status: "confirming",
        hash: event.hash,
        replacement: { reason: event.reason, hash: event.hash },
      };
    case "refreshing":
      return { ...state, status: "refreshing" };
    case "confirmed":
      return { ...state, status: "confirmed", error: null };
    case "failed":
      return { ...state, status: "error", error: event.error };
    case "reset":
      return initialAuctionTransactionState;
  }
}

export type AuctionErrorStage =
  | "simulation"
  | "wallet"
  | "receipt"
  | "replacement_cancelled"
  | "replacement_replaced"
  | "refresh";

function errorChain(error: unknown): unknown[] {
  const chain: unknown[] = [];
  const seen = new Set<unknown>();
  let current = error;

  while (
    current !== null &&
    (typeof current === "object" || typeof current === "function") &&
    !seen.has(current)
  ) {
    chain.push(current);
    seen.add(current);
    current = (current as { cause?: unknown }).cause;
  }

  return chain;
}

function contractErrorName(error: unknown): string | null {
  for (const candidate of errorChain(error)) {
    const record = candidate as {
      errorName?: unknown;
      data?: { errorName?: unknown };
    };
    const name = record.data?.errorName ?? record.errorName;
    if (typeof name === "string") return name;
  }

  const text = error instanceof Error ? error.message : String(error);
  return (
    ["BidTooLow", "BiddingClosed", "SettlementUnavailable"].find((name) =>
      text.includes(name),
    ) ?? null
  );
}

function userRejected(error: unknown): boolean {
  return errorChain(error).some((candidate) => {
    const record = candidate as { code?: unknown; name?: unknown };
    return (
      record.code === 4001 ||
      record.name === "UserRejectedRequestError" ||
      (record.name === "TransactionExecutionError" &&
        String((candidate as Error).message)
          .toLowerCase()
          .includes("rejected"))
    );
  });
}

function contractReverted(error: unknown): boolean {
  if (
    errorChain(error).some((candidate) => {
      const record = candidate as {
        name?: unknown;
        data?: unknown;
        errorName?: unknown;
      };
      return (
        record.name === "ContractFunctionRevertedError" ||
        record.name === "ContractFunctionExecutionError" ||
        record.errorName !== undefined ||
        (record.data !== null && typeof record.data === "object")
      );
    })
  ) {
    return true;
  }

  const text = error instanceof Error ? error.message : String(error);
  return /execution reverted|contract function .*reverted|reverted with/i.test(
    text,
  );
}

export function classifyAuctionTransactionError(
  error: unknown,
  stage: AuctionErrorStage,
): AuctionTransactionError {
  if (stage === "replacement_cancelled") {
    return {
      kind: "replacement_cancelled",
      message: "The replacement cancelled this transaction.",
      retryable: true,
      shouldRefresh: false,
    };
  }

  if (stage === "replacement_replaced") {
    return {
      kind: "replacement_replaced",
      message: "A different transaction replaced this auction request.",
      retryable: true,
      shouldRefresh: false,
    };
  }

  if (stage === "refresh") {
    return {
      kind: "refresh_failure",
      message:
        "Transaction confirmed, but the latest auction state could not be refreshed.",
      retryable: true,
      shouldRefresh: false,
    };
  }

  if (userRejected(error)) {
    return {
      kind: "wallet_rejected",
      message: "The wallet request was rejected.",
      retryable: true,
      shouldRefresh: false,
    };
  }

  const errorName = contractErrorName(error);
  if (errorName === "BidTooLow") {
    return {
      kind: "bid_too_low",
      message:
        "That bid is no longer high enough. Review the latest bid and try again.",
      retryable: true,
      shouldRefresh: true,
    };
  }
  if (errorName === "BiddingClosed") {
    return {
      kind: "bidding_closed",
      message: "Bidding has closed.",
      retryable: false,
      shouldRefresh: true,
    };
  }
  if (errorName === "SettlementUnavailable") {
    return {
      kind: "settlement_unavailable",
      message:
        "Settlement is not available yet. Refresh the auction and try again.",
      retryable: true,
      shouldRefresh: true,
    };
  }
  if (contractReverted(error)) {
    return {
      kind: "contract_reverted",
      message: "The auction contract rejected this request.",
      retryable: true,
      shouldRefresh: true,
    };
  }

  if (stage === "simulation") {
    return {
      kind: "rpc_failure",
      message: "The auction request could not be simulated. Try again.",
      retryable: true,
      shouldRefresh: false,
    };
  }
  if (stage === "wallet") {
    return {
      kind: "broadcast_failure",
      message: "The wallet could not broadcast the transaction. Try again.",
      retryable: true,
      shouldRefresh: false,
    };
  }

  return {
    kind: "receipt_failure",
    message:
      "The transaction receipt could not be confirmed. Check the explorer and try again.",
    retryable: true,
    shouldRefresh: true,
  };
}

export interface AuctionSubmissionGate {
  readonly pending: boolean;
  run<T>(
    task: () => Promise<T>,
  ): Promise<{ accepted: true; value: T } | { accepted: false }>;
}

export function createAuctionSubmissionGate(): AuctionSubmissionGate {
  let pending = false;

  return {
    get pending() {
      return pending;
    },
    async run<T>(task: () => Promise<T>) {
      if (pending) return { accepted: false as const };
      pending = true;
      try {
        return { accepted: true as const, value: await task() };
      } finally {
        pending = false;
      }
    },
  };
}
