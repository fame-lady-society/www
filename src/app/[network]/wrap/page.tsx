import { RedirectType, redirect } from "next/navigation";
import { RedirectWhenConnected } from "@/features/fameus/client-components/RedirectWhenConnected";
import { AppMain } from "@/layouts/AppMain";

export default function Page({ params }: { params: { network: string } }) {
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
  return (
    <>
      <AppMain title="FAMEus" isDao></AppMain>
      <RedirectWhenConnected pathPrefix="wrap" toChain={resolvedNetwork === "mainnet" ? 1 : 11155111} />
    </>
  );
}
