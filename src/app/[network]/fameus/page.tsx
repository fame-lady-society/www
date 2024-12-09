import { RedirectWhenConnected } from "@/features/fameus/client-components/RedirectWhenConnected";
import { AppMain } from "@/layouts/AppMain";
import { ChainSelector } from "./ChainSelector";

export default function Home({ params }: { params: { network: string } }) {
  const { network } = params;
  let resolvedNetwork: "sepolia" | "base" | undefined;
  let toChain: 8543 | 8453 | undefined;
  switch (network) {
    case "sepolia": {
      resolvedNetwork = "sepolia";
      toChain = 8543;
      break;
    }
    case "base": {
      resolvedNetwork = "base";
      toChain = 8453;
      break;
    }
  }
  return (
    <>
      <AppMain title="FAMEus" isDao headerRight={<ChainSelector />}>
        <div className="w-full px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-6 text-center">Coming Soon</h1>
            <p className="text-lg text-left mb-6">
              The FAMEus DAO is currently under development. Check back soon for
              updates!
            </p>
            <p className="text-lg text-left mb-6">
              Connect your wallet to see your $FAME ladies.
            </p>
          </div>
        </div>
      </AppMain>
      <RedirectWhenConnected pathPrefix="fameus" toChain={toChain} />
    </>
  );
}
