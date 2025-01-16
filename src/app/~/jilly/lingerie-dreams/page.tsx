import { WrappedLink } from "@/components/WrappedLink";
import { Teaser } from "./Teaser";

export default function Page() {
  return (
    <>
      <div className="flex flex-col items-center justify-center">
        <Teaser />
        <h2 className="text-4xl font-bold mt-4">
          By{" "}
          <WrappedLink
            href="https://x.com/jillyrappaport"
            className="no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Jilly Rappaport
          </WrappedLink>
        </h2>
        <p className="text-lg mt-2">A 1/1 limited edition Music NFT</p>
        <p className="text-lg mt-2">Coming soon</p>
      </div>
    </>
  );
}
