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
      "wait purchase 1",
      "verify",
      "refresh",
    ]);
  });

  it("passes the exact simulation requests to both wagmi writes", async () => {
    const test = harness([0n, 1_025n]);
    await executeGalleryPurchase({ terms, dependencies: test.dependencies });

    const written = test.written();
    assert.strictEqual(written.writtenApproval, test.approvalRequest);
    assert.strictEqual(written.writtenPurchase, test.purchaseRequest);
  });

  for (const visibleAtDepth of [1, 2, 3] as const) {
    it(`continues when approval becomes visible at depth ${visibleAtDepth}`, async () => {
      const test = harness([
        0n,
        ...Array.from({ length: visibleAtDepth - 1 }, () => 0n),
        1_025n,
      ]);
      const result = await executeGalleryPurchase({
        terms,
        dependencies: test.dependencies,
      });

      assert.equal(result.status, "verified");
      assert.equal(
        test.calls.filter((call) => call.startsWith("wait approval")).length,
        visibleAtDepth,
      );
    });
  }

  it("stops after depth three without simulating a purchase", async () => {
    const test = harness([0n, 0n, 0n, 0n]);
    const result = await executeGalleryPurchase({
      terms,
      dependencies: test.dependencies,
    });

    assert.deepEqual(result.status, "failed");
    assert.equal(result.status === "failed" && result.stage, "allowance");
    assert.ok(!test.calls.includes("simulate purchase"));
  });

  it("resolves fulfillment only after the confirmed approval is visible", async () => {
    const test = harness([0n, 1_025n]);
    await executeGalleryPurchase({ terms, dependencies: test.dependencies });

    assert.ok(
      test.calls.indexOf("resolve:false") >
        test.calls.indexOf("wait approval 1"),
    );
  });

  it("a retry rechecks allowance and does not repeat a sufficient approval", async () => {
    const first = harness([0n, 1_025n]);
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

  it("verification failure unlocks through the normal error state and shows no result", async () => {
    const test = harness([1_025n]);
    test.dependencies.verifyPurchase = async () => ({
      status: "confirmed_unverified",
      reason: "receipt mismatch",
    });
    const result = await executeGalleryPurchase({
      terms,
      dependencies: test.dependencies,
    });
    const state = test.events.reduce(
      galleryPurchaseReducer,
      initialGalleryPurchaseState,
    );

    assert.equal(result.status, "failed");
    assert.equal(state.status, "error");
    assert.equal(state.acquisition, null);
  });
});
