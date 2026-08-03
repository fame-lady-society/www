import {
  decodeEventLog,
  encodeEventTopics,
  isAddress,
  isAddressEqual,
  type Address,
  type Hash,
  type Hex,
} from "viem";
import {
  fameMarketplaceCheckoutAbi,
  fameMirrorAbi,
  fameRouterAbi,
  universalPoolArtMarketplaceAbi,
} from "../../../wagmi";

export type GalleryPurchaseReceiptLog = {
  address: Address;
  data: Hex;
  topics: readonly Hex[];
};

export type GalleryPurchaseReceiptSource = {
  status: "success" | "reverted";
  transactionHash: Hash;
  blockNumber: bigint;
  logs: readonly GalleryPurchaseReceiptLog[];
};

export type GalleryCheckoutSettlement = {
  inputAsset: Address;
  routeHash: Hash;
  inputAmount: bigint;
  inputRefund: bigint;
  routerFameOutput: bigint;
  marketplaceFameCharge: bigint;
  fameRefund: bigint;
};

export type GalleryRouteSettlement = {
  schemaVersion: number;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  grossAmountOut: bigint;
  feeAmount: bigint;
  netAmountOut: bigint;
};

export type GalleryPurchaseReceiptProjection = {
  transactionHash: Hash;
  blockNumber: bigint;
  buyer: Address;
  recipient: Address;
  shellId: bigint;
  path: "held" | "mint" | "burn";
  sourceId: bigint | null;
  artworkHash: Hash;
  unit: bigint;
  premium: bigint;
  total: bigint;
  inventoryBefore: bigint;
  inventoryAfter: bigint;
  metadataUpdatedTokenIds: readonly bigint[];
  checkout: GalleryCheckoutSettlement | null;
  route: GalleryRouteSettlement | null;
};

type ProjectionAddresses = {
  marketplace: Address;
  mirror: Address;
  fame: Address;
  checkout: Address | null;
  router: Address | null;
};

type DecodedEvent = {
  eventName: string;
  args: Record<string, unknown>;
};

function eventTopic(abi: readonly unknown[], eventName: string) {
  const topic = encodeEventTopics({ abi, eventName })[0];
  if (!topic) throw new Error(`The ${eventName} event has no signature topic.`);
  return topic;
}

const artworkPurchasedTopic = eventTopic(
  universalPoolArtMarketplaceAbi,
  "ArtworkPurchased",
);
const mirrorTransferTopic = eventTopic(fameMirrorAbi, "Transfer");
const metadataUpdateTopic = eventTopic(fameMirrorAbi, "MetadataUpdate");
const checkoutSettledTopic = eventTopic(
  fameMarketplaceCheckoutAbi,
  "CheckoutSettled",
);
const routeExecutedTopic = eventTopic(fameRouterAbi, "RouteExecuted");

function sameHex(left: string, right: string) {
  return left.toLowerCase() === right.toLowerCase();
}

function matchingLogs(
  logs: readonly GalleryPurchaseReceiptLog[],
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

function decodeStrict(log: GalleryPurchaseReceiptLog, abi: readonly unknown[]) {
  try {
    return decodeEventLog({
      abi,
      data: log.data,
      topics: log.topics as [Hex, ...Hex[]],
      strict: true,
    }) as DecodedEvent;
  } catch (cause) {
    throw new Error("The purchase receipt contains a malformed event.", {
      cause,
    });
  }
}

function oneEvent(
  logs: readonly GalleryPurchaseReceiptLog[],
  emitter: Address,
  topic: Hex,
  abi: readonly unknown[],
  eventName: string,
) {
  const matches = matchingLogs(logs, emitter, topic);
  if (matches.length !== 1) {
    throw new Error(
      `Expected exactly one ${eventName} event, found ${matches.length}.`,
    );
  }
  const decoded = decodeStrict(matches[0], abi);
  if (decoded.eventName !== eventName) {
    throw new Error(`The ${eventName} event could not be decoded.`);
  }
  return decoded.args;
}

function address(value: unknown, label: string) {
  if (typeof value !== "string" || !isAddress(value, { strict: false })) {
    throw new Error(`The ${label} address is invalid.`);
  }
  return value as Address;
}

function bigint(value: unknown, label: string) {
  if (typeof value !== "bigint") {
    throw new Error(`The ${label} value is invalid.`);
  }
  return value;
}

function number(value: unknown, label: string) {
  if (typeof value === "number" && Number.isSafeInteger(value)) return value;
  if (
    typeof value === "bigint" &&
    value >= 0n &&
    value <= BigInt(Number.MAX_SAFE_INTEGER)
  ) {
    return Number(value);
  }
  throw new Error(`The ${label} value is invalid.`);
}

function hash(value: unknown, label: string) {
  if (typeof value !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(value)) {
    throw new Error(`The ${label} hash is invalid.`);
  }
  return value as Hash;
}

function pathFromOrdinal(value: number) {
  if (value === 0) return "held" as const;
  if (value === 1) return "mint" as const;
  if (value === 2) return "burn" as const;
  throw new Error(`The marketplace fulfillment path ${value} is unsupported.`);
}

function decodeMetadataUpdates(
  receipt: GalleryPurchaseReceiptSource,
  mirror: Address,
) {
  const ids = matchingLogs(receipt.logs, mirror, metadataUpdateTopic).map(
    (log) => {
      const event = decodeStrict(log, fameMirrorAbi);
      if (event.eventName !== "MetadataUpdate") {
        throw new Error("A mirror metadata update could not be decoded.");
      }
      return bigint(event.args._tokenId, "metadata token ID");
    },
  );
  return [...new Set(ids)];
}

export function projectGalleryPurchaseReceipt(
  receipt: GalleryPurchaseReceiptSource,
  addresses: ProjectionAddresses,
): GalleryPurchaseReceiptProjection {
  if (receipt.status !== "success") {
    throw new Error("This transaction reverted.");
  }

  const purchase = oneEvent(
    receipt.logs,
    addresses.marketplace,
    artworkPurchasedTopic,
    universalPoolArtMarketplaceAbi,
    "ArtworkPurchased",
  );
  const buyer = address(purchase.buyer, "buyer");
  const recipient = address(purchase.recipient, "recipient");
  const shellId = bigint(purchase.shellId, "shell token ID");
  const pathOrdinal = number(purchase.path, "fulfillment path");
  const path = pathFromOrdinal(pathOrdinal);
  const rawSourceId = bigint(purchase.sourceId, "source token ID");
  const sourceId = path === "held" ? null : rawSourceId;
  const unit = bigint(purchase.unitAmount, "marketplace unit");
  const premium = bigint(purchase.premiumAmount, "marketplace premium");
  const inventoryBefore = bigint(
    purchase.inventoryBefore,
    "inventory before purchase",
  );
  const inventoryAfter = bigint(
    purchase.inventoryAfter,
    "inventory after purchase",
  );

  if (path === "held" && rawSourceId !== 0n) {
    throw new Error("A held purchase unexpectedly names a source token.");
  }
  if (path !== "held" && rawSourceId === 0n) {
    throw new Error("A pool purchase is missing its source token.");
  }
  if (inventoryAfter < inventoryBefore) {
    throw new Error("The marketplace inventory event is inconsistent.");
  }

  const deliveryTransfers = matchingLogs(
    receipt.logs,
    addresses.mirror,
    mirrorTransferTopic,
  )
    .map((log) => decodeStrict(log, fameMirrorAbi))
    .filter((event) => {
      if (event.eventName !== "Transfer") return false;
      const from = address(event.args.from, "transfer sender");
      const to = address(event.args.to, "transfer recipient");
      const id = bigint(event.args.id, "transferred token ID");
      return (
        isAddressEqual(from, addresses.marketplace) &&
        isAddressEqual(to, recipient) &&
        id === shellId
      );
    });
  if (deliveryTransfers.length !== 1) {
    throw new Error(
      `Expected one marketplace delivery transfer, found ${deliveryTransfers.length}.`,
    );
  }

  let checkout: GalleryCheckoutSettlement | null = null;
  let route: GalleryRouteSettlement | null = null;
  if (addresses.checkout && addresses.router) {
    const checkoutLogs = matchingLogs(
      receipt.logs,
      addresses.checkout,
      checkoutSettledTopic,
    );
    if (checkoutLogs.length > 1) {
      throw new Error(
        "The transaction contains multiple checkout settlements.",
      );
    }
    if (checkoutLogs.length === 1) {
      const settlement = decodeStrict(
        checkoutLogs[0],
        fameMarketplaceCheckoutAbi,
      );
      if (settlement.eventName !== "CheckoutSettled") {
        throw new Error("The checkout settlement could not be decoded.");
      }
      const settlementPath = number(
        settlement.args.fulfillmentPath,
        "checkout fulfillment path",
      );
      const settlementShellId = bigint(
        settlement.args.shellId,
        "checkout shell token ID",
      );
      const settlementBuyer = address(settlement.args.buyer, "checkout buyer");
      if (
        settlementPath !== pathOrdinal ||
        settlementShellId !== shellId ||
        !isAddressEqual(settlementBuyer, buyer)
      ) {
        throw new Error(
          "The checkout settlement does not match the marketplace purchase.",
        );
      }
      checkout = {
        inputAsset: address(settlement.args.inputAsset, "checkout input asset"),
        routeHash: hash(settlement.args.routeHash, "checkout route"),
        inputAmount: bigint(settlement.args.inputAmount, "checkout input"),
        inputRefund: bigint(settlement.args.inputRefund, "checkout refund"),
        routerFameOutput: bigint(
          settlement.args.routerFameOutput,
          "router FAME output",
        ),
        marketplaceFameCharge: bigint(
          settlement.args.marketplaceFameCharge,
          "marketplace FAME charge",
        ),
        fameRefund: bigint(settlement.args.fameRefund, "FAME refund"),
      };
      if (
        checkout.inputRefund > checkout.inputAmount ||
        checkout.marketplaceFameCharge + checkout.fameRefund !==
          checkout.routerFameOutput
      ) {
        throw new Error("The checkout refund accounting is inconsistent.");
      }

      const routeEvent = oneEvent(
        receipt.logs,
        addresses.router,
        routeExecutedTopic,
        fameRouterAbi,
        "RouteExecuted",
      );
      const routeHash = hash(routeEvent.routeHash, "executed route");
      const tokenIn = address(routeEvent.tokenIn, "route input asset");
      const tokenOut = address(routeEvent.tokenOut, "route output asset");
      const amountIn = bigint(routeEvent.amountIn, "route input");
      const netAmountOut = bigint(routeEvent.netAmountOut, "route net output");
      if (
        !sameHex(routeHash, checkout.routeHash) ||
        !isAddressEqual(tokenIn, checkout.inputAsset) ||
        !isAddressEqual(tokenOut, addresses.fame) ||
        amountIn !== checkout.inputAmount ||
        netAmountOut !== checkout.routerFameOutput ||
        checkout.marketplaceFameCharge !== unit + premium
      ) {
        throw new Error(
          "The router execution does not match the checkout settlement.",
        );
      }
      const grossAmountOut = bigint(
        routeEvent.grossAmountOut,
        "route gross output",
      );
      const feeAmount = bigint(routeEvent.feeAmount, "route fee");
      if (grossAmountOut !== feeAmount + netAmountOut) {
        throw new Error("The router fee accounting is inconsistent.");
      }
      route = {
        schemaVersion: number(routeEvent.schemaVersion, "route schema version"),
        tokenIn,
        tokenOut,
        amountIn,
        grossAmountOut,
        feeAmount,
        netAmountOut,
      };
    }
  }

  return {
    transactionHash: receipt.transactionHash,
    blockNumber: receipt.blockNumber,
    buyer,
    recipient,
    shellId,
    path,
    sourceId,
    artworkHash: hash(purchase.artwork, "artwork"),
    unit,
    premium,
    total: unit + premium,
    inventoryBefore,
    inventoryAfter,
    metadataUpdatedTokenIds: decodeMetadataUpdates(receipt, addresses.mirror),
    checkout,
    route,
  };
}
