import { RedirectWhenConnected } from "./RedirectWhenConnected";
import { AppMain } from "@/layouts/AppMain";
import { ChainSelector } from "./ChainSelector";

export default function Home() {
  return (
    <>
      <AppMain title="FAMEus" isDao headerRight={<ChainSelector />}>
        <div className="w-full px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-6 text-center">Coming Soon</h1>
            <p className="text-lg text-left mb-6">Schwing Wrap</p>
            <p className="text-lg text-left mb-6">
              Connect your wallet to see your $SCHWING Austin Powers NFTs Baby
              Yeah!.
            </p>
          </div>
        </div>
      </AppMain>
      <RedirectWhenConnected pathPrefix="schwing" pathPostfix="wrap" />
    </>
  );
}
