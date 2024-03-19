import { asNetwork } from "@/routes/utils";
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
import { IMetadata, defaultDescription, imageUrl } from "@/utils/metadata";
import { fetchJson } from "@/ipfs/client";
import Token from "@/routes/Token";

interface Props {
  params: { network: string; tokenId: string };
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  // read route params
  const { network, tokenId } = params;

  return {
    title: "Fame Lady Society",
    description: "It's a wrap!",
    openGraph: {
      images: [`/og/${network}/token/${tokenId}`],
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
  return <Token tokenId={Number(tokenId)} metadata={metadata} />;
}
