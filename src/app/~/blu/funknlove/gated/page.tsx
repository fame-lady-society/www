import React from "react";
import { polygon } from "viem/chains";
import { WrappedLink } from "@/components/WrappedLink";
import { ConnectCard } from "./ConnectCard";
import { RedirectWhenConnected } from "./RedirectWhenConnected";

export default function Page() {
  return (
    <>
      <div className="flex flex-col items-center justify-center">
        <h3 className="text-2xl font-bold mt-4 text-center">
          By{" "}
          <WrappedLink
            href="https://x.com/jillyrappaport"
            className="no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Jilly Rappaport
          </WrappedLink>{" "}
          and{" "}
          <WrappedLink
            href="https://x.com/SerenaSpectra"
            className="no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Serena Spectra
          </WrappedLink>{" "}
          as{" "}
          <WrappedLink
            href="https://x.com/fameordie"
            className="no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            FAMEorDIE
          </WrappedLink>
        </h3>
        <ConnectCard />
      </div>
      <RedirectWhenConnected
        pathPrefix="/~/blu/funknlove/gated"
        toChain={polygon.id}
      />
    </>
  );
}
