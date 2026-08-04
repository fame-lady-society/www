import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Hash, Hex } from "viem";
import {
  assertGalleryForkWalletIdentity,
  galleryRedemptionStateForStage,
  galleryRedemptionTransactions,
  invalidateGalleryRedemptionQueries,
  galleryRedemptionPrimaryAction,
  submitGalleryRedemptionApproval,
  submitGalleryRedemptionTransaction,
} from "./useGalleryRedemption";

const ORIGINAL_HASH = `0x${"1".repeat(64)}` as Hash;

describe("gallery redemption transaction hook helpers", () => {
  it("requires explicit approval and stops after one confirmation", async () => {
    const calls: string[] = [];
    const result = await submitGalleryRedemptionApproval({
      request: { functionName: "setApprovalForAll" },
      simulate: async (request) => {
        calls.push("simulate approval");
        return { request };
      },
      write: async () => {
        calls.push("write approval");
        return ORIGINAL_HASH;
      },
      waitForReceipt: async (_hash, confirmations) => {
        calls.push(`wait ${confirmations}`);
        return {
          transactionHash: ORIGINAL_HASH,
          blockNumber: 50n,
        };
      },
    });

    assert.deepEqual(calls, ["simulate approval", "write approval", "wait 1"]);
    assert.equal(result.transactionHash, ORIGINAL_HASH);
    assert.equal(
      galleryRedemptionPrimaryAction({ approved: false, quoteCurrent: true }),
      "approve",
    );
    assert.equal(
      galleryRedemptionPrimaryAction({ approved: true, quoteCurrent: true }),
      "review",
    );
  });

  it("uses one cached simulation while consent is unchanged", async () => {
    let simulations = 0;
    let writes = 0;
    const request = { functionName: "redeemSociety" };
    const result = await submitGalleryRedemptionTransaction({
      request,
      consentKey: "same-consent",
      cachedSimulation: { consentKey: "same-consent", request },
      simulate: async () => {
        simulations += 1;
        return { request };
      },
      write: async () => {
        writes += 1;
        return ORIGINAL_HASH;
      },
      waitForReceipt: async (_hash, confirmations) => ({
        transactionHash: ORIGINAL_HASH,
        blockNumber: BigInt(confirmations),
      }),
    });

    assert.equal(simulations, 0);
    assert.equal(writes, 1);
    assert.equal(result.simulation.consentKey, "same-consent");
  });

  it("surfaces wallet rejection and diagnostic simulation failure without retry", async () => {
    let writes = 0;
    await assert.rejects(
      submitGalleryRedemptionTransaction({
        request: {},
        consentKey: "fresh",
        cachedSimulation: null,
        simulate: async () => {
          throw new Error("execution reverted in simulation");
        },
        write: async () => {
          writes += 1;
          return ORIGINAL_HASH;
        },
        waitForReceipt: async () => {
          throw new Error("should not wait");
        },
      }),
      /execution reverted in simulation/u,
    );
    assert.equal(writes, 0);

    await assert.rejects(
      submitGalleryRedemptionTransaction({
        request: {},
        consentKey: "fresh",
        cachedSimulation: null,
        simulate: async (request) => ({ request }),
        write: async () => {
          writes += 1;
          throw new Error("User rejected the request");
        },
        waitForReceipt: async () => {
          throw new Error("should not wait");
        },
      }),
      /User rejected/u,
    );
    assert.equal(writes, 1);
  });

  it("delegates receipt and replacement semantics to the wagmi receipt waiter", async () => {
    await assert.rejects(
      submitGalleryRedemptionTransaction({
        request: {},
        consentKey: "fresh",
        cachedSimulation: null,
        simulate: async (request) => ({ request }),
        write: async () => ORIGINAL_HASH,
        waitForReceipt: async (_hash, confirmations) => {
          assert.equal(confirmations, 1);
          throw new Error("wagmi replacement receipt failed");
        },
      }),
      /wagmi replacement receipt failed/u,
    );
  });

  it("refreshes owned IDs, checkout balance, output balance, and quote after success", async () => {
    const refreshed: string[] = [];
    const result = await submitGalleryRedemptionTransaction({
      request: {},
      consentKey: "fresh",
      cachedSimulation: null,
      simulate: async (request) => ({ request }),
      write: async () => ORIGINAL_HASH,
      waitForReceipt: async () => ({
        transactionHash: ORIGINAL_HASH,
        blockNumber: 52n,
      }),
      refreshAfterSuccess: async () => {
        refreshed.push("owned", "checkout", "output", "quote");
      },
    });

    assert.equal(result.transactionHash, ORIGINAL_HASH);
    assert.deepEqual(refreshed, ["owned", "checkout", "output", "quote"]);
  });

  it("keeps transaction identity only after wagmi returns a hash", () => {
    const approvalAwaiting = galleryRedemptionStateForStage(
      "approval",
      "awaiting_wallet",
      { status: "idle" },
    );
    assert.deepEqual(galleryRedemptionTransactions(approvalAwaiting), []);

    const approvalConfirming = galleryRedemptionStateForStage(
      "approval",
      "confirming",
      {
        status: "awaiting_approval_wallet",
        operation: "approval",
        hash: ORIGINAL_HASH,
      },
    );
    assert.deepEqual(galleryRedemptionTransactions(approvalConfirming), [
      { kind: "NFT redemption approval", hash: ORIGINAL_HASH },
    ]);

    const redemptionSimulating = galleryRedemptionStateForStage(
      "redemption",
      "simulating",
      approvalConfirming,
    );
    assert.equal(redemptionSimulating.hash, undefined);
    const redemptionRefreshing = galleryRedemptionStateForStage(
      "redemption",
      "refreshing",
      {
        status: "confirming_redemption",
        operation: "redemption",
        hash: ORIGINAL_HASH,
      },
    );
    assert.deepEqual(galleryRedemptionTransactions(redemptionRefreshing), [
      { kind: "Society NFT redemption", hash: ORIGINAL_HASH },
    ]);
  });

  it("blocks writes when the wallet and app do not resolve the same fork checkout", async () => {
    const code = "0x6001600055" as Hex;
    await assert.doesNotReject(
      assertGalleryForkWalletIdentity({
        readAppCheckoutCode: async () => code,
        readWalletCheckoutCode: async () => code,
      }),
    );
    await assert.rejects(
      assertGalleryForkWalletIdentity({
        readAppCheckoutCode: async () => code,
        readWalletCheckoutCode: async () => "0x",
      }),
      /same local Base fork/u,
    );
    await assert.rejects(
      assertGalleryForkWalletIdentity({
        readAppCheckoutCode: async () => code,
        readWalletCheckoutCode: async () => "0x6002600055",
      }),
      /same local Base fork/u,
    );
  });

  it("invalidates the production ownership, quote, and balance query prefixes", async () => {
    const invalidated: unknown[] = [];
    await invalidateGalleryRedemptionQueries({
      invalidateQueries: async (filters: unknown) => {
        invalidated.push(filters);
      },
    } as never);

    assert.deepEqual(invalidated, [
      { queryKey: ["gallery-redemption-owned"] },
      { queryKey: ["gallery-redemption-quote"] },
      { queryKey: ["balance"] },
    ]);
  });
});
