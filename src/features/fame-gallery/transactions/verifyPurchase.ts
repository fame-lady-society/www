import {
  decodeEventLog,
  isAddress as isViemAddress,
  type Address,
  type Hash,
  type Hex,
} from "viem";
import { closedLoopGallerySwapAbi, fameMirrorAbi } from "../../../wagmi";
import type {
  GalleryAcquiredNft,
  GalleryPurchaseFingerprint,
  GalleryPurchaseReceipt,
  GalleryPurchaseSnapshot,
  GalleryTransactionLog,
} from "./purchaseQueue";

export type GalleryPurchaseVerificationAddresses = {
  gallery: Address;
  mirror: Address;
};

export type GalleryReceiptBlockState = {
  owner: Address;
  listingActive: boolean;
  inventory: bigint;
  accruedProtocolFees: bigint;
};

export type GalleryPurchaseReceiptProof = {
  transactionHash: Hash;
  blockNumber: bigint;
  buyer: Address;
  recipient: Address;
  tokenId: bigint;
  unit: bigint;
  premium: bigint;
  inventoryBefore: bigint;
  inventoryAfter: bigint;
  transferLogIndex: number;
  unlistedLogIndex: number;
  filledLogIndex: number;
};

export type GalleryPurchaseVerificationResult =
  | { status: "verified"; acquiredNft: GalleryAcquiredNft }
  | { status: "confirmed_refreshing"; cause: unknown }
  | { status: "confirmed_unverified"; reason: string };

export type GalleryPurchaseVerificationDependencies = {
  readReceiptBlockState: (
    blockNumber: bigint,
    tokenId: bigint,
  ) => Promise<GalleryReceiptBlockState>;
  readReconciliationLogs: (
    fromBlock: bigint,
    toBlock: bigint,
  ) => Promise<readonly GalleryTransactionLog[]>;
  readTokenUri: (blockNumber: bigint, tokenId: bigint) => Promise<string>;
};

type DecodedLog = {
  log: GalleryTransactionLog;
  eventName: string;
  args: Record<string, unknown>;
};

function sameAddress(left: Address, right: Address) {
  return left.toLowerCase() === right.toLowerCase();
}

function isAddress(value: unknown): value is Address {
  return typeof value === "string" && isViemAddress(value, { strict: false });
}

function asBigint(value: unknown) {
  return typeof value === "bigint" ? value : null;
}

function decodeLog(
  log: GalleryTransactionLog,
  abi: readonly unknown[],
): DecodedLog | null {
  if (log.topics.length === 0) return null;
  try {
    const decoded = decodeEventLog({
      abi,
      data: log.data,
      topics: log.topics as [Hex, ...Hex[]],
      strict: true,
    }) as {
      eventName: string;
      args: Record<string, unknown>;
    };
    return { log, eventName: decoded.eventName, args: decoded.args };
  } catch {
    return null;
  }
}

function decodedAtAddress(
  logs: readonly GalleryTransactionLog[],
  address: Address,
  abi: readonly unknown[],
) {
  return logs
    .filter((log) => sameAddress(log.address, address))
    .map((log) => decodeLog(log, abi))
    .filter((log): log is DecodedLog => log !== null);
}

function unverified(reason: string): GalleryPurchaseVerificationResult {
  return { status: "confirmed_unverified", reason };
}

export function decodeGalleryPurchaseReceiptProof({
  receipt,
  expectedHash,
  fingerprint,
  preFillSnapshot,
  addresses,
}: {
  receipt: GalleryPurchaseReceipt;
  expectedHash: Hash;
  fingerprint: GalleryPurchaseFingerprint;
  preFillSnapshot: GalleryPurchaseSnapshot;
  addresses: GalleryPurchaseVerificationAddresses;
}):
  | { status: "proof"; proof: GalleryPurchaseReceiptProof }
  | { status: "confirmed_unverified"; reason: string } {
  if (
    receipt.status !== "success" ||
    receipt.transactionHash !== expectedHash ||
    typeof receipt.blockNumber !== "bigint" ||
    !receipt.logs
  ) {
    return {
      status: "confirmed_unverified",
      reason:
        "The mined fill receipt is incomplete or does not match its canonical hash.",
    };
  }

  const galleryEvents = decodedAtAddress(
    receipt.logs,
    addresses.gallery,
    closedLoopGallerySwapAbi,
  );
  const filledEvents = galleryEvents.filter(
    (event) => event.eventName === "Filled",
  );
  if (filledEvents.length !== 1) {
    return {
      status: "confirmed_unverified",
      reason: "The receipt must contain exactly one gallery Filled event.",
    };
  }

  const filled = filledEvents[0];
  const buyer = filled.args.buyer;
  const recipient = filled.args.recipient;
  const tokenId = asBigint(filled.args.tokenId);
  const unit = asBigint(filled.args.unitAmount);
  const premium = asBigint(filled.args.premium);
  const inventoryBefore = asBigint(filled.args.inventoryBefore);
  const inventoryAfter = asBigint(filled.args.inventoryAfter);
  if (
    !isAddress(buyer) ||
    !isAddress(recipient) ||
    tokenId === null ||
    unit === null ||
    premium === null ||
    inventoryBefore === null ||
    inventoryAfter === null ||
    !sameAddress(buyer, fingerprint.account) ||
    !sameAddress(recipient, fingerprint.recipient) ||
    tokenId !== fingerprint.tokenId ||
    unit !== fingerprint.unit ||
    premium !== fingerprint.premium ||
    unit + premium !== fingerprint.total ||
    inventoryAfter < inventoryBefore
  ) {
    return {
      status: "confirmed_unverified",
      reason: "The Filled event does not match the frozen purchase facts.",
    };
  }

  const unlisted = galleryEvents.filter(
    (event) =>
      event.eventName === "Unlisted" &&
      asBigint(event.args.tokenId) === fingerprint.tokenId &&
      event.log.logIndex < filled.log.logIndex,
  );
  if (unlisted.length !== 1) {
    return {
      status: "confirmed_unverified",
      reason: "The receipt is missing the matching preceding Unlisted event.",
    };
  }

  const mirrorEvents = decodedAtAddress(
    receipt.logs,
    addresses.mirror,
    fameMirrorAbi,
  );
  const transfers = mirrorEvents.filter(
    (event) =>
      event.eventName === "Transfer" &&
      isAddress(event.args.from) &&
      isAddress(event.args.to) &&
      sameAddress(event.args.from, addresses.gallery) &&
      sameAddress(event.args.to, fingerprint.recipient) &&
      asBigint(event.args.id) === fingerprint.tokenId &&
      event.log.logIndex < filled.log.logIndex,
  );
  if (transfers.length !== 1) {
    return {
      status: "confirmed_unverified",
      reason:
        "The receipt is missing the matching gallery-to-recipient mirror Transfer.",
    };
  }

  return {
    status: "proof",
    proof: {
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      buyer,
      recipient,
      tokenId,
      unit,
      premium,
      inventoryBefore,
      inventoryAfter,
      transferLogIndex: transfers[0].log.logIndex,
      unlistedLogIndex: unlisted[0].log.logIndex,
      filledLogIndex: filled.log.logIndex,
    },
  };
}

function compareLogs(
  left: GalleryTransactionLog,
  right: GalleryTransactionLog,
) {
  const block = (left.blockNumber ?? 0n) - (right.blockNumber ?? 0n);
  if (block !== 0n) return block < 0n ? -1 : 1;
  const transaction =
    (left.transactionIndex ?? 0) - (right.transactionIndex ?? 0);
  if (transaction !== 0) return transaction;
  return left.logIndex - right.logIndex;
}

function isProofLog(
  event: DecodedLog,
  proof: GalleryPurchaseReceiptProof,
  eventName: string,
  logIndex: number,
) {
  return (
    event.eventName === eventName &&
    event.log.transactionHash === proof.transactionHash &&
    event.log.logIndex === logIndex
  );
}

export function reconcileGalleryPurchase({
  proof,
  fingerprint,
  preFillSnapshot,
  receiptBlockState,
  logs,
  tokenUri,
  addresses,
}: {
  proof: GalleryPurchaseReceiptProof;
  fingerprint: GalleryPurchaseFingerprint;
  preFillSnapshot: GalleryPurchaseSnapshot;
  receiptBlockState: GalleryReceiptBlockState;
  logs: readonly GalleryTransactionLog[];
  tokenUri: string | null;
  addresses: GalleryPurchaseVerificationAddresses;
}): GalleryPurchaseVerificationResult {
  const ordered = [...logs].sort(compareLogs);
  let inventory = preFillSnapshot.inventory;
  let accruedFees = preFillSnapshot.accruedProtocolFees;
  let targetTransactionStarted = false;
  let targetTransferSeen = false;
  let targetFillSeen = false;
  let expectedOwner: Address | null = null;
  let expectedListingActive = false;

  for (const log of ordered) {
    if (
      log.transactionHash === proof.transactionHash &&
      !targetTransactionStarted
    ) {
      if (inventory !== proof.inventoryBefore) {
        return unverified(
          "The receipt inventory-before value does not reconcile from the pre-fill baseline.",
        );
      }
      targetTransactionStarted = true;
    }

    const mirrorEvent = sameAddress(log.address, addresses.mirror)
      ? decodeLog(log, fameMirrorAbi)
      : null;
    if (mirrorEvent?.eventName === "Transfer") {
      const from = mirrorEvent.args.from;
      const to = mirrorEvent.args.to;
      const tokenId = asBigint(mirrorEvent.args.id);
      if (!isAddress(from) || !isAddress(to) || tokenId === null) {
        return unverified(
          "A mirror Transfer in the reconciliation range is malformed.",
        );
      }

      if (isProofLog(mirrorEvent, proof, "Transfer", proof.transferLogIndex)) {
        targetTransferSeen = true;
      }

      if (
        sameAddress(from, addresses.gallery) &&
        !sameAddress(to, addresses.gallery)
      ) {
        if (inventory === 0n) {
          return unverified("Gallery inventory reconciliation underflowed.");
        }
        inventory -= 1n;
      } else if (
        !sameAddress(from, addresses.gallery) &&
        sameAddress(to, addresses.gallery)
      ) {
        inventory += 1n;
      }

      if (targetTransferSeen && tokenId === fingerprint.tokenId) {
        expectedOwner = to;
      }
    }

    const galleryEvent = sameAddress(log.address, addresses.gallery)
      ? decodeLog(log, closedLoopGallerySwapAbi)
      : null;
    if (!galleryEvent) continue;

    if (galleryEvent.eventName === "Filled") {
      const eventPremium = asBigint(galleryEvent.args.premium);
      if (eventPremium === null) {
        return unverified(
          "A Filled event in the reconciliation range is malformed.",
        );
      }
      accruedFees += eventPremium;
      if (isProofLog(galleryEvent, proof, "Filled", proof.filledLogIndex)) {
        if (!targetTransferSeen || inventory !== proof.inventoryAfter) {
          return unverified(
            "The target fill inventory does not reconcile with its ordered mirror transfer.",
          );
        }
        targetFillSeen = true;
        expectedListingActive = false;
      } else if (
        targetFillSeen &&
        asBigint(galleryEvent.args.tokenId) === fingerprint.tokenId
      ) {
        expectedListingActive = false;
      }
    } else if (galleryEvent.eventName === "AccruedFeesWithdrawn") {
      const amount = asBigint(galleryEvent.args.amount);
      if (amount === null || amount > accruedFees) {
        return unverified("Accrued fee reconciliation is malformed.");
      }
      accruedFees -= amount;
    } else if (
      targetFillSeen &&
      asBigint(galleryEvent.args.tokenId) === fingerprint.tokenId
    ) {
      if (galleryEvent.eventName === "Listed") {
        expectedListingActive = true;
      } else if (galleryEvent.eventName === "Unlisted") {
        expectedListingActive = false;
      }
    }
  }

  if (!targetTransferSeen || !targetFillSeen || !expectedOwner) {
    return unverified(
      "The canonical block logs do not contain the ordered purchase proof.",
    );
  }
  if (
    inventory !== receiptBlockState.inventory ||
    accruedFees !== receiptBlockState.accruedProtocolFees ||
    !sameAddress(expectedOwner, receiptBlockState.owner) ||
    expectedListingActive !== receiptBlockState.listingActive
  ) {
    return unverified(
      "Receipt-block ownership, listing, inventory, or fees do not reconcile with ordered events.",
    );
  }

  return {
    status: "verified",
    acquiredNft: {
      transactionHash: proof.transactionHash,
      receiptBlockNumber: proof.blockNumber,
      buyer: proof.buyer,
      recipient: proof.recipient,
      tokenId: proof.tokenId,
      unit: proof.unit,
      premium: proof.premium,
      total: proof.unit + proof.premium,
      inventoryBefore: proof.inventoryBefore,
      inventoryAfter: proof.inventoryAfter,
      receiptBlockInventory: receiptBlockState.inventory,
      receiptBlockAccruedFees: receiptBlockState.accruedProtocolFees,
      currentOwner: receiptBlockState.owner,
      listingActive: receiptBlockState.listingActive,
      tokenUri,
    },
  };
}

export async function verifyGalleryPurchase({
  receipt,
  expectedHash,
  fingerprint,
  preFillSnapshot,
  addresses,
  dependencies,
}: {
  receipt: GalleryPurchaseReceipt;
  expectedHash: Hash;
  fingerprint: GalleryPurchaseFingerprint;
  preFillSnapshot: GalleryPurchaseSnapshot;
  addresses: GalleryPurchaseVerificationAddresses;
  dependencies: GalleryPurchaseVerificationDependencies;
}): Promise<GalleryPurchaseVerificationResult> {
  const decoded = decodeGalleryPurchaseReceiptProof({
    receipt,
    expectedHash,
    fingerprint,
    preFillSnapshot,
    addresses,
  });
  if (decoded.status === "confirmed_unverified") return decoded;
  if (decoded.proof.blockNumber <= preFillSnapshot.blockNumber) {
    return unverified(
      "The fill receipt block does not follow the pre-fill baseline.",
    );
  }

  try {
    const [receiptBlockState, logs, tokenUri] = await Promise.all([
      dependencies.readReceiptBlockState(
        decoded.proof.blockNumber,
        fingerprint.tokenId,
      ),
      dependencies.readReconciliationLogs(
        preFillSnapshot.blockNumber + 1n,
        decoded.proof.blockNumber,
      ),
      dependencies
        .readTokenUri(decoded.proof.blockNumber, fingerprint.tokenId)
        .catch(() => null),
    ]);

    return reconcileGalleryPurchase({
      proof: decoded.proof,
      fingerprint,
      preFillSnapshot,
      receiptBlockState,
      logs,
      tokenUri,
      addresses,
    });
  } catch (cause) {
    return { status: "confirmed_refreshing", cause };
  }
}
