import {
  decodeEventLog,
  encodeEventTopics,
  isAddress,
  isAddressEqual,
  type Address,
  type Hash,
  type Hex,
} from "viem";
import { fameMirrorAbi, universalPoolArtMarketplaceAbi } from "../../../wagmi";
import type {
  GalleryFrozenBuyerTerms,
  GalleryFulfillmentRoute,
  GalleryVerifiedAcquisition,
} from "../types";

export type GalleryReceiptLog = {
  address: Address;
  data: Hex;
  topics: readonly Hex[];
  logIndex: number;
};

export type GalleryPurchaseReceipt = {
  status: "success" | "reverted";
  blockNumber?: bigint;
  transactionHash?: Hash;
  logs?: readonly GalleryReceiptLog[];
};

export type GalleryPurchaseVerificationAddresses = {
  marketplace: Address;
  mirror: Address;
};

export type GalleryPurchaseVerificationDependencies = {
  readOwnerAt: (shellId: bigint) => Promise<Address>;
  readArtworkHash: (shellId: bigint) => Promise<Hash>;
};

export type GalleryPurchaseVerificationResult =
  | { status: "verified"; acquisition: GalleryVerifiedAcquisition }
  | {
      status: "confirmed_unverified";
      reason: string;
      cause?: unknown;
    };

type DecodedEvent = {
  eventName: string;
  args: Record<string, unknown>;
};

const artworkPurchasedTopic = encodeEventTopics({
  abi: universalPoolArtMarketplaceAbi,
  eventName: "ArtworkPurchased",
})[0];

const mirrorTransferTopic = encodeEventTopics({
  abi: fameMirrorAbi,
  eventName: "Transfer",
})[0];

function sameHex(left: string, right: string) {
  return left.toLowerCase() === right.toLowerCase();
}

function asAddress(value: unknown): Address | null {
  return typeof value === "string" && isAddress(value, { strict: false })
    ? value
    : null;
}

function asBigint(value: unknown) {
  return typeof value === "bigint" ? value : null;
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isSafeInteger(value)) return value;
  if (
    typeof value === "bigint" &&
    value >= 0n &&
    value <= BigInt(Number.MAX_SAFE_INTEGER)
  ) {
    return Number(value);
  }
  return null;
}

function asHash(value: unknown): Hash | null {
  return typeof value === "string" && /^0x[0-9a-fA-F]{64}$/.test(value)
    ? (value as Hash)
    : null;
}

function decodeStrictEvent(
  log: GalleryReceiptLog,
  abi: readonly unknown[],
): DecodedEvent | null {
  if (log.topics.length === 0) return null;

  try {
    return decodeEventLog({
      abi,
      data: log.data,
      topics: log.topics as [Hex, ...Hex[]],
      strict: true,
    }) as DecodedEvent;
  } catch {
    return null;
  }
}

function matchingTopicLogs(
  logs: readonly GalleryReceiptLog[],
  emitter: Address,
  topic: Hex,
) {
  return logs.filter(
    (log) =>
      isAddressEqual(log.address, emitter) &&
      typeof log.topics[0] === "string" &&
      sameHex(log.topics[0], topic),
  );
}

function unverified(
  reason: string,
  cause?: unknown,
): GalleryPurchaseVerificationResult {
  return cause === undefined
    ? { status: "confirmed_unverified", reason }
    : { status: "confirmed_unverified", reason, cause };
}

function expectedRouteFacts(route: GalleryFulfillmentRoute) {
  if (route.kind === "held") {
    return {
      path: 0,
      sourceId: 0n,
      affectedTokenIds: [route.shellId] as readonly bigint[],
    };
  }

  return {
    path: route.poolKind === "mint" ? 1 : 2,
    sourceId: route.sourceId,
    affectedTokenIds: [route.shellId, route.sourceId] as readonly bigint[],
  };
}

export async function verifyGalleryPurchase({
  receipt,
  expectedHash,
  terms,
  route,
  addresses,
  dependencies,
}: {
  receipt: GalleryPurchaseReceipt;
  expectedHash: Hash;
  terms: GalleryFrozenBuyerTerms;
  route: GalleryFulfillmentRoute;
  addresses: GalleryPurchaseVerificationAddresses;
  dependencies: GalleryPurchaseVerificationDependencies;
}): Promise<GalleryPurchaseVerificationResult> {
  if (
    receipt.status !== "success" ||
    typeof receipt.transactionHash !== "string" ||
    !sameHex(receipt.transactionHash, expectedHash) ||
    typeof receipt.blockNumber !== "bigint" ||
    !Array.isArray(receipt.logs)
  ) {
    return unverified(
      "The purchase receipt is incomplete or does not match its transaction.",
    );
  }

  const purchaseLogs = matchingTopicLogs(
    receipt.logs,
    addresses.marketplace,
    artworkPurchasedTopic,
  );
  if (purchaseLogs.length !== 1) {
    return unverified(
      "The receipt must contain exactly one marketplace ArtworkPurchased event.",
    );
  }

  const purchase = decodeStrictEvent(
    purchaseLogs[0],
    universalPoolArtMarketplaceAbi,
  );
  if (!purchase || purchase.eventName !== "ArtworkPurchased") {
    return unverified("The marketplace ArtworkPurchased event is malformed.");
  }

  const buyer = asAddress(purchase.args.buyer);
  const recipient = asAddress(purchase.args.recipient);
  const shellId = asBigint(purchase.args.shellId);
  const path = asNumber(purchase.args.path);
  const sourceId = asBigint(purchase.args.sourceId);
  const artwork = asHash(purchase.args.artwork);
  const unit = asBigint(purchase.args.unitAmount);
  const premium = asBigint(purchase.args.premiumAmount);
  const inventoryBefore = asBigint(purchase.args.inventoryBefore);
  const inventoryAfter = asBigint(purchase.args.inventoryAfter);
  const expectedRoute = expectedRouteFacts(route);

  if (
    buyer === null ||
    recipient === null ||
    shellId === null ||
    path === null ||
    sourceId === null ||
    artwork === null ||
    unit === null ||
    premium === null ||
    inventoryBefore === null ||
    inventoryAfter === null ||
    !isAddressEqual(buyer, terms.account) ||
    !isAddressEqual(recipient, terms.recipient) ||
    shellId !== route.shellId ||
    path !== expectedRoute.path ||
    sourceId !== expectedRoute.sourceId ||
    !sameHex(artwork, terms.artworkHash) ||
    unit !== terms.unit ||
    premium > terms.maxPremium ||
    inventoryAfter < inventoryBefore
  ) {
    return unverified(
      "The ArtworkPurchased event does not match the submitted purchase.",
    );
  }

  const transferLogs = matchingTopicLogs(
    receipt.logs,
    addresses.mirror,
    mirrorTransferTopic,
  );
  const decodedTransfers: DecodedEvent[] = [];
  for (const log of transferLogs) {
    const decoded = decodeStrictEvent(log, fameMirrorAbi);
    if (!decoded || decoded.eventName !== "Transfer") {
      return unverified("A mirror Transfer event is malformed.");
    }
    decodedTransfers.push(decoded);
  }

  const matchingTransfers = decodedTransfers.filter((transfer) => {
    const from = asAddress(transfer.args.from);
    const to = asAddress(transfer.args.to);
    const id = asBigint(transfer.args.id);
    return (
      from !== null &&
      to !== null &&
      id !== null &&
      isAddressEqual(from, addresses.marketplace) &&
      isAddressEqual(to, terms.recipient) &&
      id === route.shellId
    );
  });
  if (matchingTransfers.length !== 1) {
    return unverified(
      "The receipt must contain exactly one matching marketplace-to-recipient mirror Transfer.",
    );
  }

  let currentOwner: unknown;
  let currentArtwork: unknown;
  try {
    [currentOwner, currentArtwork] = await Promise.all([
      dependencies.readOwnerAt(route.shellId),
      dependencies.readArtworkHash(route.shellId),
    ]);
  } catch (cause) {
    return unverified("Current purchase state could not be verified.", cause);
  }

  const verifiedOwner = asAddress(currentOwner);
  const verifiedArtwork = asHash(currentArtwork);
  if (
    verifiedOwner === null ||
    verifiedArtwork === null ||
    !isAddressEqual(verifiedOwner, terms.recipient) ||
    !sameHex(verifiedArtwork, terms.artworkHash)
  ) {
    const reason = "Current owner or artwork does not match the purchase.";
    return unverified(
      reason,
      Object.assign(new Error(reason), {
        expectedOwner: terms.recipient,
        observedOwner: currentOwner,
        expectedArtwork: terms.artworkHash,
        observedArtwork: currentArtwork,
      }),
    );
  }

  return {
    status: "verified",
    acquisition: {
      transactionHash: receipt.transactionHash,
      receiptBlockNumber: receipt.blockNumber,
      deliveredShellId: route.shellId,
      artworkHash: artwork,
      unit,
      premium,
      total: unit + premium,
      recipient,
      affectedTokenIds: expectedRoute.affectedTokenIds,
    },
  };
}
