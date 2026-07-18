import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Address, Hash, Hex } from "viem";
import {
  createGalleryPurchaseSubmissionGate,
  executeGalleryPurchase,
  galleryPurchaseReducer,
  initialGalleryPurchaseState,
  type GalleryPurchaseDependencies,
  type GalleryPurchaseEvent,
  type GalleryPurchaseFingerprint,
  type GalleryPurchaseSnapshot,
} from "./purchaseQueue";

const account = "0x1111111111111111111111111111111111111111" as Address;
const recipient = "0x2222222222222222222222222222222222222222" as Address;
const gallery = "0x3333333333333333333333333333333333333333" as Address;
const approvalHash = `0x${"a".repeat(64)}` as Hash;
const repricedApprovalHash = `0x${"b".repeat(64)}` as Hash;
const fillHash = `0x${"c".repeat(64)}` as Hash;

function fingerprint(overrides: Partial<GalleryPurchaseFingerprint> = {}) {
  return {
    chainId: 84_532,
    account,
    recipient,
    tokenId: 7n,
    unit: 1_000n,
    premium: 50n,
    total: 1_050n,
    allowanceTarget: gallery,
    fillCalldata: "0x1234" as Hex,
    ...overrides,
  };
}

function snapshot(
  allowance: bigint,
  overrides: Partial<GalleryPurchaseSnapshot> = {},
): GalleryPurchaseSnapshot {
  return {
    blockNumber: 100n,
    allowance,
    inventory: 4_000n,
    accruedProtocolFees: 300n,
    fingerprint: fingerprint(),
    ...overrides,
  };
}

function dependencyHarness({
  snapshots,
  chainId = 84_532,
}: {
  snapshots: GalleryPurchaseSnapshot[];
  chainId?: number;
}) {
  const events: GalleryPurchaseEvent[] = [];
  const calls: string[] = [];
  const remainingSnapshots = [...snapshots];
  let currentChainId = chainId;
  let approvalWaits = 0;
  let lastSnapshot: GalleryPurchaseSnapshot | null = null;

  const dependencies: GalleryPurchaseDependencies = {
    dispatch(event) {
      events.push(event);
    },
    async getWalletContext() {
      return { account, chainId: currentChainId };
    },
    async switchChain() {
      calls.push("switch");
      currentChainId = 84_532;
    },
    async captureSnapshot() {
      calls.push("snapshot");
      const next = remainingSnapshots.shift();
      if (!next) throw new Error("unexpected snapshot");
      lastSnapshot = next;
      return next;
    },
    async simulateApproval() {
      calls.push("simulate approval");
      return { request: "approval" };
    },
    async writeApproval() {
      calls.push("write approval");
      return approvalHash;
    },
    async simulateFill() {
      calls.push("simulate fill");
      if (
        lastSnapshot &&
        lastSnapshot.allowance < lastSnapshot.fingerprint.total
      ) {
        throw new Error("approval allowance is not visible");
      }
      return { request: "fill" };
    },
    async writeFill() {
      calls.push("write fill");
      return fillHash;
    },
    async waitForReceipt({ hash, confirmations, onReplaced }) {
      calls.push(
        `wait ${hash === fillHash ? "fill" : "approval"} ${confirmations}`,
      );
      if (hash === approvalHash && approvalWaits++ === 0) {
        onReplaced({ reason: "repriced", hash: repricedApprovalHash });
      }
      return { status: "success" };
    },
  };

  return { dependencies, events, calls };
}

describe("gallery purchase queue", () => {
  it("skips approval when current allowance covers the frozen exact total", async () => {
    const harness = dependencyHarness({
      snapshots: [snapshot(1_050n), snapshot(1_050n)],
    });

    const result = await executeGalleryPurchase(
      { tokenId: 7n, recipient, targetChainId: 84_532 },
      harness.dependencies,
    );

    assert.equal(result.status, "fill_receipt_confirmed");
    assert.equal(result.fillHash, fillHash);
    assert.equal(result.approvalHash, null);
    assert.deepEqual(harness.calls, [
      "snapshot",
      "snapshot",
      "simulate fill",
      "write fill",
      "wait fill 1",
    ]);
  });

  it("queues an exact approval, adopts a repriced hash, then fills automatically", async () => {
    const harness = dependencyHarness({
      snapshots: [
        snapshot(0n),
        snapshot(1_050n, { blockNumber: 102n }),
        snapshot(1_050n, { blockNumber: 103n }),
      ],
    });

    const result = await executeGalleryPurchase(
      { tokenId: 7n, recipient, targetChainId: 84_532 },
      harness.dependencies,
    );

    assert.equal(result.status, "fill_receipt_confirmed");
    assert.equal(result.approvalHash, repricedApprovalHash);
    assert.equal(result.fillHash, fillHash);
    assert.deepEqual(harness.calls, [
      "snapshot",
      "simulate approval",
      "write approval",
      "wait approval 1",
      "snapshot",
      "simulate fill",
      "snapshot",
      "simulate fill",
      "write fill",
      "wait fill 1",
    ]);
    assert.ok(
      harness.events.some(
        (event) =>
          event.type === "replacement" &&
          event.kind === "approval" &&
          event.hash === repricedApprovalHash,
      ),
    );
  });

  it("waits up to three blocks only while the confirmed approval remains unseen", async () => {
    const harness = dependencyHarness({
      snapshots: [
        snapshot(0n),
        snapshot(0n, { blockNumber: 101n }),
        snapshot(0n, { blockNumber: 102n }),
        snapshot(1_050n, { blockNumber: 103n }),
        snapshot(1_050n, { blockNumber: 104n }),
      ],
    });

    const result = await executeGalleryPurchase(
      { tokenId: 7n, recipient, targetChainId: 84_532 },
      harness.dependencies,
    );

    assert.equal(result.status, "fill_receipt_confirmed");
    assert.ok(harness.calls.includes("wait approval 2"));
    assert.ok(harness.calls.includes("wait approval 3"));
  });

  it("stops unresolved after depth three when fill simulation still cannot see approval", async () => {
    const harness = dependencyHarness({
      snapshots: [
        snapshot(0n),
        snapshot(0n, { blockNumber: 101n }),
        snapshot(0n, { blockNumber: 102n }),
        snapshot(0n, { blockNumber: 103n }),
      ],
    });

    const result = await executeGalleryPurchase(
      { tokenId: 7n, recipient, targetChainId: 84_532 },
      harness.dependencies,
    );

    assert.equal(result.status, "failed");
    assert.equal(result.stage, "simulation");
    assert.equal(
      harness.calls.filter((call) => call === "simulate fill").length,
      3,
    );
    assert.ok(!harness.calls.includes("write fill"));
  });

  it("stops before a later wallet request when the frozen premium changes", async () => {
    const harness = dependencyHarness({
      snapshots: [
        snapshot(0n),
        snapshot(1_150n, {
          fingerprint: fingerprint({ premium: 100n, total: 1_100n }),
        }),
      ],
    });

    const result = await executeGalleryPurchase(
      { tokenId: 7n, recipient, targetChainId: 84_532 },
      harness.dependencies,
    );

    assert.equal(result.status, "failed");
    assert.equal(result.stage, "context");
    assert.ok(!harness.calls.includes("write fill"));
  });

  it("does not resubmit after receipt lookup becomes unknown", async () => {
    const harness = dependencyHarness({
      snapshots: [snapshot(1_050n), snapshot(1_050n)],
    });
    harness.dependencies.waitForReceipt = async () => {
      throw new Error("receipt lookup unavailable");
    };

    const result = await executeGalleryPurchase(
      { tokenId: 7n, recipient, targetChainId: 84_532 },
      harness.dependencies,
    );

    assert.equal(result.status, "outcome_unknown");
    assert.equal(result.kind, "fill");
    assert.equal(
      harness.calls.filter((call) => call === "write fill").length,
      1,
    );
  });

  it("switches to Base Sepolia within the same one-button flow", async () => {
    const harness = dependencyHarness({
      chainId: 1,
      snapshots: [snapshot(1_050n), snapshot(1_050n)],
    });

    const result = await executeGalleryPurchase(
      { tokenId: 7n, recipient, targetChainId: 84_532 },
      harness.dependencies,
    );

    assert.equal(result.status, "fill_receipt_confirmed");
    assert.equal(harness.calls[0], "switch");
  });

  it("keeps only one route-wide submission active", async () => {
    const gate = createGalleryPurchaseSubmissionGate();
    let release!: () => void;
    const pending = gate.run(
      () =>
        new Promise<string>((resolve) => {
          release = () => resolve("done");
        }),
    );
    const blocked = await gate.run(async () => "second");

    assert.deepEqual(blocked, { status: "blocked" });
    release();
    assert.equal(await pending, "done");
    assert.equal(await gate.run(async () => "next"), "next");
  });

  it("retains approval and fill hashes as separate progress records", () => {
    const afterApproval = galleryPurchaseReducer(initialGalleryPurchaseState, {
      type: "broadcast",
      kind: "approval",
      hash: approvalHash,
    });
    const afterFill = galleryPurchaseReducer(afterApproval, {
      type: "broadcast",
      kind: "fill",
      hash: fillHash,
    });

    assert.equal(afterFill.approvalHash, approvalHash);
    assert.equal(afterFill.fillHash, fillHash);
  });
});
