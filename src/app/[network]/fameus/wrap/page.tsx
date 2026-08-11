import { AppMain } from "@/layouts/AppMain";
import { ChainSelector } from "../ChainSelector";
import { RedirectWhenConnected } from "@/features/fameus/client-components/RedirectWhenConnected";

export default async function Home(props: {
  params: Promise<{ network: string }>;
}) {
  const params = await props.params;
  const { network } = params;
  let resolvedNetwork: "sepolia" | "base" | undefined;
  let toChain: 11155111 | 8453 | undefined;
  switch (network) {
    case "sepolia": {
      resolvedNetwork = "sepolia";
      toChain = 11155111;
      break;
    }
    case "base": {
      resolvedNetwork = "base";
      toChain = 8453;
      break;
    }
    default: {
      return <div>Invalid network</div>;
    }
  }

  return (
    <>
      <AppMain title="FAMEus Recovery" isDao headerRight={<ChainSelector />}>
        <div className="w-full pl-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-6 text-center">
              FAMEus Recovery
            </h1>
            <p className="text-lg text-left mb-6">
              FAMEus governance is paused. This legacy wrap control remains
              available for existing holders who need to manage a prior FAMEus
              position. Use the Recovery tab after connecting to unwrap a
              Governance Society NFT.
            </p>
            <p className="text-lg text-left mb-6">
              Connect your wallet to see your $FAME ladies.
            </p>
          </div>
        </div>
      </AppMain>
      <RedirectWhenConnected
        pathPrefix="fameus"
        pathPostfix="wrap"
        toChain={toChain}
      />
    </>
  );
}
