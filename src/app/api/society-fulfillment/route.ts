import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { FulfillmentDataResponse } from "opensea-js";
import { fameLadySquadAddress, saveLadyProxyAddress } from "@/wagmi";
import { mainnet } from "viem/chains";

const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY;

export async function GET(request: NextRequest) {
  try {
    // get order_hash,token_id and address from query params
    const { searchParams } = new URL(request.url);
    const protocolAddress = searchParams.get("protocol_address");
    const orderHash = searchParams.get("order_hash");
    const tokenId = searchParams.get("token_id");
    const address = searchParams.get("address");

    // validate params
    if (!orderHash || !tokenId || !address || !protocolAddress) {
      return NextResponse.json(
        { error: "Missing required query parameters" },
        { status: 400 },
      );
    }

    const url = "https://api.opensea.io/api/v2/listings/fulfillment_data";
    const fulfillmentDataRequestBody = {
      listing: {
        hash: orderHash,
        protocol_address: protocolAddress,
        chain: "ethereum",
      },
      fulfiller: {
        address,
      },
      consideration: {
        asset_contract_address: fameLadySquadAddress[mainnet.id],
        token_id: tokenId,
      },
      recipient: saveLadyProxyAddress[mainnet.id],
    };

    const res = await fetch(url, {
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        ...(OPENSEA_API_KEY ? { "x-api-key": OPENSEA_API_KEY } : {}),
      },
      next: { revalidate: 10 }, // cache for 10 seconds
      body: JSON.stringify(fulfillmentDataRequestBody),
      method: "POST",
    });
    if (!res.ok) {
      // propagate original status & message
      const errorText = await res.text();
      console.error(`Opensea API error: ${res.status} - ${errorText}`);
      return NextResponse.json(
        { error: `Opensea API error ${res.status}`, details: errorText },
        { status: res.status },
      );
    }
    const fulfillments: FulfillmentDataResponse = await res.json();
    return NextResponse.json(fulfillments, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
