import type { Metadata, ResolvingMetadata } from "next";
import FameClaimStatus from "@/routes/FameClaimStatus";
import { client as mainnetClient } from "@/viem/mainnet-client";
import { isAddress } from "viem";
import { fetchMetadata } from "frames.js/next";
import { baseUrl } from "@/app/frames/frames";

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
  return {
    metadataBase: new URL(baseUrl),
    title: `$FAME for ${name}`,
    description: "Claim to $FAME",
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
