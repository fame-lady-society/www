import type { Metadata } from "next";
import { Layout } from "@/features/fame/layout";
import { fetchMetadata } from "frames.js/next";
import { baseUrl } from "@/app/frames/frames";
import { getDN404Storage } from "@/service/fame";
import { fameFromNetwork } from "@/features/fame/contract";
import { client as baseClient } from "@/viem/base-client";
import { base } from 'viem/chains'
import { unrevealedLadyRendererAbi, unrevealedLadyRendererAddress } from "@/wagmi";
import { encodePacked, keccak256 } from "viem";
import { IMetadata } from "@/utils/metadata";

function shuffleArray<T>(array: T[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL("https://www.fameladysociety.com"),
    title: "$FAME",
    description: "The home of $FAME.",
    openGraph: {
      images: ["/images/fame/gold-leaf.png"],
    },
    other: await fetchMetadata(new URL(`/fame/frame`, baseUrl)),
  };
}

export default async function Page({ }: {}) {
  const { burnPool, totalNFTSupply } = await getDN404Storage(baseClient, fameFromNetwork(base.id));

  const batches: [bigint, bigint, bigint, string][] = [];
  let batchIndex = 0;
  while (true) {
    try {
      const batch = await baseClient.readContract({
        abi: unrevealedLadyRendererAbi,
        address: unrevealedLadyRendererAddress[base.id],
        functionName: "batches",
        args: [BigInt(batchIndex)],
      });
      batches.push([...batch]);
      batchIndex++;
    } catch (e) {
      // Stop when the call reverts (we've reached the end of batches)
      break;
    }
  }
  const finalNftSupply = BigInt(burnPool.length) + totalNFTSupply;

  const uris = batches.map(([salt, startAtToken, length, baseUri]) => {
    const metadatas = Array.from({ length: Number(length) }, (_, i) => {
      const currentTokenId = startAtToken + BigInt(i);
      if (currentTokenId <= finalNftSupply) {
        return null;
      }
      return { tokenId: currentTokenId, uri: `${baseUri}${BigInt(keccak256(encodePacked(['uint256', 'uint256'], [currentTokenId - startAtToken, salt]))).toString()}.json` };
    });
    shuffleArray(metadatas);
    return metadatas;
  }).flat().filter((uri): uri is { tokenId: bigint, uri: string } => uri !== null);

  const images = await Promise.all(uris.map(async ({ uri }) => {
    const response = await fetch(uri);
    const metadata: IMetadata = await response.json();
    return metadata.image;
  }))
  shuffleArray(images);

  return <Layout burnPool={burnPool.map((tokenId) => Number(tokenId))} unrevealed={images} />;
}

export const revalidate = 20;