import assert from "node:assert/strict";
import test from "node:test";
import {
  auctionTransactionReducer,
  classifyAuctionTransactionError,
  createAuctionSubmissionGate,
  initialAuctionTransactionState,
} from "./transactionState";

test("pending stages block duplicate submissions until the first finishes", async () => {
  const gate = createAuctionSubmissionGate();
  let release!: () => void;
  const first = gate.run(
    () => new Promise<void>((resolve) => (release = resolve)),
  );

  assert.equal(gate.pending, true);
  const duplicate = await gate.run(async () => undefined);
  assert.equal(duplicate.accepted, false);

  release();
  assert.deepEqual(await first, { accepted: true, value: undefined });
  assert.equal(gate.pending, false);
});

test("classifies wallet, custom-contract, transport, receipt, and replacement failures", () => {
  assert.equal(
    classifyAuctionTransactionError({ code: 4001 }, "wallet").kind,
    "wallet_rejected",
  );
  assert.equal(
    classifyAuctionTransactionError(
      { data: { errorName: "BidTooLow" } },
      "simulation",
    ).kind,
    "bid_too_low",
  );
  assert.equal(
    classifyAuctionTransactionError(
      { cause: { data: { errorName: "BiddingClosed" } } },
      "simulation",
    ).kind,
    "bidding_closed",
  );
  assert.equal(
    classifyAuctionTransactionError(
      new Error("SettlementUnavailable"),
      "simulation",
    ).kind,
    "settlement_unavailable",
  );
  assert.equal(
    classifyAuctionTransactionError(
      { name: "ContractFunctionRevertedError", message: "execution reverted" },
      "simulation",
    ).kind,
    "contract_reverted",
  );
  assert.equal(
    classifyAuctionTransactionError(new Error("RPC unavailable"), "simulation")
      .kind,
    "rpc_failure",
  );
  assert.equal(
    classifyAuctionTransactionError(new Error("broadcast failed"), "wallet")
      .kind,
    "broadcast_failure",
  );
  assert.equal(
    classifyAuctionTransactionError(new Error("receipt failed"), "receipt")
      .kind,
    "receipt_failure",
  );
  assert.equal(
    classifyAuctionTransactionError(
      new Error("cancelled"),
      "replacement_cancelled",
    ).kind,
    "replacement_cancelled",
  );
});

test("reducer keeps replacement details and requires refresh before confirmation", () => {
  const hash = `0x${"1".repeat(64)}` as const;
  const replacementHash = `0x${"2".repeat(64)}` as const;
  let state = auctionTransactionReducer(initialAuctionTransactionState, {
    type: "started",
    action: "bid",
  });
  state = auctionTransactionReducer(state, { type: "wallet_requested" });
  state = auctionTransactionReducer(state, { type: "broadcast", hash });
  state = auctionTransactionReducer(state, {
    type: "replaced",
    hash: replacementHash,
    reason: "repriced",
  });
  state = auctionTransactionReducer(state, { type: "refreshing" });

  assert.equal(state.status, "refreshing");
  assert.equal(state.hash, replacementHash);
  assert.equal(state.replacement?.reason, "repriced");

  state = auctionTransactionReducer(state, { type: "confirmed" });
  assert.equal(state.status, "confirmed");
});

test("reset restores a retryable idle state", () => {
  const failed = auctionTransactionReducer(initialAuctionTransactionState, {
    type: "failed",
    error: {
      kind: "receipt_reverted",
      message: "The transaction reverted onchain.",
      retryable: true,
      shouldRefresh: false,
    },
  });

  assert.equal(failed.status, "error");
  assert.deepEqual(
    auctionTransactionReducer(failed, { type: "reset" }),
    initialAuctionTransactionState,
  );
});
