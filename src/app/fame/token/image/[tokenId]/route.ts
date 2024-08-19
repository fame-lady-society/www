import { createClient as createKvClient } from "@vercel/kv";
import { client as baseClient } from "@/viem/base-client";
import { type NextRequest, NextResponse } from "next/server";
import { erc721Abi } from "viem";
import { IMetadata } from "@/utils/metadata";
import { societyFromNetwork } from "@/features/fame/contract";
import { base } from "viem/chains";

export async function fetchMetadata({
  client,
  address,
  tokenId,
}: {
  client: typeof baseClient;
  address: `0x${string}`;
  tokenId: bigint;
}) {
  return client
    .readContract({
      abi: erc721Abi,
      address: address,
      functionName: "tokenURI",
      args: [BigInt(tokenId)],
    })
    .then(async (tokenUri) => {
      const metadataResponse = await fetch(tokenUri);
      const metadata: IMetadata = await metadataResponse.json();
      return metadata;
    });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { tokenId: string } },
) {
  const kv = createKvClient({
    token: process.env.KV_REST_API_TOKEN,
    url: process.env.KV_REST_API_URL,
  });

  const tokenImageKey = `token-image-${params.tokenId}`;
  let tokenImage = await kv.get<string | null>(tokenImageKey);
  if (!tokenImage) {
    const metadata = await fetchMetadata({
      client: baseClient,
      address: societyFromNetwork(base.id),
      tokenId: BigInt(params.tokenId),
    });
    tokenImage = metadata.image;
    await kv.set(tokenImageKey, tokenImage);
  }
  const fetchImage = await fetch(tokenImage, {
    next: {
      revalidate: 0,
    },
  });
  return new Response(fetchImage.body);
}
