import { NextResponse, NextRequest } from "next/server";
import { fetchFameClaimData } from "@/service/fameClaimData";
import { getDN404Storage } from "@/service/fame";
import { client as baseClient } from "@/viem/base-client";
import {
  unrevealedLadyRendererAbi,
  unrevealedLadyRendererAddress,
  fameMirrorAbi,
} from "@/wagmi";
import { fameFromNetwork, societyFromNetwork } from "@/features/fame/contract";
import { base } from "viem/chains";
import { IMetadata } from "@/utils/metadata";
import {
  ContractFunctionExecutionError,
  decodeErrorResult,
  encodePacked,
  keccak256,
  parseAbi,
} from "viem";
import { readContract } from "viem/actions";

export async function GET(req: NextRequest) {
  const { burnPool, totalNFTSupply } = await getDN404Storage();
  const fameSocietyNftAddress = societyFromNetwork(base.id);

  // Fetch metadata from rendering contract
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
  const uris = batches
    .map(([salt, startAtToken, length, baseUri]) => {
      const metadatas = Array.from({ length: Number(length) }, (_, i) => {
        const currentTokenId = startAtToken + BigInt(i);
        if (currentTokenId <= finalNftSupply) {
          return null;
        }
        return {
          tokenId: currentTokenId,
          uri: `${baseUri}${BigInt(keccak256(encodePacked(["uint256", "uint256"], [currentTokenId - startAtToken, salt]))).toString()}.json`,
        };
      });
      return metadatas;
    })
    .flat()
    .filter((uri): uri is { tokenId: bigint; uri: string } => uri !== null);

  // Fetch metadata from rendering contract with tokenIDs
  const renderingContractMetadata = await Promise.all(
    uris.map(async ({ tokenId, uri }) => {
      const response = await fetch(uri);
      const metadata: IMetadata = await response.json();
      return {
        tokenId: tokenId.toString(),
        metadata,
        image: metadata.image,
        source: "rendering_contract",
      };
    }),
  );

  // Fetch metadata from direct tokenURI method for tokens not covered by rendering contract
  const directTokenUris: { tokenId: bigint; uri: string }[] = [];
  for (let i = 0; i < Number(finalNftSupply); i++) {
    const tokenId = BigInt(i);
    try {
      const uri = await baseClient.readContract({
        abi: parseAbi([
          "error TokenDoesNotExist()",
          "function tokenURI(uint256) view returns (string)",
        ]),
        address: fameSocietyNftAddress,
        functionName: "tokenURI",
        args: [tokenId],
      });
      directTokenUris.push({ tokenId, uri });
    } catch (e: any) {
      // the image will be "UNREVEALED"
      directTokenUris.push({ tokenId, uri: "UNREVEALED" });
    }
  }

  // Fetch metadata from direct tokenURI method with tokenIDs
  const directTokenMetadata = await Promise.all(
    directTokenUris.map(async ({ tokenId, uri }) => {
      if (uri === "UNREVEALED") {
        return {
          tokenId: tokenId.toString(),
          metadata: { image: "UNREVEALED" },
          image: "UNREVEALED",
          source: "burned",
        };
      }
      const response = await fetch(uri);
      const metadata: IMetadata = await response.json();
      return {
        tokenId: tokenId.toString(),
        metadata,
        image: metadata.image,
        source: "direct_tokenURI",
      };
    }),
  );

  // Combine all metadata with tokenIDs
  const allMetadata = [...renderingContractMetadata, ...directTokenMetadata];

  // Create a map of tokenID to metadata for easy lookup
  const tokenMetadataMap = new Map(
    allMetadata.map((item) => [item.tokenId.toString(), item]),
  );

  // Output the final array with tokenIDs and their associated metadata
  console.log(`Total metadata entries: ${allMetadata.length}`);
  console.log(`Unique tokenIDs: ${tokenMetadataMap.size}`);

  // Create CSV with tokenId, image, and source columns
  let csvData = `tokenId,image,source\n`;
  for (const item of allMetadata) {
    // Escape commas and quotes in the image URL
    const escapedImage = item.image.replace(/"/g, '""');
    csvData += `${item.tokenId},"${escapedImage}",${item.source}\n`;
  }

  // Return the CSV in the response
  const response = new NextResponse(csvData, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=token-metadata.csv",
    },
  });
  return response;
}

export const dynamic = "force-dynamic";
