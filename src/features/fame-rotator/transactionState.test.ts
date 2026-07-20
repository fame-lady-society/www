import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Address, Hash, Hex } from "viem";
import {
  classifyRotatorTransactionError,
  createRotatorSubmissionGate,
  initialRotatorTransactionState,
  minedTransactionMatchesFrozenIntent,
  projectRotationOwnershipProof,
  rotatorTransactionReducer,
  type RotatorFrozenIntent,
} from "./transactionState";

const ACCOUNT = "0x1111111111111111111111111111111111111111" as Address;
const ROTATOR = "0xC0e0A441660361ab2B6Ff8032Ed1860E230274bc" as Address;
const MIRROR = "0xBB5ED04dD7B207592429eb8d599d103CCad646c4" as Address;
const HASH = `0x${"1".repeat(64)}` as Hash;
const HASH2 = `0x${"2".repeat(64)}` as Hash;
const CALLDATA = "0xdeadbeef" as Hex;

const frozenRotate: RotatorFrozenIntent = {
  action: "rotate",
  account: ACCOUNT,
  chainId: 8453,
  targetId: 12n,
  offeredId: 3n,
  maxRotations: 4n,
  recipient: ACCOUNT,
  rotator: ROTATOR,
  mirror: MIRROR,
  callDataFingerprint: CALLDATA,
};

describe("createRotatorSubmissionGate", () => {
  it("blocks duplicate submissions until the first finishes", async () => {
    const gate = createRotatorSubmissionGate();
    let release: (() => void) | undefined;
    const first = gate.run(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );

    assert.equal(gate.pending, true);
    const duplicate = await gate.run(async () => undefined);
    assert.equal(duplicate.accepted, false);

    assert.equal(typeof release, "function");
    if (typeof release === "function") {
      release();
    }
    assert.deepEqual(await first, { accepted: true, value: undefined });
    assert.equal(gate.pending, false);
  });
});

describe("rotatorTransactionReducer", () => {
  it("progresses approval through simulation, wallet, broadcast, and verified", () => {
    let state = rotatorTransactionReducer(initialRotatorTransactionState, {
      type: "started",
      action: "approve",
      frozenIntent: { ...frozenRotate, action: "approve", targetId: null, maxRotations: null, recipient: null },
    });
    assert.equal(state.status, "simulating");
    state = rotatorTransactionReducer(state, { type: "wallet_requested" });
    assert.equal(state.status, "awaiting_wallet");
    state = rotatorTransactionReducer(state, { type: "broadcast", hash: HASH });
    assert.equal(state.status, "broadcast");
    assert.equal(state.effectiveHash, HASH);
    state = rotatorTransactionReducer(state, {
      type: "mined",
      hash: HASH,
      blockNumber: 100n,
    });
    assert.equal(state.status, "mined_pending_proof");
    state = rotatorTransactionReducer(state, { type: "verified" });
    assert.equal(state.status, "verified");
  });

  it("repriced rotation adopts the replacement hash", () => {
    let state = rotatorTransactionReducer(initialRotatorTransactionState, {
      type: "started",
      action: "rotate",
      frozenIntent: frozenRotate,
    });
    state = rotatorTransactionReducer(state, { type: "wallet_requested" });
    state = rotatorTransactionReducer(state, { type: "broadcast", hash: HASH });
    state = rotatorTransactionReducer(state, {
      type: "replaced",
      reason: "repriced",
      hash: HASH2,
    });
    assert.equal(state.effectiveHash, HASH2);
    assert.equal(state.replacement?.reason, "repriced");
  });

  it("cancelled and different-transaction terminals do not report success", () => {
    let state = rotatorTransactionReducer(initialRotatorTransactionState, {
      type: "started",
      action: "rotate",
      frozenIntent: frozenRotate,
    });
    state = rotatorTransactionReducer(state, { type: "broadcast", hash: HASH });
    state = rotatorTransactionReducer(state, { type: "cancelled" });
    assert.equal(state.status, "cancelled");
    assert.notEqual(state.status, "verified");

    state = rotatorTransactionReducer(initialRotatorTransactionState, {
      type: "started",
      action: "rotate",
      frozenIntent: frozenRotate,
    });
    state = rotatorTransactionReducer(state, {
      type: "different_transaction",
      hash: HASH2,
    });
    assert.equal(state.status, "different_transaction");
    assert.equal(state.error?.kind, "different_transaction");
  });

  it("mined/verifying is durable and refresh failure after proof retains verified outcome", () => {
    let state = rotatorTransactionReducer(initialRotatorTransactionState, {
      type: "started",
      action: "rotate",
      frozenIntent: frozenRotate,
    });
    state = rotatorTransactionReducer(state, {
      type: "mined",
      hash: HASH,
      blockNumber: 9n,
    });
    state = rotatorTransactionReducer(state, { type: "verification_pending" });
    assert.equal(state.status, "verification_pending");
    assert.equal(state.error?.blockRetryWrite, true);

    state = rotatorTransactionReducer(state, { type: "verified" });
    state = rotatorTransactionReducer(state, {
      type: "refresh_failed_after_verified",
      error: {
        kind: "refresh_failure",
        message: "refresh failed",
        retryable: true,
        shouldRefresh: false,
        blockRetryWrite: true,
      },
    });
    assert.equal(state.status, "refresh_failed_after_verified");
  });
});

describe("classifyRotatorTransactionError", () => {
  it("maps TargetNotReached, wallet reject, and safe summaries", () => {
    assert.equal(
      classifyRotatorTransactionError(
        { data: { errorName: "TargetNotReached" } },
        "receipt",
      ).kind,
      "target_not_reached",
    );
    assert.equal(
      classifyRotatorTransactionError({ code: 4001 }, "wallet").kind,
      "wallet_rejected",
    );
    assert.equal(
      classifyRotatorTransactionError(
        new Error("transfer to non-ERC721Receiver implementer"),
        "simulation",
      ).kind,
      "recipient_incompatible",
    );
    const summary = classifyRotatorTransactionError(
      new Error("boom\nRequest Arguments:\n  from: 0xabc"),
      "wallet",
    );
    assert.equal(summary.kind, "broadcast_failure");
    assert.ok(!summary.message.includes("Request Arguments"));
  });
});

describe("projectRotationOwnershipProof", () => {
  it("verifies only when target is recipient and offered is burned", () => {
    assert.deepEqual(
      projectRotationOwnershipProof({
        targetOwner: ACCOUNT,
        offeredOwner: "0x0000000000000000000000000000000000000000",
        recipient: ACCOUNT,
      }),
      { status: "verified" },
    );
    assert.deepEqual(
      projectRotationOwnershipProof({
        targetOwner: ACCOUNT,
        offeredOwner: ACCOUNT,
        recipient: ACCOUNT,
      }),
      { status: "mismatch" },
    );
    assert.deepEqual(
      projectRotationOwnershipProof({
        targetOwner: null,
        offeredOwner: "0x0000000000000000000000000000000000000000",
        recipient: ACCOUNT,
      }),
      { status: "pending_reads" },
    );
  });
});

describe("minedTransactionMatchesFrozenIntent", () => {
  it("requires exact sender, destination, zero value, and calldata", () => {
    assert.equal(
      minedTransactionMatchesFrozenIntent({
        from: ACCOUNT,
        to: ROTATOR,
        value: 0n,
        input: CALLDATA,
        frozen: frozenRotate,
        expectedInput: CALLDATA,
      }),
      true,
    );
    assert.equal(
      minedTransactionMatchesFrozenIntent({
        from: ACCOUNT,
        to: ROTATOR,
        value: 1n,
        input: CALLDATA,
        frozen: frozenRotate,
        expectedInput: CALLDATA,
      }),
      false,
    );
    assert.equal(
      minedTransactionMatchesFrozenIntent({
        from: ACCOUNT,
        to: ROTATOR,
        value: 0n,
        input: "0xother" as Hex,
        frozen: frozenRotate,
        expectedInput: CALLDATA,
      }),
      false,
    );
  });
});
