import type { Metadata, ResolvingMetadata } from "next";
import FameClaimStatus from "@/routes/FameClaimStatus";
import { client as mainnetClient } from "@/viem/mainnet-client";
import { client as baseClient } from "@/viem/base-client";
import { formatEther, isAddress } from "viem";
import { fetchMetadata } from "frames.js/next";
import { baseUrl } from "@/app/frames/frames";
import { fetchAllocationData } from "@/service/fetchAllocationData";
import { fameSaleAbi, fameSaleTokenAbi } from "@/wagmi";
import {
  fameSaleAddress,
  fameSaleTokenAddress,
} from "@/features/fame/contract";
import { presaleAmountToTokens } from "@/utils/presaleMath";

interface Params {
  address: string;
}

interface Props {
  params: Params;
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  // read route params
  const { address } = params;
  if (!isAddress(address)) {
    return {
      title: "Fame claim status",
      description: "Claim status for Fame token launch",
    };
  }

  const [{ total: allocationTotal }, ensName, presaleBalance, maxRaise] =
    await Promise.all([
      fetchAllocationData({ address }),
      mainnetClient.getEnsName({ address }),
      baseClient.readContract({
        abi: fameSaleTokenAbi,
        address: fameSaleTokenAddress(8453),
        functionName: "balanceOf",
        args: [address],
      }),
      baseClient.readContract({
        abi: fameSaleAbi,
        address: fameSaleAddress(8453),
        functionName: "maxRaise",
      }),
    ]);

  const name = ensName || address;
  const presaleTokens = presaleAmountToTokens(presaleBalance, maxRaise);
  const total = allocationTotal + presaleTokens;

  return {
    metadataBase: new URL(baseUrl),
    title: `$FAME for ${name}`,
    description:
      total === 0n
        ? "Claim to $FAME"
        : `Claim to ${Number(formatEther(total).split(".")[0]).toLocaleString("en").replaceAll(",", " ")} $FAME`,
    openGraph: {
      images: [`/fame/claim/${address}/og`],
      url: `/fame/claim/${address}`,
    },
    other: await fetchMetadata(
      new URL(`/fame/claim/${address}/frame`, baseUrl),
    ),
  };
}

export default async function Page({
  params: { address },
}: {
  params: Params;
}) {
  return <FameClaimStatus address={address} />;
}

export const dynamic = "force-dynamic";