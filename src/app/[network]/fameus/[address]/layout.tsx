import { AppMain } from "@/layouts/AppMain";
import { isAddress } from "viem";
import { InfoTooltip } from "@/components/InfoToolTip";
import { FameusProvider } from "./context";


export default async function Home({
  params,
  children,
}: {
  params: { address: string; network: string };
  children: React.ReactNode;
}) {
  if (!isAddress(params.address)) {
    return (
      <AppMain title="FAMEus" isDao>
        <section className="flex flex-col items-start justify-center h-full m-4 border rounded-lg p-6">
          <h1 className="text-4xl font-bold">FAMEus</h1>
        </section>
      </AppMain>
    );
  }

  const chainId =
    params.network === "base"
      ? 8453
      : params.network === "sepolia"
        ? 11155111
        : null;
  if (!chainId) {
    return (
      <AppMain title="FAMEus">
        <div className="w-full px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-6 text-center">
              Please connect to base network
            </h1>
          </div>
        </div>
      </AppMain>
    );
  }

  return (
    <>

      <AppMain title="FAMEus DAO">
        <div className="w-full px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-6 text-left">
              FAMEus DAO Onboarding
            </h1>
            <p className="text-lg text-left mb-6">
              The FAMEus DAO is launching soon. Check back soon for updates!
            </p>
            <h3 className="text-2xl font-bold mb-6 flex items-center">
              Liquid $FAME Ladies
              <InfoTooltip text="Liquid ladies are the native $FAME Society NFT that have 1 Million $FAME tokens backing them and are linked to the tokens" />
            </h3>
            {children}
          </div>
        </div>
      </AppMain>
    </>
  );
}


export const revalidate = 0;
