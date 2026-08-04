import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { maxUint256, type Address, type Hash } from "viem";
import type { GalleryAdminCall } from "../types";
import {
  executeGalleryAdminAction,
  galleryAdminReducer,
  initialGalleryAdminState,
  parseGalleryFee,
  parseGalleryFeeRecipient,
  type GalleryAdminDependencies,
  type GalleryAdminEvent,
} from "./adminAction";

const account = "0x1111111111111111111111111111111111111111" as Address;
const recipient = "0x2222222222222222222222222222222222222222" as Address;
const hash = `0x${"a".repeat(64)}` as Hash;

describe("gallery admin actions", () => {
  it("parses ABI-safe fees and required address inputs", () => {
    const contractRejectedButAbiSafeFee = (
      (1n << 96n) / 10n ** 18n +
      1n
    ).toString();
    assert.equal(parseGalleryFee("0"), 0n);
    assert.equal(parseGalleryFee("1.25"), 1_250_000_000_000_000_000n);
    assert.equal(
      parseGalleryFee(contractRejectedButAbiSafeFee),
      BigInt(contractRejectedButAbiSafeFee) * 10n ** 18n,
    );
    assert.equal(parseGalleryFeeRecipient(recipient), recipient);

    for (const value of ["", "-1", "1e3", "1.2.3", "1.0000000000000000001"]) {
      assert.throws(() => parseGalleryFee(value));
    }
    assert.throws(() => parseGalleryFee(maxUint256.toString()));
    assert.throws(() => parseGalleryFeeRecipient(""));
    assert.throws(() => parseGalleryFeeRecipient("not an address"));
  });

  for (const call of [
    { kind: "set_community_fee", fee: 10n },
    { kind: "set_provider_fee", fee: 10n },
    { kind: "set_fee_recipient", feeRecipient: recipient },
    { kind: "pause" },
    { kind: "unpause" },
  ] satisfies GalleryAdminCall[]) {
    it(`simulates and submits the exact ${call.kind} request before refreshing`, async () => {
      const events: GalleryAdminEvent[] = [];
      const calls: unknown[] = [];
      const prepared = { request: call };
      const dependencies: GalleryAdminDependencies = {
        dispatch(event) {
          events.push(event);
        },
        getWalletContext() {
          return { account, chainId: 84_532 };
        },
        async switchChain() {
          calls.push("switch");
        },
        async simulate(exactCall) {
          calls.push(["simulate", exactCall]);
          return prepared;
        },
        async write(request) {
          calls.push(["write", request]);
          return hash;
        },
        async waitForReceipt(inputHash) {
          calls.push(["wait", inputHash, 1]);
          return { status: "success" };
        },
        async refresh(exactCall) {
          calls.push(["refresh", exactCall]);
        },
      };

      const result = await executeGalleryAdminAction(
        call,
        84_532,
        dependencies,
      );

      assert.deepEqual(result, { status: "confirmed", hash });
      assert.deepEqual(calls, [
        ["simulate", call],
        ["write", prepared],
        ["wait", hash, 1],
        ["refresh", call],
      ]);
      assert.equal(events.at(-1)?.type, "confirmed");
    });
  }

  it("keeps a mined action confirmed when the canonical reread fails", async () => {
    const events: GalleryAdminEvent[] = [];
    const refreshFailure = new Error("RPC unavailable");
    const dependencies: GalleryAdminDependencies = {
      dispatch(event) {
        events.push(event);
      },
      getWalletContext() {
        return { account, chainId: 84_532 };
      },
      async switchChain() {},
      async simulate() {
        return { request: "prepared" };
      },
      async write() {
        return hash;
      },
      async waitForReceipt() {
        return { status: "success" };
      },
      async refresh() {
        throw refreshFailure;
      },
    };

    const result = await executeGalleryAdminAction(
      { kind: "pause" },
      84_532,
      dependencies,
    );

    assert.deepEqual(result, {
      status: "confirmed_refreshing",
      hash,
      cause: refreshFailure,
    });
    assert.equal(events.at(-1)?.type, "confirmed_refreshing");
  });

  it("treats wagmi receipt errors as transaction errors without replacement handling", async () => {
    const receiptFailure = new Error("transaction replaced");
    const events: GalleryAdminEvent[] = [];
    const result = await executeGalleryAdminAction(
      { kind: "unpause" },
      84_532,
      {
        dispatch(event) {
          events.push(event);
        },
        getWalletContext() {
          return { account, chainId: 84_532 };
        },
        async switchChain() {},
        async simulate() {
          return { request: "prepared" };
        },
        async write() {
          return hash;
        },
        async waitForReceipt() {
          throw receiptFailure;
        },
        async refresh() {
          assert.fail("refresh must not run without a confirmed receipt");
        },
      },
    );

    assert.deepEqual(result, {
      status: "failed",
      stage: "receipt",
      cause: receiptFailure,
    });
    assert.equal(events.at(-1)?.type, "failed");
    assert.ok(
      !events.some((event) =>
        ["replacement", "outcome_unknown"].includes(event.type),
      ),
    );
  });

  it("keeps submitted values out of canonical state", () => {
    const started = galleryAdminReducer(initialGalleryAdminState, {
      type: "started",
      call: { kind: "set_provider_fee", fee: 25n },
    });

    assert.deepEqual(Object.keys(started).sort(), [
      "call",
      "failure",
      "hash",
      "status",
    ]);
    assert.equal(started.status, "simulating");
  });
});
