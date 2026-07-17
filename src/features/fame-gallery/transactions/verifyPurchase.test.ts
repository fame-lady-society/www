import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  encodeAbiParameters,
  encodeEventTopics,
  type Address,
  type Hash,
  type Hex,
} from "viem";
import {
  closedLoopGallerySwapAbi,
  fameMirrorAbi,
} from "../../../wagmi";
import type {
  GalleryPurchaseFingerprint,
  GalleryPurchaseReceipt,
  GalleryPurchaseSnapshot,
  GalleryTransactionLog,
} from "./purchaseQueue";
import { verifyGalleryPurchase } from "./verifyPurchase";

const gallery = "0x1111111111111111111111111111111111111111" as Address;
const mirror = "0x2222222222222222222222222222222222222222" as Address;
const buyer = "0x3333333333333333333333333333333333333333" as Address;
const recipient = "0x4444444444444444444444444444444444444444" as Address;
const laterOwner = "0x5555555555555555555555555555555555555555" as Address;
const zero = "0x0000000000000000000000000000000000000000" as Address;
const hash = `0x${"a".repeat(64)}` as Hash;
const laterHash = `0x${"b".repeat(64)}` as Hash;

function exactTopics(
  topics: ReturnType<typeof encodeEventTopics>,
): readonly Hex[] {
  return topics as unknown as readonly Hex[];
}

const fingerprint: GalleryPurchaseFingerprint = {
  chainId: 84_532,
  account: buyer,
  recipient,
  tokenId: 7n,
  unit: 1_000n,
  premium: 50n,
  total: 1_050n,
  allowanceTarget: gallery,
  fillCalldata: "0x1234",
};

const baseline: GalleryPurchaseSnapshot = {
  blockNumber: 100n,
  allowance: 1_050n,
  inventory: 10n,
  accruedProtocolFees: 20n,
  fingerprint,
};

function rawLog({
  address,
  topics,
  data = "0x",
  logIndex,
  transactionHash = hash,
  transactionIndex = 0,
}: {
  address: Address;
  topics: readonly Hex[];
  data?: Hex;
  logIndex: number;
  transactionHash?: Hash;
  transactionIndex?: number;
}): GalleryTransactionLog {
  return {
    address,
    topics,
    data,
    blockNumber: 101n,
    transactionHash,
    transactionIndex,
    logIndex,
  };
}

function mirrorTransfer({
  from,
  to,
  id,
  logIndex,
  transactionHash,
  transactionIndex,
}: {
  from: Address;
  to: Address;
  id: bigint;
  logIndex: number;
  transactionHash?: Hash;
  transactionIndex?: number;
}) {
  return rawLog({
    address: mirror,
    topics: exactTopics(
      encodeEventTopics({
        abi: fameMirrorAbi,
        eventName: "Transfer",
        args: { from, to, id },
      }),
    ),
    logIndex,
    transactionHash,
    transactionIndex,
  });
}

function unlisted(logIndex: number) {
  return rawLog({
    address: gallery,
    topics: exactTopics(
      encodeEventTopics({
        abi: closedLoopGallerySwapAbi,
        eventName: "Unlisted",
        args: { tokenId: 7n },
      }),
    ),
    logIndex,
  });
}

function filled({
  logIndex,
  eventRecipient = recipient,
  inventoryBefore = 10n,
  inventoryAfter = 11n,
}: {
  logIndex: number;
  eventRecipient?: Address;
  inventoryBefore?: bigint;
  inventoryAfter?: bigint;
}) {
  return rawLog({
    address: gallery,
    topics: exactTopics(
      encodeEventTopics({
        abi: closedLoopGallerySwapAbi,
        eventName: "Filled",
        args: {
          buyer,
          recipient: eventRecipient,
          tokenId: 7n,
        },
      }),
    ),
    data: encodeAbiParameters(
      [
        { type: "uint256", name: "unitAmount" },
        { type: "uint256", name: "premium" },
        { type: "uint256", name: "inventoryBefore" },
        { type: "uint256", name: "inventoryAfter" },
      ],
      [1_000n, 50n, inventoryBefore, inventoryAfter],
    ),
    logIndex,
  });
}

function withdrawn({
  amount,
  logIndex,
}: {
  amount: bigint;
  logIndex: number;
}) {
  return rawLog({
    address: gallery,
    topics: exactTopics(
      encodeEventTopics({
        abi: closedLoopGallerySwapAbi,
        eventName: "AccruedFeesWithdrawn",
        args: { to: buyer },
      }),
    ),
    data: encodeAbiParameters(
      [
        { type: "uint256", name: "amount" },
        { type: "uint256", name: "inventoryBefore" },
        { type: "uint256", name: "inventoryAfter" },
      ],
      [amount, 11n, 11n],
    ),
    logIndex,
    transactionHash: laterHash,
    transactionIndex: 1,
  });
}

function purchaseLogs() {
  return [
    mirrorTransfer({ from: zero, to: gallery, id: 99n, logIndex: 1 }),
    mirrorTransfer({ from: zero, to: gallery, id: 100n, logIndex: 2 }),
    mirrorTransfer({
      from: gallery,
      to: recipient,
      id: 7n,
      logIndex: 3,
    }),
    unlisted(4),
    filled({ logIndex: 5 }),
  ];
}

function receipt(
  logs: readonly GalleryTransactionLog[] = purchaseLogs(),
): GalleryPurchaseReceipt {
  return {
    status: "success",
    blockNumber: 101n,
    transactionHash: hash,
    logs,
  };
}

describe("gallery purchase verification", () => {
  it("verifies ordered receipt proof and receipt-block contract state", async () => {
    const logs = purchaseLogs();
    const result = await verifyGalleryPurchase({
      receipt: receipt(logs),
      expectedHash: hash,
      fingerprint,
      preFillSnapshot: baseline,
      addresses: { gallery, mirror },
      dependencies: {
        async readReceiptBlockState() {
          return {
            owner: recipient,
            listingActive: false,
            inventory: 11n,
            accruedProtocolFees: 70n,
          };
        },
        async readReconciliationLogs() {
          return logs;
        },
        async readTokenUri() {
          return "data:application/json;base64,e30=";
        },
      },
    });

    assert.equal(result.status, "verified");
    if (result.status !== "verified") return;
    assert.equal(result.acquiredNft.tokenId, 7n);
    assert.equal(result.acquiredNft.recipient, recipient);
    assert.equal(result.acquiredNft.total, 1_050n);
    assert.equal(result.acquiredNft.currentOwner, recipient);
    assert.equal(result.acquiredNft.listingActive, false);
  });

  it("rejects a receipt with the wrong recipient or duplicate Filled event", async () => {
    const wrongRecipient = [
      ...purchaseLogs().slice(0, -1),
      filled({ logIndex: 5, eventRecipient: laterOwner }),
    ];
    const duplicate = [...purchaseLogs(), filled({ logIndex: 6 })];
    const dependencies = {
      async readReceiptBlockState() {
        throw new Error("should not read");
      },
      async readReconciliationLogs() {
        throw new Error("should not read");
      },
      async readTokenUri() {
        throw new Error("should not read");
      },
    };

    const wrong = await verifyGalleryPurchase({
      receipt: receipt(wrongRecipient),
      expectedHash: hash,
      fingerprint,
      preFillSnapshot: baseline,
      addresses: { gallery, mirror },
      dependencies,
    });
    const doubled = await verifyGalleryPurchase({
      receipt: receipt(duplicate),
      expectedHash: hash,
      fingerprint,
      preFillSnapshot: baseline,
      addresses: { gallery, mirror },
      dependencies,
    });

    assert.equal(wrong.status, "confirmed_unverified");
    assert.equal(doubled.status, "confirmed_unverified");
  });

  it("reconciles a later same-block transfer and fee withdrawal", async () => {
    const logs = [
      ...purchaseLogs(),
      mirrorTransfer({
        from: recipient,
        to: laterOwner,
        id: 7n,
        logIndex: 0,
        transactionHash: laterHash,
        transactionIndex: 1,
      }),
      withdrawn({ amount: 50n, logIndex: 1 }),
    ];
    const result = await verifyGalleryPurchase({
      receipt: receipt(purchaseLogs()),
      expectedHash: hash,
      fingerprint,
      preFillSnapshot: baseline,
      addresses: { gallery, mirror },
      dependencies: {
        async readReceiptBlockState() {
          return {
            owner: laterOwner,
            listingActive: false,
            inventory: 11n,
            accruedProtocolFees: 20n,
          };
        },
        async readReconciliationLogs() {
          return logs;
        },
        async readTokenUri() {
          return "metadata";
        },
      },
    });

    assert.equal(result.status, "verified");
    if (result.status === "verified") {
      assert.equal(result.acquiredNft.recipient, recipient);
      assert.equal(result.acquiredNft.currentOwner, laterOwner);
      assert.equal(result.acquiredNft.receiptBlockAccruedFees, 20n);
    }
  });

  it("keeps metadata failure independent from acquisition verification", async () => {
    const logs = purchaseLogs();
    const result = await verifyGalleryPurchase({
      receipt: receipt(logs),
      expectedHash: hash,
      fingerprint,
      preFillSnapshot: baseline,
      addresses: { gallery, mirror },
      dependencies: {
        async readReceiptBlockState() {
          return {
            owner: recipient,
            listingActive: false,
            inventory: 11n,
            accruedProtocolFees: 70n,
          };
        },
        async readReconciliationLogs() {
          return logs;
        },
        async readTokenUri() {
          throw new Error("metadata unavailable");
        },
      },
    });

    assert.equal(result.status, "verified");
    if (result.status === "verified") {
      assert.equal(result.acquiredNft.tokenUri, null);
    }
  });

  it("remains confirmed and refreshing when receipt-block reads fail", async () => {
    const result = await verifyGalleryPurchase({
      receipt: receipt(),
      expectedHash: hash,
      fingerprint,
      preFillSnapshot: baseline,
      addresses: { gallery, mirror },
      dependencies: {
        async readReceiptBlockState() {
          throw new Error("archive read unavailable");
        },
        async readReconciliationLogs() {
          return purchaseLogs();
        },
        async readTokenUri() {
          return "metadata";
        },
      },
    });

    assert.equal(result.status, "confirmed_refreshing");
  });
});
