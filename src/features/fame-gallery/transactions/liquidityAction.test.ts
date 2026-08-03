import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Hash } from "viem";
import {
  executeGalleryLiquidityAction,
  galleryLiquidityActionReducer,
  initialGalleryLiquidityActionState,
  isGalleryLiquidityActionBusy,
  isGalleryLiquidityActionTerminal,
  type GalleryLiquidityCall,
  type GalleryLiquidityEvent,
} from "./liquidityAction";

const account = "0x1111111111111111111111111111111111111111" as const;
const hash = `0x${"aa".repeat(32)}` as Hash;
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
});
