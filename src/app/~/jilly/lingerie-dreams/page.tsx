import { WrappedLink } from "@/components/WrappedLink";
import { Teaser } from "./Teaser";

export default function Page() {
  return (
    <>
      <div className="flex flex-col items-center justify-center">
        <Teaser />
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
        <p className="text-lg mt-2">A 1/1 limited edition Music NFT</p>
        <p className="text-lg mt-2">Coming soon</p>
      </div>
    </>
  );
}
