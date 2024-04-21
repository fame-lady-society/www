import type { Metadata, ResolvingMetadata } from "next";
import {
  client as mainnetClient,
  flsTokenAddress as mainnetFlsTokenAddress,
} from "@/viem/mainnet-client";
import {
  client as sepoliaClient,
  flsTokenAddress as sepoliaFlsTokenAddress,
} from "@/viem/sepolia-client";
import { erc721Abi } from "viem";
import { IMetadata } from "@/utils/metadata";
import { fetchJson } from "@/ipfs/client";
import Token from "@/routes/Token";
import { asNetwork } from "@/routes/utils";

interface Props {
  params: { tokenId: string; network: string };
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  // read route params
  const { tokenId } = params;
  const network = asNetwork(params.network);

  return {
    metadataBase: new URL(process.env.OG_BASE_URL!),
    title: "Fame Lady Society",
    description: "It's a wrap!",
    openGraph: {
      images: [`/${network}/og/token/${tokenId}`],
      url: `/${network}/token/${tokenId}`,
    },
  };
}

export default async function Page({ params }: Props) {
  const network = asNetwork(params.network);
  const { tokenId } = params;

  const viemClient = network === "mainnet" ? mainnetClient : sepoliaClient;
  const flsTokenAddress =
    network === "mainnet" ? mainnetFlsTokenAddress : sepoliaFlsTokenAddress;

  const [metadata] = await Promise.all([
    viemClient
      .readContract({
        abi: erc721Abi,
        address: flsTokenAddress,
        functionName: "tokenURI",
        args: [BigInt(tokenId)],
      })
      .then(async (tokenUri) => {
        const metadata = await fetchJson<IMetadata>({
          cid: tokenUri.replace("ipfs://", ""),
        });
        return metadata;
      }),
  ]);
  return (
    <Token
      tokenId={Number(tokenId)}
      metadata={metadata}
      network={network === "mainnet" ? "mainnet" : "sepolia"}
    />
  );
}
