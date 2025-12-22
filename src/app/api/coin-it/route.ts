import { NextRequest, NextResponse } from "next/server";
import { Address, PublicClient, erc721Abi } from "viem";
import { base, mainnet, sepolia } from "viem/chains";
import { readContract } from "viem/actions";

import { fetchJson } from "@/ipfs/client";
import { fameLadySocietyAbi, fameLadySocietyAddress } from "@/wagmi";
import { client as mainnetClient } from "@/viem/mainnet-client";
import { client as sepoliaClient } from "@/viem/sepolia-client";
import { debugCreateCoin } from "@/service/zora/debug";
import { IMetadata } from "@/utils/metadata";
import { getSession } from "@/app/siwe/session-utils";

type SupportedNetwork = "mainnet" | "sepolia";

const ALLOWED_NETWORKS: SupportedNetwork[] = ["mainnet", "sepolia"];

function getNetworkConfig(network?: string) {
  const normalizedNetwork = (network ?? "mainnet").toLowerCase();
  const target =
    normalizedNetwork === "sepolia"
      ? ("sepolia" as const)
      : ("mainnet" as const);

  const chainId = target === "sepolia" ? sepolia.id : mainnet.id;
  const client: PublicClient =
    target === "sepolia" ? sepoliaClient : mainnetClient;
  const contractAddress = fameLadySocietyAddress[chainId];

  if (!contractAddress) {
    throw new Error(`Fame Lady Society address missing for ${target}`);
  }

  return {
    network: target,
    chainId,
    client,
    contractAddress,
  };
}

export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    tokenId,
    symbol,
    network: requestedNetwork,
  } = (await request.json()) as {
    tokenId: string;
    symbol?: string;
    network?: SupportedNetwork;
  };

  if (!tokenId) {
    return NextResponse.json({ error: "Missing tokenId" }, { status: 400 });
  }

  if (requestedNetwork && !ALLOWED_NETWORKS.includes(requestedNetwork)) {
    return NextResponse.json({ error: "Unsupported network" }, { status: 400 });
  }

  const { network, client, contractAddress } =
    getNetworkConfig(requestedNetwork);

  const imageURI = `${process.env.NEXT_PUBLIC_BASE_URL}/mainnet/og/token/${tokenId}`;

  const [ownerOfToken, tokenUri] = await Promise.all([
    readContract(client, {
      abi: fameLadySocietyAbi,
      address: contractAddress,
      functionName: "ownerOf",
      args: [BigInt(tokenId)],
    }),
    readContract(client, {
      abi: erc721Abi,
      address: contractAddress,
      functionName: "tokenURI",
      args: [BigInt(tokenId)],
    }),
  ]);

  if (ownerOfToken.toLowerCase() !== session.address.toLowerCase()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let metadata: IMetadata;
  if (tokenUri.startsWith("ipfs://")) {
    metadata = await fetchJson<IMetadata>({
      cid: tokenUri.replace("ipfs://", ""),
    });
  } else {
    const response = await fetch(tokenUri, {
      headers: { "Content-Type": "application/json" },
    });
    metadata = await response.json();
  }

  const finalSymbol =
    symbol ?? metadata.name?.replace(/\s+/g, "").toUpperCase() ?? "FAME";

  const transactionParameters = await debugCreateCoin({
    creator: session.address,
    imageURI,
    name: metadata.name,
    symbol: finalSymbol,
    description: metadata.description ?? "",
  });

  const serialized = transactionParameters.map((parameter) => ({
    ...parameter,
    value: parameter.value?.toString() ?? "0",
    chainId: base.id,
    network,
  }));

  return NextResponse.json({ transactionParameters: serialized });
}
