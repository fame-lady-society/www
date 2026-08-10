import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { QueryClient } from "@tanstack/react-query";
import type { Hash, Hex } from "viem";
import {
  assertGalleryForkWalletIdentity,
  cacheConfirmedGalleryRedemptionApproval,
  galleryRedemptionStateForStage,
  galleryRedemptionTransactions,
  invalidateGalleryRedemptionQueries,
  galleryRedemptionPrimaryAction,
  shouldPrepareGalleryRedemptionSimulation,
  submitGalleryRedemptionApproval,
  submitGalleryRedemptionApprovalFlow,
  submitGalleryRedemptionTransaction,
} from "./useGalleryRedemption";
import {
  cacheConfirmedGalleryRedemption,
  galleryRedemptionOwnedQueryKey,
} from "./useGalleryRedemptionOwnership";

const ORIGINAL_HASH = `0x${"1".repeat(64)}` as Hash;
const REDEMPTION_HASH = `0x${"2".repeat(64)}` as Hash;
const ACCOUNT = "0x1111111111111111111111111111111111111111";
const CHECKOUT = "0x2222222222222222222222222222222222222222";
const MIRROR = "0x3333333333333333333333333333333333333333";

describe("gallery redemption transaction hook helpers", () => {
  it("waits two extra blocks after approval before continuing", async () => {
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

    assert.deepEqual(calls, ["simulate approval", "write approval", "wait 3"]);
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

  it("publishes approval only after the receipt block exposes it on-chain", async () => {
    const calls: string[] = [];
    const queryClient = new QueryClient();
    await submitGalleryRedemptionApproval({
      request: { functionName: "setApprovalForAll" },
      simulate: async (request) => {
        calls.push("simulate");
        return { request };
      },
      write: async () => {
        calls.push("write");
        return ORIGINAL_HASH;
      },
      waitForReceipt: async () => {
        calls.push("receipt");
        return {
          transactionHash: ORIGINAL_HASH,
          blockNumber: 51n,
        };
      },
      onConfirmed: (receipt) =>
        cacheConfirmedGalleryRedemptionApproval(
          queryClient,
          {
            chainId: 8453,
            account: ACCOUNT,
            checkout: CHECKOUT,
            blockNumber: receipt.blockNumber,
          },
          async (blockNumber) => {
            calls.push(`read approval at ${blockNumber}`);
            return true;
          },
        ).then(() => {
          calls.push("publish approval");
        }),
    });

    assert.deepEqual(calls, [
      "simulate",
      "write",
      "receipt",
      "read approval at 51",
      "publish approval",
    ]);
    assert.equal(
      queryClient.getQueryData([
        "gallery-redemption-approval",
        8453,
        ACCOUNT,
        CHECKOUT,
      ]),
      true,
    );
  });

  it("continues from confirmed approval into one redemption submission", async () => {
    const calls: string[] = [];
    await submitGalleryRedemptionApprovalFlow({
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
        calls.push(`confirm approval after ${confirmations} blocks`);
        return { transactionHash: ORIGINAL_HASH, blockNumber: 51n };
      },
      onConfirmed: async () => {
        calls.push("verify approval on-chain");
      },
      continueToRedemption: async () => {
        await submitGalleryRedemptionTransaction({
          request: { functionName: "redeemSociety" },
          consentKey: "approved-burn",
          cachedSimulation: null,
          simulate: async (request) => {
            calls.push("simulate redemption");
            return { request };
          },
          write: async () => {
            calls.push("write redemption");
            return REDEMPTION_HASH;
          },
          waitForReceipt: async () => {
            calls.push("confirm redemption");
            return { transactionHash: REDEMPTION_HASH, blockNumber: 52n };
          },
        });
      },
    });

    assert.deepEqual(calls, [
      "simulate approval",
      "write approval",
      "confirm approval after 3 blocks",
      "verify approval on-chain",
      "simulate redemption",
      "write redemption",
      "confirm redemption",
    ]);
  });

  it("does not publish a receipt whose block lacks the approval", async () => {
    const queryClient = new QueryClient();
    await assert.rejects(
      cacheConfirmedGalleryRedemptionApproval(
        queryClient,
        {
          chainId: 8453,
          account: ACCOUNT,
          checkout: CHECKOUT,
          blockNumber: 51n,
        },
        async () => false,
      ),
      /not confirmed on-chain/u,
    );

    assert.equal(
      queryClient.getQueryData([
        "gallery-redemption-approval",
        8453,
        ACCOUNT,
        CHECKOUT,
      ]),
      undefined,
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
    const lifecycle: string[] = [];
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
      onConfirmed: () => {
        lifecycle.push("publish confirmed burn");
      },
      onStage: (stage) => {
        if (stage === "refreshing") lifecycle.push("refreshing");
      },
      refreshAfterSuccess: async () => {
        lifecycle.push("owned", "checkout", "output", "quote");
      },
    });

    assert.equal(result.transactionHash, ORIGINAL_HASH);
    assert.deepEqual(lifecycle, [
      "publish confirmed burn",
      "refreshing",
      "owned",
      "checkout",
      "output",
      "quote",
    ]);
  });

  it("removes a confirmed burn from the exact owned-NFT cache immediately", async () => {
    const queryClient = new QueryClient();
    const queryKey = galleryRedemptionOwnedQueryKey(
      8453,
      ACCOUNT,
      CHECKOUT,
      MIRROR,
    );
    queryClient.setQueryData(queryKey, {
      status: "ready",
      account: ACCOUNT,
      blockNumber: 50n,
      balance: 3n,
      tokenIds: [16n, 483n, 541n],
    });

    await cacheConfirmedGalleryRedemption(queryClient, {
      chainId: 8453,
      account: ACCOUNT,
      checkout: CHECKOUT,
      mirror: MIRROR,
      tokenIds: [483n],
      blockNumber: 51n,
    });

    assert.deepEqual(queryClient.getQueryData(queryKey), {
      status: "ready",
      account: ACCOUNT,
      blockNumber: 51n,
      balance: 2n,
      tokenIds: [16n, 541n],
    });
  });

  it("cancels a pre-receipt ownership read before publishing the burn", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const queryKey = galleryRedemptionOwnedQueryKey(
      8453,
      ACCOUNT,
      CHECKOUT,
      MIRROR,
    );
    const beforeBurn = {
      status: "ready" as const,
      account: ACCOUNT,
      blockNumber: 50n,
      balance: 1n,
      tokenIds: [483n],
    };
    queryClient.setQueryData(queryKey, beforeBurn);
    let resolveStaleRead!: (value: typeof beforeBurn) => void;
    const staleRead = queryClient
      .fetchQuery({
        queryKey,
        queryFn: () =>
          new Promise<typeof beforeBurn>((resolve) => {
            resolveStaleRead = resolve;
          }),
      })
      .catch(() => undefined);
    await Promise.resolve();

    await cacheConfirmedGalleryRedemption(queryClient, {
      chainId: 8453,
      account: ACCOUNT,
      checkout: CHECKOUT,
      mirror: MIRROR,
      tokenIds: [483n],
      blockNumber: 51n,
    });
    resolveStaleRead(beforeBurn);
    await staleRead;

    assert.deepEqual(queryClient.getQueryData(queryKey), {
      status: "ready",
      account: ACCOUNT,
      blockNumber: 51n,
      balance: 0n,
      tokenIds: [],
    });
  });

  it("does not simulate the submitted selection again after its quote changes", () => {
    assert.equal(
      shouldPrepareGalleryRedemptionSimulation({
        submittedSelectionKey: "USDC:483",
        selectionKey: "USDC:483",
      }),
      false,
    );
    assert.equal(
      shouldPrepareGalleryRedemptionSimulation({
        submittedSelectionKey: "USDC:483",
        selectionKey: "USDC:541",
      }),
      true,
    );
  });

  it("retains approval and redemption rows like the purchase modal", () => {
    const approvalAwaiting = galleryRedemptionStateForStage(
      "approval",
      "awaiting_wallet",
      { status: "idle" },
    );
    assert.deepEqual(galleryRedemptionTransactions(approvalAwaiting), [
      { kind: "NFT redemption approval" },
    ]);

    const approvalConfirming = galleryRedemptionStateForStage(
      "approval",
      "confirming",
      {
        status: "awaiting_approval_wallet",
        operation: "approval",
        approvalHash: ORIGINAL_HASH,
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
    assert.deepEqual(galleryRedemptionTransactions(redemptionSimulating), [
      { kind: "NFT redemption approval", hash: ORIGINAL_HASH },
      { kind: "Society NFT redemption" },
    ]);
    const redemptionRefreshing = galleryRedemptionStateForStage(
      "redemption",
      "refreshing",
      {
        status: "confirming_redemption",
        operation: "redemption",
        approvalHash: ORIGINAL_HASH,
        redemptionHash: REDEMPTION_HASH,
      },
    );
    assert.deepEqual(galleryRedemptionTransactions(redemptionRefreshing), [
      { kind: "NFT redemption approval", hash: ORIGINAL_HASH },
      { kind: "Society NFT redemption", hash: REDEMPTION_HASH },
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
      { queryKey: ["gallery-redemption-owned"], refetchType: "none" },
      { queryKey: ["gallery-redemption-quote"] },
      { queryKey: ["balance"] },
    ]);
  });
});
