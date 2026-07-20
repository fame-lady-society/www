import type { Address, Hash, Hex } from "viem";
import type { ReplacementReason } from "viem/actions";

export type RotatorTransactionAction = "approve" | "rotate";

/**
 * Transaction lifecycle including mined-but-unverified ownership proof.
 * MinedPendingProof must never be treated as a failed write (U6 execution note).
 */
export type RotatorTransactionStatus =
  | "idle"
  | "simulating"
  | "awaiting_wallet"
  | "broadcast"
  | "confirming"
  | "mined_pending_proof"
  | "verification_pending"
  | "verified"
  | "different_transaction"
  | "cancelled"
  | "reverted"
  | "failed"
  | "refresh_failed_after_verified";

export type RotatorTransactionErrorKind =
  | "wallet_rejected"
  | "simulation_failed"
  | "broadcast_failure"
  | "receipt_reverted"
  | "receipt_failure"
  | "replacement_cancelled"
  | "different_transaction"
  | "target_not_reached"
  | "ownership_mismatch"
  | "verification_pending"
  | "refresh_failure"
  | "environment_changed"
  | "recipient_incompatible"
  | "stale_context"
  | "contract_reverted"
  | "rpc_failure";

export interface RotatorTransactionError {
  kind: RotatorTransactionErrorKind;
  message: string;
  retryable: boolean;
  /** When true, latest pool/inventory should refresh after failure. */
  shouldRefresh: boolean;
  /** When true, do not encourage another write (e.g. mined/verifying). */
  blockRetryWrite?: boolean;
}

export interface RotatorFrozenIntent {
  action: RotatorTransactionAction;
  account: Address;
  chainId: number;
  targetId: bigint | null;
  offeredId: bigint;
  maxRotations: bigint | null;
  recipient: Address | null;
  rotator: Address;
  mirror: Address;
  /** Exact calldata hash or encoded identity for replacement comparison. */
  callDataFingerprint: Hex | null;
}

export interface RotatorTransactionState {
  status: RotatorTransactionStatus;
  action: RotatorTransactionAction | null;
  hash: Hash | null;
  effectiveHash: Hash | null;
  receiptBlock: bigint | null;
  replacement: { reason: ReplacementReason; hash: Hash } | null;
  frozenIntent: RotatorFrozenIntent | null;
  error: RotatorTransactionError | null;
}

export const initialRotatorTransactionState: RotatorTransactionState = {
  status: "idle",
  action: null,
  hash: null,
  effectiveHash: null,
  receiptBlock: null,
  replacement: null,
  frozenIntent: null,
  error: null,
};

export type RotatorTransactionEvent =
  | {
      type: "started";
      action: RotatorTransactionAction;
      frozenIntent: RotatorFrozenIntent;
    }
  | { type: "wallet_requested" }
  | { type: "broadcast"; hash: Hash }
  | { type: "replaced"; reason: ReplacementReason; hash: Hash }
  | { type: "mined"; hash: Hash; blockNumber: bigint }
  | { type: "verification_pending" }
  | { type: "verified" }
  | { type: "different_transaction"; hash: Hash | null }
  | { type: "cancelled" }
  | { type: "reverted"; error: RotatorTransactionError }
  | { type: "failed"; error: RotatorTransactionError }
  | { type: "refresh_failed_after_verified"; error: RotatorTransactionError }
  | { type: "reset" };

export function rotatorTransactionReducer(
  state: RotatorTransactionState,
  event: RotatorTransactionEvent,
): RotatorTransactionState {
  switch (event.type) {
    case "started":
      return {
        status: "simulating",
        action: event.action,
        hash: null,
        effectiveHash: null,
        receiptBlock: null,
        replacement: null,
        frozenIntent: event.frozenIntent,
        error: null,
      };
    case "wallet_requested":
      return { ...state, status: "awaiting_wallet", error: null };
    case "broadcast":
      return {
        ...state,
        status: "broadcast",
        hash: event.hash,
        effectiveHash: event.hash,
      };
    case "replaced":
      // Identical-calldata repricing inherits attribution (effective hash updates).
      // Semantic differences are handled by different_transaction event from the hook.
      return {
        ...state,
        status: "broadcast",
        hash: event.hash,
        effectiveHash: event.hash,
        replacement: { reason: event.reason, hash: event.hash },
      };
    case "mined":
      return {
        ...state,
        status: "mined_pending_proof",
        hash: event.hash,
        effectiveHash: event.hash,
        receiptBlock: event.blockNumber,
        error: null,
      };
    case "verification_pending":
      return {
        ...state,
        status: "verification_pending",
        error: {
          kind: "verification_pending",
          message:
            "The rotation mined, but ownership could not be verified yet. Retry proof without sending another transaction.",
          retryable: true,
          shouldRefresh: false,
          blockRetryWrite: true,
        },
      };
    case "verified":
      return { ...state, status: "verified", error: null };
    case "different_transaction":
      return {
        ...state,
        status: "different_transaction",
        hash: event.hash ?? state.hash,
        effectiveHash: event.hash ?? state.effectiveHash,
        error: {
          kind: "different_transaction",
          message:
            "A different transaction mined. It is not attributed as this frozen rotation.",
          retryable: true,
          shouldRefresh: true,
          blockRetryWrite: false,
        },
      };
    case "cancelled":
      return {
        ...state,
        status: "cancelled",
        error: {
          kind: "replacement_cancelled",
          message: "The replacement cancelled this transaction.",
          retryable: true,
          shouldRefresh: false,
        },
      };
    case "reverted":
      return { ...state, status: "reverted", error: event.error };
    case "failed":
      return { ...state, status: "failed", error: event.error };
    case "refresh_failed_after_verified":
      return {
        ...state,
        status: "refresh_failed_after_verified",
        error: event.error,
      };
    case "reset":
      return initialRotatorTransactionState;
  }
}

export type RotatorErrorStage =
  | "simulation"
  | "wallet"
  | "receipt"
  | "replacement_cancelled"
  | "different_transaction"
  | "verification"
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
  if (text.includes("TargetNotReached")) return "TargetNotReached";
  return null;
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

/**
 * Summarize unknown viem/provider errors without exposing raw wallet payloads
 * as primary copy (R20).
 */
export function summarizeRotatorProviderError(error: unknown): string {
  const text =
    error instanceof Error ? error.message : String(error ?? "Unknown error");
  const normalized = text.replace(/\s+/g, " ").trim();
  const markerIndex = normalized.search(
    /\b(?:Request Arguments|Contract Call|Docs|Details|Version|Args|Data):/i,
  );
  const summary =
    markerIndex >= 0 ? normalized.slice(0, markerIndex).trim() : normalized;
  if (summary.length === 0) return "The wallet request failed.";
  if (summary.length > 240) return `${summary.slice(0, 237)}…`;
  return summary;
}

export function classifyRotatorTransactionError(
  error: unknown,
  stage: RotatorErrorStage,
): RotatorTransactionError {
  if (stage === "replacement_cancelled") {
    return {
      kind: "replacement_cancelled",
      message: "The replacement cancelled this transaction.",
      retryable: true,
      shouldRefresh: false,
    };
  }

  if (stage === "different_transaction") {
    return {
      kind: "different_transaction",
      message:
        "A different transaction mined. It is not attributed as this frozen rotation.",
      retryable: true,
      shouldRefresh: true,
    };
  }

  if (stage === "refresh") {
    return {
      kind: "refresh_failure",
      message:
        "Ownership was verified, but the latest pool inventory could not be refreshed.",
      retryable: true,
      shouldRefresh: false,
      blockRetryWrite: true,
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
  if (errorName === "TargetNotReached") {
    return {
      kind: "target_not_reached",
      message:
        "The selected target was not reached within the rotation bound. The pool likely reordered. Your offered NFT should still be yours — refresh and try again with a new bound.",
      retryable: true,
      shouldRefresh: true,
    };
  }

  const summary = summarizeRotatorProviderError(error);
  if (
    /receiver|ERC721Receiver|transfer to non-ERC721Receiver|unsafe recipient/i.test(
      summary,
    )
  ) {
    return {
      kind: "recipient_incompatible",
      message:
        "The recipient cannot receive this Society NFT. This wallet may not support safe NFT transfers.",
      retryable: false,
      shouldRefresh: false,
    };
  }

  if (contractReverted(error)) {
    return {
      kind: "contract_reverted",
      message:
        stage === "simulation"
          ? "Simulation rejected this request. Check ownership, approval, and pool position."
          : "The rotator contract rejected this request.",
      retryable: true,
      shouldRefresh: true,
    };
  }

  if (stage === "simulation") {
    return {
      kind: "simulation_failed",
      message: "The rotation request could not be simulated. Try again.",
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

  if (stage === "verification") {
    return {
      kind: "verification_pending",
      message:
        "The transaction mined, but ownership proof could not be completed. Retry verification without sending another write.",
      retryable: true,
      shouldRefresh: false,
      blockRetryWrite: true,
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

/**
 * Receipt-block ownership predicate for rotation success (R21 / KTD12).
 * Success only when target owned by recipient and offered is burned (address(0)).
 */
export function projectRotationOwnershipProof({
  targetOwner,
  offeredOwner,
  recipient,
}: {
  targetOwner: Address | null;
  offeredOwner: Address | null;
  recipient: Address;
}):
  | { status: "verified" }
  | { status: "mismatch" }
  | { status: "pending_reads" } {
  if (targetOwner === null || offeredOwner === null) {
    return { status: "pending_reads" };
  }

  const zero = "0x0000000000000000000000000000000000000000";
  if (
    targetOwner.toLowerCase() === recipient.toLowerCase() &&
    offeredOwner.toLowerCase() === zero
  ) {
    return { status: "verified" };
  }

  return { status: "mismatch" };
}

/**
 * Whether a mined transaction may inherit the frozen rotation intent.
 * Only exact matching sender, destination, zero value, function, and args.
 */
export function minedTransactionMatchesFrozenIntent({
  from,
  to,
  value,
  input,
  frozen,
  expectedInput,
}: {
  from: Address;
  to: Address | null;
  value: bigint;
  input: Hex;
  frozen: RotatorFrozenIntent;
  expectedInput: Hex;
}): boolean {
  if (from.toLowerCase() !== frozen.account.toLowerCase()) return false;
  if (!to || to.toLowerCase() !== frozen.rotator.toLowerCase()) return false;
  if (value !== 0n) return false;
  if (input.toLowerCase() !== expectedInput.toLowerCase()) return false;
  return true;
}

export interface RotatorSubmissionGate {
  readonly pending: boolean;
  run<T>(
    task: () => Promise<T>,
  ): Promise<{ accepted: true; value: T } | { accepted: false }>;
}

export function createRotatorSubmissionGate(): RotatorSubmissionGate {
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
