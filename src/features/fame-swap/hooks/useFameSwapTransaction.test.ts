import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Address, Hash } from "viem";
import {
  nextSwapConfirmedEmission,
  resolveConfirmedSwapReceipt,
  swapConfirmedEmissionKey,
} from "./useFameSwapTransaction";

const ACCOUNT_A = "0x0000000000000000000000000000000000000aAa" as Address;
const ACCOUNT_B = "0x0000000000000000000000000000000000000bBb" as Address;
const HASH_1 = `0x${"1".repeat(64)}` as Hash;
const HASH_2 = `0x${"2".repeat(64)}` as Hash;

describe("resolveConfirmedSwapReceipt", () => {
  it("exposes the receipt transaction hash including after repricing", () => {
    const confirmed = resolveConfirmedSwapReceipt({
      submissionKind: "swap",
      receiptStatus: "success",
      // Effective mined hash differs from the original broadcast (repriced).
      receiptTransactionHash: HASH_2,
      broadcastHash: HASH_1,
      initiatingAccount: ACCOUNT_A,
    });

    assert.deepEqual(confirmed, { hash: HASH_2, account: ACCOUNT_A });
  });

  it("falls back to the broadcast hash when the receipt hash is missing", () => {
    const confirmed = resolveConfirmedSwapReceipt({
      submissionKind: "swap",
      receiptStatus: "success",
      receiptTransactionHash: undefined,
      broadcastHash: HASH_1,
      initiatingAccount: ACCOUNT_A,
    });

    assert.deepEqual(confirmed, { hash: HASH_1, account: ACCOUNT_A });
  });

  it("does not confirm approval receipts, reverts, or missing accounts", () => {
    assert.equal(
      resolveConfirmedSwapReceipt({
        submissionKind: "approval",
        receiptStatus: "success",
        receiptTransactionHash: HASH_1,
        broadcastHash: HASH_1,
        initiatingAccount: ACCOUNT_A,
      }),
      null,
    );

    assert.equal(
      resolveConfirmedSwapReceipt({
        submissionKind: "swap",
        receiptStatus: "reverted",
        receiptTransactionHash: HASH_1,
        broadcastHash: HASH_1,
        initiatingAccount: ACCOUNT_A,
      }),
      null,
    );

    assert.equal(
      resolveConfirmedSwapReceipt({
        submissionKind: "swap",
        receiptStatus: "success",
        receiptTransactionHash: HASH_1,
        broadcastHash: HASH_1,
        initiatingAccount: null,
      }),
      null,
    );
  });
});

describe("nextSwapConfirmedEmission", () => {
  it("emits exactly once per effective confirmed hash for the initiating account", () => {
    const candidate = { hash: HASH_2, account: ACCOUNT_A };

    const first = nextSwapConfirmedEmission(null, candidate, ACCOUNT_A);
    assert.ok(first);
    assert.deepEqual(first.payload, candidate);
    assert.equal(first.key, swapConfirmedEmissionKey(candidate));

    const second = nextSwapConfirmedEmission(first.key, candidate, ACCOUNT_A);
    assert.equal(second, null);
  });

  it("does not emit on rejection/revert-shaped empty candidates", () => {
    assert.equal(nextSwapConfirmedEmission(null, null, ACCOUNT_A), null);
  });

  it("does not emit after account change or for another account", () => {
    const candidate = { hash: HASH_1, account: ACCOUNT_A };

    assert.equal(
      nextSwapConfirmedEmission(null, candidate, ACCOUNT_B),
      null,
      "live account differs from initiating account",
    );

    assert.equal(
      nextSwapConfirmedEmission(null, candidate, undefined),
      null,
      "disconnected live account",
    );

    // Another account's completion is a different initiating account.
    const other = { hash: HASH_1, account: ACCOUNT_B };
    const emission = nextSwapConfirmedEmission(null, other, ACCOUNT_A);
    assert.equal(emission, null);
  });

  it("allows a later distinct hash for the same account", () => {
    const firstKey = swapConfirmedEmissionKey({
      hash: HASH_1,
      account: ACCOUNT_A,
    });
    const next = nextSwapConfirmedEmission(
      firstKey,
      { hash: HASH_2, account: ACCOUNT_A },
      ACCOUNT_A,
    );
    assert.ok(next);
    assert.equal(next.payload.hash, HASH_2);
  });
});
