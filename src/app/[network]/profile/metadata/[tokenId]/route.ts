import { type NextRequest, NextResponse } from "next/server";
import { client as mainnetClient } from "@/viem/mainnet-client";
import { client as baseSepoliaClient } from "@/viem/base-sepolia-client";
import { client as sepoliaClient } from "@/viem/sepolia-client";
import { flsNamingAbi, flsNamingAddress } from "@/wagmi";
import { baseSepolia, mainnet, sepolia } from "viem/chains";
import { IMetadata } from "@/utils/metadata";

type SupportedNetwork = "mainnet" | "base-sepolia" | "sepolia";

interface NetworkConfig {
  network: SupportedNetwork;
  client: typeof mainnetClient | typeof sepoliaClient | typeof baseSepoliaClient;
  address: `0x${string}`;
}

function resolveNetwork(network: string): NetworkConfig | null {
  if (network === "mainnet") {
    const address = flsNamingAddress[mainnet.id];
    if (!address) {
      return null;
    }
    return { network: "mainnet", client: mainnetClient, address };
  }
  if (network === "base-sepolia") {
    const address = flsNamingAddress[baseSepolia.id];
    if (!address) {
      return null;
    }
    return { network: "base-sepolia", client: baseSepoliaClient, address };
  }
  if (network === "sepolia") {
    const address = flsNamingAddress[sepolia.id];
    if (!address) {
      return null;
    }
    return { network: "sepolia", client: sepoliaClient, address };
  }
  return null;
}

function normalizeTokenId(raw: string): string {
  return raw.endsWith(".json") ? raw.slice(0, -5) : raw;
}

function parseTokenId(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export async function GET(
  _: NextRequest,
  { params }: { params: { tokenId: string; network: string } },
) {
  const config = resolveNetwork(params.network);
  if (!config) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const tokenIdRaw = normalizeTokenId(params.tokenId);
  const tokenId = parseTokenId(tokenIdRaw);
  if (tokenId === null) {
    return new NextResponse("Invalid tokenId", { status: 400 });
  }

  const { address: contractAddress, client: viemClient, network } = config;

  try {
    const [identityName] = await viemClient.readContract({
      address: contractAddress,
      abi: flsNamingAbi,
      functionName: "getIdentity",
      args: [BigInt(tokenId)],
    });

    return NextResponse.json({
      id: tokenId,
      name: identityName,
      image: `${process.env.NEXT_PUBLIC_BASE_URL}/${network}/profile/image/${tokenId}`,
    } as IMetadata);
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
}
