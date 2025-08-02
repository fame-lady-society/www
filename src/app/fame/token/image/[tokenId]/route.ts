import { createClient as createKvClient } from "@vercel/kv";
import { client as baseClient } from "@/viem/base-client";
import { type NextRequest, NextResponse } from "next/server";
import { erc721Abi } from "viem";
import { IMetadata } from "@/utils/metadata";
import {
  creatorArtistMagicAddress,
  societyFromNetwork,
} from "@/features/fame/contract";
import { base } from "viem/chains";
import { creatorArtistMagicAbi } from "@/wagmi";

async function fetchMetadata({
  client,
  tokenId,
}: {
  client: typeof baseClient;
  tokenId: bigint;
}) {
  return client
    .readContract({
      abi: creatorArtistMagicAbi,
      address: creatorArtistMagicAddress(base.id),
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
  // let tokenImage: string | null = null;
  let tokenImage = await kv.get<string | null>(tokenImageKey);
  if (!tokenImage) {
    const metadata = await fetchMetadata({
      client: baseClient,
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
  return new Response(fetchImage.body, {
    headers: {
      "Content-Type": fetchImage.headers.get("Content-Type") || "",
    },
  });
}
