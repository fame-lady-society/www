import { RedirectType, redirect } from "next/navigation";
import { AppMain } from "@/layouts/AppMain";
import { WrapPage } from "@/features/wrap/components/WrapPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wrap Your Fame Lady | Fame Lady Society",
  description: "Exchange your original Fame Lady Squad NFT for a Fame Lady Society NFT—same artwork, modern contract, community-controlled.",
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
    <AppMain title="Wrap Your Lady" mobileTitle="Wrap" isWrap>
      <WrapPage network={resolvedNetwork} />
    </AppMain>
  );
}
