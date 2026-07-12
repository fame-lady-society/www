import assert from "node:assert/strict";
import test from "node:test";
import type { Address, Hash } from "viem";
import {
  buildAuctionTransactionRequest,
  executeAuctionTransaction,
} from "./useAuctionTransaction";
import type { AuctionTransactionEvent } from "../transactionState";

const auction = "0x6536A328419785212BD4DA43F4E5155af60dB7D2";
const bidder = "0x00000000000000000000000000000000000000B1";
const hash = `0x${"1".repeat(64)}` as Hash;
const replacementHash = `0x${"2".repeat(64)}` as Hash;

test("builds an exact native ETH bid with no approval request", () => {
  const request = buildAuctionTransactionRequest({
    action: "bid",
    auctionAddress: auction,
    account: bidder,
    value: 1_234_567_890n,
  });

  assert.equal(request.functionName, "bid");
  assert.equal(request.value, 1_234_567_890n);
  assert.equal("args" in request, false);
  assert.equal(
    JSON.stringify(request, (_, value) =>
      typeof value === "bigint" ? value.toString() : value,
    )
      .toLowerCase()
      .includes("approval"),
    false,
  );
});

test("settlement has no value-bearing or token-approval path", () => {
  const request = buildAuctionTransactionRequest({
    action: "settle",
    auctionAddress: auction,
    account: bidder,
  });

  assert.equal(request.functionName, "settle");
  assert.equal("value" in request, false);
});

test("simulates, submits, confirms, then refreshes before confirmed state", async () => {
  const events: AuctionTransactionEvent[] = [];
  const order: string[] = [];
  const request = buildAuctionTransactionRequest({
    action: "bid",
    auctionAddress: auction,
    account: bidder,
    value: 10n,
  });

  const result = await executeAuctionTransaction(request, {
    dispatch: (event) => events.push(event),
    simulate: async (exactRequest) => {
      order.push("simulate");
      if (exactRequest.functionName !== "bid") throw new Error("expected bid");
      assert.equal(exactRequest.value, 10n);
      return exactRequest;
    },
    write: async (simulatedRequest) => {
      order.push("write");
      if (simulatedRequest.functionName !== "bid") {
        throw new Error("expected bid");
      }
      assert.equal(simulatedRequest.value, 10n);
      return hash;
    },
    wait: async () => {
      order.push("wait");
      return { status: "success" };
    },
    refresh: async () => {
      order.push("refresh");
    },
  });

  assert.deepEqual(order, ["simulate", "write", "wait", "refresh"]);
  assert.equal(result.status, "confirmed");
  assert.equal(events.at(-2)?.type, "refreshing");
  assert.equal(events.at(-1)?.type, "confirmed");
});

test("BidTooLow preserves caller-owned input and refreshes the threshold", async () => {
  const events: AuctionTransactionEvent[] = [];
  let refreshes = 0;
  const request = buildAuctionTransactionRequest({
    action: "bid",
    auctionAddress: auction,
    account: bidder,
    value: 10n,
  });

  const result = await executeAuctionTransaction(request, {
    dispatch: (event) => events.push(event),
    simulate: async () => {
      throw { data: { errorName: "BidTooLow" } };
    },
    write: async () => hash,
    wait: async () => ({ status: "success" }),
    refresh: async () => {
      refreshes += 1;
    },
  });

  assert.equal(result.status, "failed");
  assert.equal(result.error.kind, "bid_too_low");
  assert.equal(refreshes, 1);
  assert.equal(events.at(-1)?.type, "failed");
});

test("SettlementUnavailable refreshes and can resolve to settled canonical state", async () => {
  let canonicalState: "active" | "settled" = "active";
  const request = buildAuctionTransactionRequest({
    action: "settle",
    auctionAddress: auction,
    account: bidder,
  });

  const result = await executeAuctionTransaction(request, {
    dispatch: () => undefined,
    simulate: async () => {
      throw new Error("SettlementUnavailable");
    },
    write: async () => hash,
    wait: async () => ({ status: "success" }),
    refresh: async () => {
      canonicalState = "settled";
    },
    isActionResolved: () => canonicalState === "settled",
  });

  assert.deepEqual(result, { status: "resolved_by_refresh" });
});

test("receipt revert and cancelled replacement are distinct failures", async () => {
  const request = buildAuctionTransactionRequest({
    action: "settle",
    auctionAddress: auction,
    account: bidder,
  });
  const baseDeps = {
    dispatch: () => undefined,
    simulate: async () => request,
    write: async () => hash,
    refresh: async () => undefined,
  };

  const reverted = await executeAuctionTransaction(request, {
    ...baseDeps,
    wait: async () => ({ status: "reverted" }),
  });
  assert.equal(reverted.status, "failed");
  assert.equal(reverted.error.kind, "receipt_reverted");

  const cancelled = await executeAuctionTransaction(request, {
    ...baseDeps,
    wait: async (_hash, onReplaced) => {
      onReplaced({ reason: "cancelled", hash: replacementHash });
      return { status: "success" };
    },
  });
  assert.equal(cancelled.status, "failed");
  assert.equal(cancelled.error.kind, "replacement_cancelled");
});

test("a reverted settlement resolves when canonical state is already settled", async () => {
  const request = buildAuctionTransactionRequest({
    action: "settle",
    auctionAddress: auction,
    account: bidder,
  });

  const result = await executeAuctionTransaction(request, {
    dispatch: () => undefined,
    simulate: async () => request,
    write: async () => hash,
    wait: async () => ({ status: "reverted" }),
    refresh: async () => undefined,
    isActionResolved: () => true,
  });

  assert.deepEqual(result, { status: "resolved_by_refresh" });
});

test("a calldata replacement never masquerades as confirmation", async () => {
  const request = buildAuctionTransactionRequest({
    action: "bid",
    auctionAddress: auction,
    account: bidder,
    value: 10n,
  });

  const result = await executeAuctionTransaction(request, {
    dispatch: () => undefined,
    simulate: async () => request,
    write: async () => hash,
    wait: async (_hash, onReplaced) => {
      onReplaced({ reason: "replaced", hash: replacementHash });
      return { status: "success" };
    },
    refresh: async () => undefined,
  });

  assert.equal(result.status, "failed");
  assert.equal(result.error.kind, "replacement_replaced");
});

test("a confirmed receipt with failed canonical refresh stays unresolved", async () => {
  const events: AuctionTransactionEvent[] = [];
  const request = buildAuctionTransactionRequest({
    action: "bid",
    auctionAddress: auction,
    account: bidder,
    value: 10n,
  });

  const result = await executeAuctionTransaction(request, {
    dispatch: (event) => events.push(event),
    simulate: async () => request,
    write: async () => hash,
    wait: async () => ({ status: "success" }),
    refresh: async () => {
      throw new Error("RPC unavailable");
    },
  });

  assert.equal(result.status, "failed");
  assert.equal(result.error.kind, "refresh_failure");
  assert.equal(events.at(-1)?.type, "failed");
  assert.equal(
    events.some((event) => event.type === "confirmed"),
    false,
  );
});

test("repriced replacement confirms only after canonical refresh", async () => {
  const events: AuctionTransactionEvent[] = [];
  const request = buildAuctionTransactionRequest({
    action: "settle",
    auctionAddress: auction,
    account: bidder,
  });

  const result = await executeAuctionTransaction(request, {
    dispatch: (event) => events.push(event),
    simulate: async () => request,
    write: async () => hash,
    wait: async (_hash, onReplaced) => {
      onReplaced({ reason: "repriced", hash: replacementHash });
      return { status: "success" };
    },
    refresh: async () => undefined,
  });

  assert.equal(result.status, "confirmed");
  assert.equal(
    events.some(
      (event) => event.type === "replaced" && event.hash === replacementHash,
    ),
    true,
  );
  assert.equal(events.at(-1)?.type, "confirmed");
});
