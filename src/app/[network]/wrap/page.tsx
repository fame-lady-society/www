import { RedirectType, redirect } from "next/navigation";
import { RedirectWhenConnected } from "@/features/fameus/client-components/RedirectWhenConnected";
import { AppMain } from "@/layouts/AppMain";
import { Metadata } from "next";

export const metadata: Metadata = {
  other: {
    ["fc:miniapp"]: JSON.stringify({
      version: "1",
      imageUrl: "https://www.fameladysociety.com/images/app.png",
      button: {
        title: "Wrap",
        action: {
          type: "launch_miniapp",
          url: "https://www.fameladysociety.com/mainnet/wrap",
          name: "Wrap",
          splashImageUrl: "https://www.fameladysociety.com/images/splash.png",
          splashBackgroundColor: "#040404",
        },
      },
    }),
  },
};

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
      <AppMain title="FAMEus" isWrap></AppMain>
      <RedirectWhenConnected
        pathPrefix="wrap"
        toChain={resolvedNetwork === "mainnet" ? 1 : 11155111}
      />
    </>
  );
}
