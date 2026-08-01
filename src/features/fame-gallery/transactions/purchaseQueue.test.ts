import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Address, Hash } from "viem";
import type {
  GalleryFrozenBuyerTerms,
  GalleryFulfillmentRoute,
  GalleryVerifiedAcquisition,
} from "../types";
import {
  executeGalleryPurchase,
  galleryPurchaseReducer,
  initialGalleryPurchaseState,
  type GalleryPurchaseDependencies,
  type GalleryPurchaseEvent,
} from "./purchaseQueue";

const account = "0x1111111111111111111111111111111111111111" as Address;
const marketplace = "0x2222222222222222222222222222222222222222" as Address;
const artworkHash = `0x${"a".repeat(64)}` as Hash;
const approvalHash = `0x${"b".repeat(64)}` as Hash;
const purchaseHash = `0x${"c".repeat(64)}` as Hash;
const terms: GalleryFrozenBuyerTerms = Object.freeze({
  chainId: 84_532,
  account,
  recipient: account,
  selectedTarget: Object.freeze({ targetId: "pool:mint:7", tokenId: 7n }),
  artworkHash,
  unit: 1_000n,
  maxPremium: 25n,
  maximumSpend: 1_025n,
  allowanceTarget: marketplace,
});
const route: GalleryFulfillmentRoute = {
  kind: "pool",
  poolKind: "mint",
  shellId: 19n,
  sourceId: 7n,
};
const acquisition: GalleryVerifiedAcquisition = {
  transactionHash: purchaseHash,
  receiptBlockNumber: 500n,
  deliveredShellId: 19n,
  artworkHash,
  unit: 1_000n,
  premium: 20n,
  total: 1_020n,
  recipient: account,
  affectedTokenIds: [19n, 7n],
};

function harness(allowances: bigint[]) {
  const calls: string[] = [];
  const events: GalleryPurchaseEvent[] = [];
  const remaining = [...allowances];
  const approvalRequest = { kind: "approval" };
  const purchaseRequest = { kind: "purchase" };
  let writtenApproval: unknown;
  let writtenPurchase: unknown;
  const dependencies: GalleryPurchaseDependencies = {
    dispatch(event) {
      events.push(event);
    },
    async readAllowance() {
      calls.push("allowance");
      const value = remaining.shift();
      if (value === undefined) throw new Error("unexpected allowance read");
      return value;
    },
    async simulateApproval() {
      calls.push("simulate approval");
      return { request: approvalRequest };
    },
    async writeApproval(request) {
      calls.push("write approval");
      writtenApproval = request;
      return approvalHash;
    },
    async resolveFulfillment({ allowShellRecovery }) {
      calls.push(`resolve:${allowShellRecovery}`);
      return { route };
    },
    async simulatePurchase() {
      calls.push("simulate purchase");
      return { request: purchaseRequest };
    },
    async writePurchase(request) {
      calls.push("write purchase");
      writtenPurchase = request;
      return purchaseHash;
    },
    async waitForReceipt(hash, confirmations) {
      calls.push(
        `wait ${hash === approvalHash ? "approval" : "purchase"} ${confirmations}`,
      );
      return {
        status: "success",
        blockNumber: 500n,
        transactionHash: hash,
        logs: [],
      };
    },
    async verifyPurchase() {
      calls.push("verify");
      return { status: "verified", acquisition };
    },
    async refreshAfterPurchase() {
      calls.push("refresh");
    },
  };
  return {
    dependencies,
    calls,
    events,
    approvalRequest,
    purchaseRequest,
    written: () => ({ writtenApproval, writtenPurchase }),
  };
}

describe("gallery purchase queue", () => {
  it("reset clears frozen terms before a new purchase preflight", () => {
    const prior = galleryPurchaseReducer(initialGalleryPurchaseState, {
      type: "started",
      terms,
    });
    const reset = galleryPurchaseReducer(prior, { type: "reset" });
    const failed = galleryPurchaseReducer(reset, {
      type: "failed",
      stage: "switch_chain",
      cause: new Error("rejected"),
    });

    assert.equal(failed.terms, null);
    assert.equal(failed.status, "error");
  });

  it("skips approval when a fresh allowance covers the frozen maximum", async () => {
    const test = harness([1_025n]);
    const result = await executeGalleryPurchase({
      terms,
      dependencies: test.dependencies,
    });

    assert.equal(result.status, "verified");
    assert.deepEqual(test.calls, [
      "allowance",
      "resolve:false",
      "simulate purchase",
      "write purchase",
      "wait purchase 2",
      "verify",
      "refresh",
    ]);
  });

  it("stops before allowance or simulation when the selected balance is insufficient", async () => {
    const test = harness([1_025n]);
    test.dependencies.readBalance = async () => 1_024n;
    const result = await executeGalleryPurchase({
      terms,
      dependencies: test.dependencies,
    });

    assert.equal(result.status, "failed");
    assert.equal(result.status === "failed" ? result.stage : null, "balance");
    assert.deepEqual(test.calls, []);
  });

  it("waits for two purchase confirmations before verifying current state", async () => {
    const test = harness([1_025n]);
    await executeGalleryPurchase({ terms, dependencies: test.dependencies });

    assert.ok(test.calls.includes("wait purchase 2"));
    assert.ok(
      test.calls.indexOf("verify") > test.calls.indexOf("wait purchase 2"),
    );
  });

  it("passes the exact simulation requests to both wagmi writes", async () => {
    const test = harness([0n]);
    await executeGalleryPurchase({ terms, dependencies: test.dependencies });

    const written = test.written();
    assert.strictEqual(written.writtenApproval, test.approvalRequest);
    assert.strictEqual(written.writtenPurchase, test.purchaseRequest);
  });

  it("trusts a successful approval receipt without rereading allowance", async () => {
    const test = harness([0n]);
    const result = await executeGalleryPurchase({
      terms,
      dependencies: test.dependencies,
    });

    assert.equal(result.status, "verified");
    assert.equal(test.calls.filter((call) => call === "allowance").length, 1);
    assert.deepEqual(
      test.calls.filter((call) => call.startsWith("wait approval")),
      ["wait approval 2"],
    );
    assert.ok(
      test.calls.indexOf("resolve:false") >
        test.calls.indexOf("wait approval 2"),
    );
  });

  it("a retry rechecks allowance and does not repeat a sufficient approval", async () => {
    const first = harness([0n]);
    first.dependencies.resolveFulfillment = async () => {
      throw new Error("no shell");
    };
    const failed = await executeGalleryPurchase({
      terms,
      dependencies: first.dependencies,
    });
    assert.equal(failed.status, "failed");

    const retry = harness([1_025n]);
    await executeGalleryPurchase({
      terms,
      allowShellRecovery: true,
      dependencies: retry.dependencies,
    });
    assert.ok(!retry.calls.includes("simulate approval"));
    assert.ok(retry.calls.includes("resolve:true"));
  });

  it("does not resubmit after a wagmi receipt failure", async () => {
    const test = harness([1_025n]);
    test.dependencies.waitForReceipt = async () => {
      throw new Error("RPC unavailable");
    };
    const result = await executeGalleryPurchase({
      terms,
      dependencies: test.dependencies,
    });

    assert.equal(result.status, "failed");
    assert.equal(
      test.calls.filter((call) => call === "write purchase").length,
      1,
    );
  });

  it("uses the standard successful receipt for checkout without inventing a second proof", async () => {
    const test = harness([1_025n]);
    delete test.dependencies.verifyPurchase;
    test.dependencies.refreshAfterReceipt = async () => {
      test.calls.push("refresh receipt");
    };
    const result = await executeGalleryPurchase({
      terms,
      dependencies: test.dependencies,
    });
    const state = test.events.reduce(
      galleryPurchaseReducer,
      initialGalleryPurchaseState,
    );

    assert.deepEqual(result, { status: "verified", acquisition: null });
    assert.equal(state.status, "verified");
    assert.equal(state.acquisition, null);
    assert.ok(!test.calls.includes("verify"));
    assert.deepEqual(test.calls.slice(-2), [
      "wait purchase 2",
      "refresh receipt",
    ]);
  });

  it("keeps a mined purchase distinct from a retryable write failure", async () => {
    const test = harness([1_025n]);
    const archiveReadFailure = new Error("archive read unavailable");
    test.dependencies.verifyPurchase = async () => ({
      status: "confirmed_unverified",
      reason: "Current purchase state could not be verified.",
      cause: archiveReadFailure,
    });
    const result = await executeGalleryPurchase({
      terms,
      dependencies: test.dependencies,
    });
    const state = test.events.reduce(
      galleryPurchaseReducer,
      initialGalleryPurchaseState,
    );

    assert.equal(result.status, "confirmed_unverified");
    assert.equal(state.status, "confirmed_unverified");
    assert.equal(state.purchaseHash, purchaseHash);
    assert.equal(state.failure?.stage, "verification");
    assert.strictEqual(state.failure?.cause, archiveReadFailure);
    assert.equal(state.acquisition, null);
    assert.equal(
      test.calls.filter((call) => call === "write purchase").length,
      1,
    );
  });
});
