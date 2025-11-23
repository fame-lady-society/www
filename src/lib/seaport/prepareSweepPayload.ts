import type { FulfillmentDataResponse, Listing } from "opensea-js";
import {
  AdvancedOrder,
  AdvancedOrderNoSignature,
  buildAdvancedOrder,
  extractEthAmount,
} from "./buildAdvancedOrders";
import { Address, isHex } from "viem";

async function fetchFulfillmentData(receiver: Address, listing: Listing) {
  const qp = new URLSearchParams({
    address: receiver,
    token_id:
      listing.protocol_data.parameters.offer[0].identifierOrCriteria.toString(),
    order_hash: listing.order_hash,
    protocol_address: listing.protocol_address,
  });
  const response = await fetch(`/api/society-fulfillment?` + qp.toString());
  const data = await response.json();
  return data as FulfillmentDataResponse;
}

export async function prepareSweepPayload(
  receiver: Address,
  listings: Listing[],
) {
  if (!listings || listings.length === 0) {
    throw new Error("No listings provided");
  }

  const advancedOrdersNoSig: AdvancedOrderNoSignature[] = [];
  const tokenIds: bigint[] = [];
  const ethAmounts: bigint[] = [];
  let totalPrice = 0n;
  let conduitKey: `0x${string}` | null = null;

  for (const l of listings) {
    const a = buildAdvancedOrder(l);
    advancedOrdersNoSig.push(a);
    // token id from offer[0].identifierOrCriteria
    const tokenId = a.parameters.offer[0].identifierOrCriteria;
    tokenIds.push(tokenId);
    const eth = extractEthAmount(l);
    ethAmounts.push(eth);
    totalPrice += eth;
    const ck = a.parameters.conduitKey;
    if (!conduitKey) conduitKey = ck;
    else if (conduitKey !== ck) {
      throw new Error("Mixed conduit keys not supported");
    }
  }

  const fulfillmentDataPromises = listings.map((l) =>
    fetchFulfillmentData(receiver, l),
  );
  const fulfillmentDatas = await Promise.all(fulfillmentDataPromises);

  const advancedOrders: AdvancedOrder[] = advancedOrdersNoSig.map((ao, i) => {
    const fd = fulfillmentDatas[i];
    if (!fd || !fd.fulfillment_data) {
      throw new Error("Missing fulfillment data from OpenSea");
    }
    const signature = fd.fulfillment_data.orders[0].signature;
    if (!isHex(signature)) {
      throw new Error("Invalid signature from OpenSea");
    }
    return {
      ...ao,
      signature,
    };
  });

  return {
    advancedOrders,
    tokenIds,
    ethAmounts,
    fulfillerConduitKey: (conduitKey || "0x" + "0".repeat(64)) as `0x${string}`,
    totalPrice,
  };
}
