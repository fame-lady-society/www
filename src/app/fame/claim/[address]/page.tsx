import type { Metadata, ResolvingMetadata } from "next";
import FameClaimStatus from "@/routes/FameClaimStatus";
import { client as mainnetClient } from "@/viem/mainnet-client";
import { formatEther, isAddress } from "viem";
import { fetchMetadata } from "frames.js/next";
import { baseUrl } from "@/app/frames/frames";
import { fetchAllocationData } from "@/service/fetchAllocationData";

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
  const ensName = await mainnetClient.getEnsName({ address });
  const name = ensName || address;
  const { total } = await fetchAllocationData({ address });
  return {
    metadataBase: new URL(baseUrl),
    title: `$FAME for ${name}`,
    description:
      total === 0n
        ? "Claim to $FAME"
        : `Claim to ${Number(formatEther(total).split(".")[0]).toLocaleString("en").replace(",", " ")} $FAME`,
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
