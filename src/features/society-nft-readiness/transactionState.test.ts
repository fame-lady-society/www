import assert from "node:assert/strict";
import test from "node:test";
import type { Hash } from "viem";
import {
  initialReadinessTransactionState,
  isReadinessTransactionPending,
  readinessTransactionError,
  readinessTransactionReducer,
  readinessTransactionStatusCopy,
} from "./transactionState";

const HASH = `0x${"1".repeat(64)}` as Hash;

test("repair progresses through wallet, receipt, verification, and confirmation", () => {
  let state = readinessTransactionReducer(initialReadinessTransactionState, {
    type: "switch_requested",
  });
  assert.equal(state.status, "switching");
  assert.equal(isReadinessTransactionPending(state), true);

  state = readinessTransactionReducer(state, { type: "wallet_requested" });
  assert.equal(state.status, "awaiting_wallet");

  state = readinessTransactionReducer(state, { type: "broadcast", hash: HASH });
  assert.equal(state.status, "confirming");
  assert.equal(state.hash, HASH);

  state = readinessTransactionReducer(state, { type: "receipt_confirmed" });
  assert.equal(state.status, "verifying");
  assert.equal(state.hash, HASH);
  assert.notEqual(state.status, "confirmed");

  state = readinessTransactionReducer(state, {
    type: "verification_confirmed",
  });
  assert.equal(state.status, "confirmed");
  assert.equal(state.hash, HASH);
  assert.equal(isReadinessTransactionPending(state), false);
});

test("a Base-connected wallet can begin directly at wallet confirmation", () => {
  const state = readinessTransactionReducer(initialReadinessTransactionState, {
    type: "wallet_requested",
  });

  assert.deepEqual(state, {
    status: "awaiting_wallet",
    hash: null,
    error: null,
  });
});

test("reverted receipts and readback failures retain the validated hash", () => {
  let state = readinessTransactionReducer(initialReadinessTransactionState, {
    type: "wallet_requested",
  });
  state = readinessTransactionReducer(state, { type: "broadcast", hash: HASH });

  const reverted = readinessTransactionReducer(state, {
    type: "failed",
    error: readinessTransactionError("receipt_reverted"),
  });
  assert.equal(reverted.status, "error");
  assert.equal(reverted.hash, HASH);
  assert.deepEqual(reverted.error, {
    kind: "receipt_reverted",
    message: "The transaction reverted on Base. Try again.",
    retryable: true,
  });

  state = readinessTransactionReducer(state, { type: "receipt_confirmed" });
  const readbackFailed = readinessTransactionReducer(state, {
    type: "failed",
    error: readinessTransactionError("verification_failed"),
  });
  assert.equal(readbackFailed.status, "error");
  assert.equal(readbackFailed.hash, HASH);
  assert.equal(
    readbackFailed.error?.message,
    "The transaction confirmed, but Society NFT readiness could not be verified. Try again.",
  );
});

test("new repair attempts clear stale errors and hashes", () => {
  const failed = {
    status: "error" as const,
    hash: HASH,
    error: readinessTransactionError("receipt_failed"),
  };

  assert.deepEqual(
    readinessTransactionReducer(failed, { type: "wallet_requested" }),
    {
      status: "awaiting_wallet",
      hash: null,
      error: null,
    },
  );
  assert.deepEqual(
    readinessTransactionReducer(failed, { type: "switch_requested" }),
    {
      status: "switching",
      hash: null,
      error: null,
    },
  );
});

test("status copy follows the established auction transaction stages", () => {
  const confirming = readinessTransactionReducer(
    { ...initialReadinessTransactionState, hash: HASH },
    { type: "broadcast", hash: HASH },
  );
  const verifying = readinessTransactionReducer(confirming, {
    type: "receipt_confirmed",
  });
  const failed = readinessTransactionReducer(verifying, {
    type: "failed",
    error: readinessTransactionError("verification_failed"),
  });

  assert.deepEqual(
    readinessTransactionStatusCopy(initialReadinessTransactionState),
    null,
  );
  assert.deepEqual(readinessTransactionStatusCopy(confirming), {
    title: "Transaction submitted",
    detail: "Waiting for Base confirmation.",
  });
  assert.deepEqual(readinessTransactionStatusCopy(verifying), {
    title: "Confirmed on Base",
    detail: "Verifying Society NFT readiness.",
  });
  assert.deepEqual(readinessTransactionStatusCopy(failed), {
    title: "Transaction not completed",
    detail:
      "The transaction confirmed, but Society NFT readiness could not be verified. Try again.",
  });
});

test("reset restores the exact idle state", () => {
  const failed = {
    status: "error" as const,
    hash: HASH,
    error: readinessTransactionError("wallet_request_failed"),
  };

  assert.deepEqual(
    readinessTransactionReducer(failed, { type: "reset" }),
    initialReadinessTransactionState,
  );
  assert.equal(
    isReadinessTransactionPending(initialReadinessTransactionState),
    false,
  );
});
