import { NextRequest, NextResponse } from "next/server";
import { mainnet } from "viem/chains";
import { readContract } from "viem/actions";

import { fetchJson } from "@/ipfs/client";
import { fameLadySocietyAbi, fameLadySocietyAddress } from "@/wagmi";
import { client as mainnetClient } from "@/viem/mainnet-client";
import { IMetadata } from "@/utils/metadata";

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: { tokenId: string };
  },
) {
  const { tokenId } = params;

  if (!tokenId) {
    return NextResponse.json({ error: "Missing tokenId" }, { status: 400 });
  }

  const metadataURI = await readContract(mainnetClient, {
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress[mainnet.id],
    functionName: "tokenURI",
    args: [BigInt(tokenId)],
  });

  let metadata: IMetadata | null = null;
  if (metadataURI.startsWith("ipfs://")) {
    metadata = await fetchJson<IMetadata>({
      cid: metadataURI.replace("ipfs://", ""),
    });
  } else {
    const response = await fetch(metadataURI);
    metadata = (await response.json()) as IMetadata;
  }

  if (!metadata) {
    return NextResponse.json(
      { error: "Failed to fetch metadata" },
      { status: 500 },
    );
  }

  const description = metadata.description;

  return NextResponse.json({
    name: metadata.name,
    description: description,
    image: metadata.image,
    properties: {
      category: "social",
      fls: {
        tokenId,
      },
    },
  });
}
