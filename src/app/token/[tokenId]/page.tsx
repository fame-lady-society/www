import type { Metadata, ResolvingMetadata } from "next";
import {
  client as mainnetClient,
  flsTokenAddress as mainnetFlsTokenAddress,
} from "@/viem/mainnet-client";
import { erc721Abi } from "viem";
import { IMetadata } from "@/utils/metadata";
import { fetchJson } from "@/ipfs/client";
import Token from "@/routes/Token";

interface Props {
  params: { tokenId: string };
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  // read route params
  const { tokenId } = params;
  const network = "mainnet";

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
  const network = "mainnet";
  const { tokenId } = params;

  const [metadata] = await Promise.all([
    mainnetClient
      .readContract({
        abi: erc721Abi,
        address: mainnetFlsTokenAddress,
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
