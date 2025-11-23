import { AppMain } from "@/layouts/AppMain";
import { isAddress } from "viem";
import { RedirectType, redirect } from "next/navigation";
import { Content as WrapContent } from "@/routes/Wrap";
import { WrapPage } from "@/features/wrap/components/WrapPage";

export default async function Home({
  params,
}: {
  params: { address: string; network: string };
}) {
  const { network } = params;
  let resolvedNetwork: "sepolia" | "mainnet";
  switch (network) {
    case "sepolia": {
      resolvedNetwork = "sepolia";
      break;
    }
    case "mainnet": {
      resolvedNetwork = "mainnet";
      break;
    }
    default: {
      redirect(`/mainnet/wrap`, RedirectType.replace);
    }
  }
  if (!isAddress(params.address)) {
    return (
      <AppMain title="FAMEus" isWrap>
        <section className="flex flex-col items-start justify-center h-full m-4 border rounded-lg p-6">
          <h1 className="text-4xl font-bold">Invalid address</h1>
        </section>
      </AppMain>
    );
  }
  return (
    <>
      <AppMain title="Wrap Your Lady" isWrap>
        <WrapPage network={network} />
      </AppMain>
    </>
  );
}
