import type { Listing } from "opensea-js";
import { isAddress, isHex } from "viem";

export type OfferItem = {
  itemType: number;
  token: `0x${string}`;
  identifierOrCriteria: bigint;
  startAmount: bigint;
  endAmount: bigint;
};

export type ConsiderationItem = OfferItem & { recipient: `0x${string}` };

export type OrderParameters = {
  offerer: `0x${string}`;
  zone: `0x${string}`;
  offer: OfferItem[];
  consideration: ConsiderationItem[];
  orderType: number;
  startTime: bigint;
  endTime: bigint;
  zoneHash: `0x${string}`;
  salt: bigint;
  conduitKey: `0x${string}`;
  totalOriginalConsiderationItems: bigint;
};

export type AdvancedOrderNoSignature = {
  parameters: OrderParameters;
  numerator: bigint;
  denominator: bigint;
  signature: null;
  extraData: `0x${string}`;
};

export type AdvancedOrder = Omit<AdvancedOrderNoSignature, "signature"> & {
  signature: `0x${string}`;
};

// Build an AdvancedOrder from an OpenSea Listing. Will throw if unsupported.
export function buildAdvancedOrder(listing: Listing): AdvancedOrderNoSignature {
  const p = listing.protocol_data.parameters;
  // Basic guards
  if (!p.offer || p.offer.length !== 1) {
    throw new Error(
      "Unsupported bundle offer (only single-item offers supported)",
    );
  }
  const offerItem = p.offer[0];
  if (offerItem.itemType !== 2) {
    throw new Error("Only ERC721 offers supported");
  }

  const offer = p.offer.map((o) => ({
    itemType: o.itemType,
    token: o.token as `0x${string}`,
    identifierOrCriteria: BigInt(o.identifierOrCriteria),
    startAmount: BigInt(o.startAmount),
    endAmount: BigInt(o.endAmount),
  }));

  const consideration = p.consideration.map((c) => ({
    itemType: c.itemType,
    token: c.token as `0x${string}`,
    identifierOrCriteria: BigInt(c.identifierOrCriteria),
    startAmount: BigInt(c.startAmount),
    endAmount: BigInt(c.endAmount),
    recipient: c.recipient as `0x${string}`,
  }));

  if (!isAddress(p.offerer)) {
    throw new Error("Invalid offerer address");
  }
  if (!isHex(p.zone)) {
    throw new Error("Invalid zone address");
  }
  if (!isHex(p.zoneHash)) {
    throw new Error("Invalid zoneHash address");
  }
  if (!isHex(p.conduitKey)) {
    throw new Error("Invalid conduitKey address");
  }

  const params: OrderParameters = {
    offerer: p.offerer,
    zone: p.zone as `0x${string}`,
    offer,
    consideration,
    orderType: p.orderType,
    startTime: BigInt(p.startTime),
    endTime: BigInt(p.endTime),
    zoneHash: p.zoneHash as `0x${string}`,
    salt: BigInt(p.salt),
    conduitKey: p.conduitKey as `0x${string}`,
    totalOriginalConsiderationItems: BigInt(
      p.totalOriginalConsiderationItems || consideration.length,
    ),
  };

  return {
    parameters: params,
    numerator: 1n,
    denominator: 1n,
    signature: null,
    extraData: "0x",
  };
}

export function extractEthAmount(listing: Listing): bigint {
  const cons = listing.protocol_data.parameters.consideration as any[];
  let total = 0n;
  for (const c of cons) {
    if (c.itemType !== 0) {
      throw new Error("Non-ETH consideration not supported");
    }
    if (c.token !== "0x0000000000000000000000000000000000000000") {
      throw new Error("ETH token address must be zero");
    }
    total += BigInt(c.startAmount);
  }
  return total;
}
