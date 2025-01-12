import { AppMain } from "@/layouts/AppMain";
import { ChainSelector } from "../ChainSelector";
import { VideoWipeInteraction } from "../VideoWipeInteraction";
import { PleaseConnectYourWallet } from "./PleaseConnectYourWallet";

const videoWipeUrl = "/videos/wipe-2.mp4";

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
    default: {
      return <div>Invalid network</div>;
    }
  }

  return (
    <>
      <AppMain title="FAMEus" isDao headerRight={<ChainSelector />}>
        <VideoWipeInteraction
          videoUrl={videoWipeUrl}
          redirectPath={`/${network}/fameus/wrap`}
          mustBeConnected
        >
          <div className="w-full pl-4 py-8">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl font-bold mb-6 text-center">
                FAMEus DAO Onboarding
              </h1>
              <p className="text-lg text-left mb-6">
                The FAMEus DAO requires you to wrap your $FAME Society NFTs into
                Governance Society NFTs. These Governance Society NFTs will be
                used to vote on the future of the FAMEus DAO.
              </p>
              <PleaseConnectYourWallet />
            </div>
          </div>
        </VideoWipeInteraction>
      </AppMain>
    </>
  );
}
