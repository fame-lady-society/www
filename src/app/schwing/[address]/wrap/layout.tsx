import { AppMain } from "@/layouts/AppMain";
import { isAddress } from "viem";
import { InfoTooltip } from "@/components/InfoToolTip";


export default async function Home({
  params,
  children,
}: {
  params: { address: string; network: string };
  children: React.ReactNode;
}) {
  if (!isAddress(params.address)) {
    return (
      <AppMain title="Schwing DAO" isDao>
        <section className="flex flex-col items-start justify-center h-full m-4 border rounded-lg p-6">
          <h1 className="text-4xl font-bold">Schwing DAO</h1>
        </section>
      </AppMain>
    );
  }


  return (
    <>

      <AppMain title="Schwing DAO">
        <div className="w-full px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-6 text-left">
              Schwing DAO Wrap
            </h1>
            <p className="text-lg text-left mb-6">
              The Schwing DAO is the test DAO of the FAMEus DAO.  No value or utility is intended or implied.
            </p>
            <h3 className="text-2xl font-bold mb-6 flex items-center">
              Liquid $SCHWING Austin Powers NFTs
              <InfoTooltip text="Liquid $SCHWING Austin Powers NFTs are the native $SCHWING Austin Powers NFT that have 1 Million $SCHWING tokens backing them and are linked to the tokens" />
            </h3>
            {children}
          </div>
        </div>
      </AppMain>
    </>
  );
}


export const revalidate = 0;
