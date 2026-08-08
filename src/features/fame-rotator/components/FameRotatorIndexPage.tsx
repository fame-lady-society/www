import Link from "next/link";
import { FameRotatorTargetCard } from "./FameRotatorTargetCard";

export type FameRotatorSelectorTarget = {
  tokenId: number;
  image: string;
};

export type FameRotatorIndexPageProps =
  | { status: "ready"; targets: readonly FameRotatorSelectorTarget[] }
  | { status: "empty" }
  | { status: "error" };

/** Server-rendered, visual-only selector for the current ordered burn pool. */
export function FameRotatorIndexPage(props: FameRotatorIndexPageProps) {
  return (
    <div className="min-h-[calc(100dvh-68px)] px-4 pb-24 pt-12 text-[#f4eee2] sm:px-8 sm:pt-16">
      <div className="mx-auto max-w-[1440px]">
        <Link
          href="/fame"
          className="fame-action fame-focus inline-flex min-h-11 items-center border-b border-[#c9aa67]/50 text-sm font-semibold text-[#f4eee2] hover:border-[#c9aa67] hover:text-[#e4cd96]"
        >
          ← Back to FAME
        </Link>
        <header className="mt-10 grid gap-6 border-b border-[#c9aa67]/20 pb-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="fame-kicker">FAME / Rotator</p>
            <h1 className="fame-display mt-4 max-w-4xl text-balance text-6xl leading-[0.92] sm:text-8xl">
              Choose a waiting Society.
            </h1>
          </div>
          <p className="max-w-md text-sm leading-6 text-[#bdb4a4] lg:col-span-4">
            Select the artwork you want to swap for. Requires a Society currently held in your wallet.
          </p>
        </header>

        {props.status === "ready" ? (
          <div className="mt-8 flex items-center justify-between gap-4">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#8f8779]">
              Current waiting pool
            </p>
            <p className="font-mono text-xs tabular-nums text-[#c9aa67]">
              {props.targets.length} targets
            </p>
          </div>
        ) : null}

        {props.status === "ready" ? (
          <section
            className="mt-5 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-12 md:grid-cols-3 xl:grid-cols-4"
            aria-label="Waiting Society targets"
            data-testid="rotator-target-grid"
          >
            {props.targets.map((target, index) => (
              <FameRotatorTargetCard
                key={target.tokenId}
                tokenId={target.tokenId}
                image={target.image}
                position={index + 1}
              />
            ))}
          </section>
        ) : null}

        {props.status === "empty" ? (
          <section
            className="mt-12 max-w-2xl border-l border-[#c9aa67] bg-[#11100d] p-7 sm:p-10"
            data-testid="rotator-empty-state"
          >
            <p className="fame-kicker">The queue is clear</p>
            <h2 className="fame-display mt-4 text-4xl">
              No waiting targets right now
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-6 text-[#bdb4a4]">
              The current waiting pool is empty. Check back later for a target
              to rotate for.
            </p>
          </section>
        ) : null}

        {props.status === "error" ? (
          <section
            className="mt-12 max-w-2xl border-l border-[#c9aa67] bg-[#11100d] p-7 sm:p-10"
            data-testid="rotator-error-state"
          >
            <p className="fame-kicker">Read interrupted</p>
            <h2 className="fame-display mt-4 text-4xl">
              Could not load waiting targets
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-6 text-[#bdb4a4]">
              The waiting pool could not be read. This does not mean it is
              empty.
            </p>
            <Link
              href="/fame/rotate"
              className="fame-action fame-focus mt-6 inline-flex min-h-11 items-center border-b border-[#c9aa67]/50 text-sm font-semibold text-[#f4eee2] hover:border-[#c9aa67]"
            >
              Retry the pool read
            </Link>
          </section>
        ) : null}
      </div>
    </div>
  );
}
