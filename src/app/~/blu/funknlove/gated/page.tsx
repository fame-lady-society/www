import React from "react";
import { mainnet } from "viem/chains";
import { ConnectCard } from "./ConnectCard";
import { RedirectWhenConnected } from "./RedirectWhenConnected";
import { SocialLinks } from "../SocialLinks";
export default function Page() {
  return (
    <>
      <div className="flex flex-col items-center justify-center">
        <h3 className="text-2xl font-bold mt-4 text-center">
          <SocialLinks />
        </h3>
        <ConnectCard />
      </div>
      <RedirectWhenConnected
        pathPrefix="/~/blu/funknlove/gated"
        toChain={mainnet.id}
      />
    </>
  );
}
