import { AppMain } from "@/layouts/AppMain";
import { isAddress } from "viem";
import { ChainSelector } from "../../ChainSelector";
import { CreatorBaseNetworkGate } from "../CreatorBaseNetworkGate";
import { CreatorMetadataUpdateTool } from "../CreatorMetadataUpdateTool";

export default async function CreatorMetadataPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address: rawAddress } = await params;
  if (!isAddress(rawAddress)) throw new Error("Invalid address");
  const address = rawAddress as `0x${string}`;

  return (
    <AppMain
      title="FAME Metadata Studio"
      mobileTitle="Metadata"
      isDao
      headerRight={<ChainSelector />}
    >
      <main className="fame-surface">
        <CreatorBaseNetworkGate>
          <CreatorMetadataUpdateTool address={address} />
        </CreatorBaseNetworkGate>
      </main>
    </AppMain>
  );
}
