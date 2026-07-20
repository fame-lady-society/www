import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it } from "node:test";
import type { Address, Hash } from "viem";
import {
  FameRotatorStatus,
  isRotatorStatusAssertive,
  rotatorTransactionStatusCopy,
} from "./FameRotatorStatus";
import {
  initialRotatorTransactionState,
  type RotatorFrozenIntent,
  type RotatorTransactionState,
} from "../transactionState";

const ACCOUNT = "0x1111111111111111111111111111111111111111" as Address;
const ROTATOR = "0xC0e0A441660361ab2B6Ff8032Ed1860E230274bc" as Address;
const MIRROR = "0xBB5ED04dD7B207592429eb8d599d103CCad646c4" as Address;
const HASH = `0x${"1".repeat(64)}` as Hash;

const frozen: RotatorFrozenIntent = {
  action: "rotate",
  account: ACCOUNT,
  chainId: 8453,
  targetId: 5n,
  offeredId: 12n,
  maxRotations: 3n,
  recipient: ACCOUNT,
  rotator: ROTATOR,
  mirror: MIRROR,
  callDataFingerprint: null,
};

function state(
  partial: Partial<RotatorTransactionState>,
): RotatorTransactionState {
  return {
    ...initialRotatorTransactionState,
    action: "rotate",
    frozenIntent: frozen,
    ...partial,
  };
}

describe("rotatorTransactionStatusCopy", () => {
  it("maps mined/verifying, confirmed, rejected, stale pool, receiver, and refresh-failure copy", () => {
    assert.equal(rotatorTransactionStatusCopy(state({ status: "idle" })), null);

    const verifying = rotatorTransactionStatusCopy(
      state({ status: "verification_pending" }),
    );
    assert.ok(verifying);
    assert.match(verifying.title, /proof pending|verifying/i);
    assert.equal(verifying.assertive, false);

    const verified = rotatorTransactionStatusCopy(
      state({ status: "verified" }),
    );
    assert.ok(verified);
    assert.match(verified.title, /confirmed/i);
    assert.equal(verified.assertive, false);

    const rejected = rotatorTransactionStatusCopy(
      state({
        status: "failed",
        error: {
          kind: "wallet_rejected",
          message: "The wallet request was rejected.",
          retryable: true,
          shouldRefresh: false,
        },
      }),
    );
    assert.ok(rejected);
    assert.match(rejected.title, /rejected/i);
    assert.equal(rejected.assertive, true);

    const stale = rotatorTransactionStatusCopy(
      state({
        status: "reverted",
        error: {
          kind: "target_not_reached",
          message: "pool reordered",
          retryable: true,
          shouldRefresh: true,
        },
      }),
    );
    assert.ok(stale);
    assert.match(stale.title, /Target not reached/i);
    assert.equal(stale.assertive, true);

    const receiver = rotatorTransactionStatusCopy(
      state({
        status: "failed",
        error: {
          kind: "recipient_incompatible",
          message: "cannot receive",
          retryable: false,
          shouldRefresh: false,
        },
      }),
    );
    assert.ok(receiver);
    assert.match(receiver.title, /Recipient/i);

    const refresh = rotatorTransactionStatusCopy(
      state({
        status: "refresh_failed_after_verified",
        error: {
          kind: "refresh_failure",
          message: "could not refresh",
          retryable: true,
          shouldRefresh: false,
          blockRetryWrite: true,
        },
      }),
    );
    assert.ok(refresh);
    assert.match(refresh.title, /refresh failed/i);
    assert.equal(refresh.assertive, true);
  });

  it("marks failure statuses assertive and progress polite", () => {
    assert.equal(isRotatorStatusAssertive("simulating"), false);
    assert.equal(isRotatorStatusAssertive("verified"), false);
    assert.equal(isRotatorStatusAssertive("failed"), true);
    assert.equal(isRotatorStatusAssertive("reverted"), true);
    assert.equal(isRotatorStatusAssertive("different_transaction"), true);
  });
});

describe("FameRotatorStatus", () => {
  it("renders polite progress and assertive failures with explorer links", () => {
    const progress = renderToStaticMarkup(
      createElement(FameRotatorStatus, {
        state: state({
          status: "broadcast",
          hash: HASH,
          effectiveHash: HASH,
        }),
      }),
    );
    assert.match(progress, /role="status"/);
    assert.match(progress, /aria-live="polite"/);
    assert.match(progress, /data-assertive="false"/);
    assert.match(progress, /basescan\.org\/tx/);
    assert.match(progress, /data-testid="rotator-tx-explorer-link"/);

    const failure = renderToStaticMarkup(
      createElement(FameRotatorStatus, {
        state: state({
          status: "failed",
          hash: HASH,
          effectiveHash: HASH,
          error: {
            kind: "target_not_reached",
            message: "The pool reordered.",
            retryable: true,
            shouldRefresh: true,
          },
        }),
        onRetry: () => undefined,
        onReset: () => undefined,
      }),
    );
    assert.match(failure, /role="alert"/);
    assert.match(failure, /aria-live="assertive"/);
    assert.match(failure, /data-assertive="true"/);
    assert.match(failure, /Try again/);
    assert.match(failure, /Dismiss/);
  });

  it("offers ownership proof retry without encouraging another write", () => {
    const html = renderToStaticMarkup(
      createElement(FameRotatorStatus, {
        state: state({
          status: "verification_pending",
          hash: HASH,
          effectiveHash: HASH,
          error: {
            kind: "verification_pending",
            message: "Retry proof without sending another transaction.",
            retryable: true,
            shouldRefresh: false,
            blockRetryWrite: true,
          },
        }),
        onRetryVerification: () => undefined,
        onReset: () => undefined,
      }),
    );
    assert.match(html, /Retry ownership proof/);
    assert.doesNotMatch(html, />Try again</);
  });
});
