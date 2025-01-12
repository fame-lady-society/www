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
          <div className="max-w-4xl mx-auto">{children}</div>
        </div>
      </AppMain>
    </>
  );
}

export const revalidate = 0;
