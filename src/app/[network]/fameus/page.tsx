import { AppMain } from "@/layouts/AppMain";
import { ChainSelector } from "./ChainSelector";
import { VideoWipeInteraction } from "./VideoWipeInteraction";

const videoWipeUrl = "/videos/wipe-1.mp4";

export default function Home({ params }: { params: { network: string } }) {
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
      <AppMain title="FAMEus" isDao headerRight={<ChainSelector />}>
        <VideoWipeInteraction
          videoUrl={videoWipeUrl}
          redirectPath={`/${network}/fameus/onboarding`}
          redirectWhenConnectedPath={`/${network}/fameus/wrap`}
        >
          <div className="w-full pl-4 py-8">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl font-bold mb-6 text-center">
                Enter the FAMEus DAO
              </h1>
              <p className="text-lg text-left mb-6">
                The FAMEus DAO is a community-driven organization that empowers
                $FAME Society NFT holders to shape the future of the FAMEus DAO.
              </p>
              <p className="text-lg text-left mb-6">
                Touch anywhere to continue.
              </p>
            </div>
          </div>
        </VideoWipeInteraction>
      </AppMain>
    </>
  );
}
