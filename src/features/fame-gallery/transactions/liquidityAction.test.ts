import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Hash } from "viem";
import {
  executeGalleryLiquidityAction,
  galleryLiquidityActionReducer,
  hasGalleryLiquidityStakeLegStarted,
  initialGalleryLiquidityActionState,
  isGalleryLiquidityActionBusy,
  isGalleryLiquidityActionTerminal,
  type GalleryLiquidityCall,
  type GalleryLiquidityEvent,
} from "./liquidityAction";

const account = "0x1111111111111111111111111111111111111111" as const;
const hash = `0x${"aa".repeat(32)}` as Hash;
const approvalHash = `0x${"bb".repeat(32)}` as Hash;
const call: GalleryLiquidityCall = {
  kind: "deposit",
  tokenIds: [1n, 2n],
};

describe("gallery liquidity action", () => {
  it("moves a simulated action through wallet, receipt, and refresh", async () => {
    const events: GalleryLiquidityEvent[] = [];
    const result = await executeGalleryLiquidityAction(call, 8_453, {
      dispatch: (event) => events.push(event),
      getWalletContext: () => ({ account, chainId: 8_453 }),
      switchChain: async () => undefined,
      simulate: async () => ({ request: true }),
      write: async () => hash,
      waitForReceipt: async () => ({ status: "success" }),
      refresh: async () => undefined,
    });

    assert.deepEqual(result, { status: "confirmed", hash });
    assert.deepEqual(
      events.map(({ type }) => type),
      ["started", "simulating", "wallet_requested", "broadcast", "confirmed"],
    );
  });

  it("continues from one approval confirmation directly into staking", async () => {
    const calls: string[] = [];
    const events: GalleryLiquidityEvent[] = [];
    const result = await executeGalleryLiquidityAction(call, 8_453, {
      dispatch: (event) => events.push(event),
      getWalletContext: () => ({ account, chainId: 8_453 }),
      switchChain: async () => undefined,
      approval: {
        isRequired: async () => {
          calls.push("read approval");
          return true;
        },
        simulate: async () => {
          calls.push("simulate approval");
          return { request: "approval" };
        },
        onConfirmed: async () => {
          calls.push("sync approval");
        },
      },
      simulate: async () => {
        calls.push("simulate stake");
        return { request: "stake" };
      },
      write: async (request) => {
        const kind = (request as { request: "approval" | "stake" }).request;
        calls.push(`write ${kind}`);
        return kind === "approval" ? approvalHash : hash;
      },
      waitForReceipt: async (submittedHash, confirmations) => {
        calls.push(
          `wait ${submittedHash === approvalHash ? "approval" : "stake"} ${confirmations}`,
        );
        return { status: "success" };
      },
      refresh: async () => {
        calls.push("refresh");
      },
    });

    assert.deepEqual(result, { status: "confirmed", hash });
    assert.deepEqual(calls, [
      "read approval",
      "simulate approval",
      "write approval",
      "wait approval 1",
      "sync approval",
      "simulate stake",
      "write stake",
      "wait stake 1",
      "refresh",
    ]);
    assert.deepEqual(
      events.map(({ type }) => type),
      [
        "started",
        "simulating_approval",
        "approval_requirement_resolved",
        "approval_wallet_requested",
        "approval_broadcast",
        "simulating",
        "wallet_requested",
        "broadcast",
        "confirmed",
      ],
    );
  });

  it("stops before staking when the approval receipt reverts", async () => {
    let stakeSimulated = false;
    const result = await executeGalleryLiquidityAction(call, 8_453, {
      dispatch: () => undefined,
      getWalletContext: () => ({ account, chainId: 8_453 }),
      switchChain: async () => undefined,
      approval: {
        isRequired: async () => true,
        simulate: async () => ({ request: "approval" }),
      },
      simulate: async () => {
        stakeSimulated = true;
        return { request: "stake" };
      },
      write: async () => approvalHash,
      waitForReceipt: async () => ({ status: "reverted" }),
      refresh: async () => undefined,
    });

    assert.equal(result.status, "failed");
    assert.equal(result.status === "failed" ? result.stage : null, "approval_receipt");
    assert.equal(stakeSimulated, false);
  });

  it("skips approval after a fresh approved read", async () => {
    const calls: string[] = [];
    await executeGalleryLiquidityAction(call, 8_453, {
      dispatch: () => undefined,
      getWalletContext: () => ({ account, chainId: 8_453 }),
      switchChain: async () => undefined,
      approval: {
        isRequired: async () => {
          calls.push("read approval");
          return false;
        },
        simulate: async () => {
          calls.push("simulate approval");
          return { request: "approval" };
        },
      },
      simulate: async () => {
        calls.push("simulate stake");
        return { request: "stake" };
      },
      write: async () => hash,
      waitForReceipt: async () => ({ status: "success" }),
      refresh: async () => undefined,
    });

    assert.deepEqual(calls, ["read approval", "simulate stake"]);
  });

  it("stops before staking when approval simulation fails", async () => {
    let stakeSimulated = false;
    const result = await executeGalleryLiquidityAction(call, 8_453, {
      dispatch: () => undefined,
      getWalletContext: () => ({ account, chainId: 8_453 }),
      switchChain: async () => undefined,
      approval: {
        isRequired: async () => true,
        simulate: async () => {
          throw new Error("approval simulation failed");
        },
      },
      simulate: async () => {
        stakeSimulated = true;
        return { request: "stake" };
      },
      write: async () => hash,
      waitForReceipt: async () => ({ status: "success" }),
      refresh: async () => undefined,
    });

    assert.equal(result.status, "failed");
    assert.equal(
      result.status === "failed" ? result.stage : null,
      "approval_simulation",
    );
    assert.equal(stakeSimulated, false);
  });

  it("stops before staking when the approval wallet rejects", async () => {
    let stakeSimulated = false;
    const result = await executeGalleryLiquidityAction(call, 8_453, {
      dispatch: () => undefined,
      getWalletContext: () => ({ account, chainId: 8_453 }),
      switchChain: async () => undefined,
      approval: {
        isRequired: async () => true,
        simulate: async () => ({ request: "approval" }),
      },
      simulate: async () => {
        stakeSimulated = true;
        return { request: "stake" };
      },
      write: async () => {
        throw new Error("wallet rejected approval");
      },
      waitForReceipt: async () => ({ status: "success" }),
      refresh: async () => undefined,
    });

    assert.equal(result.status, "failed");
    assert.equal(
      result.status === "failed" ? result.stage : null,
      "approval_wallet",
    );
    assert.equal(stakeSimulated, false);
  });

  it("switches chain before constructing the transaction request", async () => {
    let chainId = 1;
    const result = await executeGalleryLiquidityAction(call, 8_453, {
      dispatch: () => undefined,
      getWalletContext: () => ({ account, chainId }),
      switchChain: async (target) => {
        chainId = target;
      },
      simulate: async () => ({ request: true }),
      write: async () => hash,
      waitForReceipt: async () => ({ status: "success" }),
      refresh: async () => undefined,
    });
    assert.equal(result.status, "confirmed");
  });

  it("keeps a confirmed transaction legible when refresh fails", async () => {
    const result = await executeGalleryLiquidityAction(call, 8_453, {
      dispatch: () => undefined,
      getWalletContext: () => ({ account, chainId: 8_453 }),
      switchChain: async () => undefined,
      simulate: async () => ({ request: true }),
      write: async () => hash,
      waitForReceipt: async () => ({ status: "success" }),
      refresh: async () => {
        throw new Error("rpc refresh failed");
      },
    });
    assert.equal(result.status, "confirmed_refreshing");
  });

  it("fails at connection before simulation when no wallet is connected", async () => {
    let simulated = false;
    const result = await executeGalleryLiquidityAction(call, 8_453, {
      dispatch: () => undefined,
      getWalletContext: () => ({ account: null, chainId: undefined }),
      switchChain: async () => undefined,
      simulate: async () => {
        simulated = true;
        return { request: true };
      },
      write: async () => hash,
      waitForReceipt: async () => ({ status: "success" }),
      refresh: async () => undefined,
    });

    assert.equal(result.status, "failed");
    if (result.status !== "failed") return;
    assert.equal(result.stage, "connection");
    assert.equal(simulated, false);
  });

  it("reports an onchain revert at the receipt stage", async () => {
    const result = await executeGalleryLiquidityAction(call, 8_453, {
      dispatch: () => undefined,
      getWalletContext: () => ({ account, chainId: 8_453 }),
      switchChain: async () => undefined,
      simulate: async () => ({ request: true }),
      write: async () => hash,
      waitForReceipt: async () => ({ status: "reverted" }),
      refresh: async () => undefined,
    });

    assert.equal(result.status, "failed");
    if (result.status !== "failed") return;
    assert.equal(result.stage, "receipt");
    assert.match(String(result.cause), /reverted onchain/i);
  });

  it("marks active wallet work busy and terminal states unlocked", () => {
    const active = galleryLiquidityActionReducer(
      initialGalleryLiquidityActionState,
      { type: "started", call },
    );
    assert.equal(isGalleryLiquidityActionBusy(active), true);
    const confirmed = galleryLiquidityActionReducer(active, {
      type: "confirmed",
    });
    assert.equal(isGalleryLiquidityActionBusy(confirmed), false);
    assert.equal(isGalleryLiquidityActionTerminal(confirmed), true);
    assert.equal(isGalleryLiquidityActionTerminal(active), false);
  });

  it("does not expose an unstarted stake leg after approval failure", () => {
    const started = galleryLiquidityActionReducer(
      initialGalleryLiquidityActionState,
      { type: "started", call, approvalCheck: true },
    );
    const checking = galleryLiquidityActionReducer(started, {
      type: "simulating_approval",
    });
    const required = galleryLiquidityActionReducer(checking, {
      type: "approval_requirement_resolved",
      required: true,
    });
    const failed = galleryLiquidityActionReducer(required, {
      type: "failed",
      stage: "approval_wallet",
      cause: new Error("wallet rejected approval"),
    });

    assert.equal(hasGalleryLiquidityStakeLegStarted(failed), false);
    assert.equal(
      hasGalleryLiquidityStakeLegStarted(
        galleryLiquidityActionReducer(required, { type: "simulating" }),
      ),
      true,
    );
  });
});
