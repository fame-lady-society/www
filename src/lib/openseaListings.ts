import type { GetListingsResponse } from "opensea-js";

const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY;

export async function fetchListings(
  slug: string,
  next?: string,
): Promise<GetListingsResponse> {
  const qp = new URLSearchParams({ limit: "50" });
  if (next) qp.append("cursor", next);
  const url = `https://api.opensea.io/api/v2/listings/collection/${slug}/all?${qp.toString()}`;
  const res = await fetch(url, {
    headers: {
      accept: "application/json",
      ...(OPENSEA_API_KEY ? { "x-api-key": OPENSEA_API_KEY } : {}),
    },
    // Server util: control revalidation upstream when used in route/page
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Opensea API error: ${res.status} - ${errorText}`);
    throw new Error(`Opensea API error: ${res.status}`);
  }
  const data: GetListingsResponse = await res.json();
  // Keep only ETH-priced listings
  data.listings = data.listings.filter(
    (l) => l.price?.current?.currency === "ETH",
  );
  // Filter out duplicate listings by token id (ERC721/1155 in offer), preferring the cheapest by current price
  const uniqueListingsMap: Record<string, (typeof data.listings)[0]> = {};
  for (const listing of data.listings) {
    // In a sell listing, the NFT(s) are in offer[] and payment tokens in consideration[]
    const nftOffer = listing.protocol_data.parameters.offer.find((o) => {
      // ItemType enum mapping: 2 = ERC721, 3 = ERC1155 (Seaport v1.6); avoid relying on numeric constants here if library exposes ItemType
      return o.itemType === 2 || o.itemType === 3 || !("itemType" in o); // Fallback if itemType not serialized use heuristic
    });
    const tokenId = nftOffer?.identifierOrCriteria;
    if (!tokenId) continue;
    const priceValue = BigInt(listing.price.current.value); // raw value already in decimals units
    if (!uniqueListingsMap[tokenId]) {
      uniqueListingsMap[tokenId] = listing;
      continue;
    }
    const existingPrice = BigInt(
      uniqueListingsMap[tokenId].price.current.value,
    );
    if (priceValue < existingPrice) {
      uniqueListingsMap[tokenId] = listing;
    }
  }
  data.listings = Object.values(uniqueListingsMap);

  // Sort ascending by current price (normalize by decimals if needed)
  data.listings.sort((a, b) => {
    const priceA = BigInt(a.price.current.value);
    const priceB = BigInt(b.price.current.value);
    return priceA < priceB ? -1 : priceA > priceB ? 1 : 0;
  });
  return data;
}
