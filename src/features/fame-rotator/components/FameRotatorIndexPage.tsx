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
    <main className="min-h-screen bg-black px-4 py-8 text-amber-50 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/fame"
          className="inline-flex min-h-11 items-center text-sm text-amber-100 underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-amber-300"
        >
          Back to FAME
        </Link>
        <header className="mt-5 max-w-2xl">
          <h1 className="text-3xl font-semibold sm:text-4xl">
            Choose a waiting Society
          </h1>
          <p className="mt-3 text-amber-100/80">
            Select the artwork you want to rotate for. The current queue order
            determines the rotation bound when you continue.
          </p>
        </header>

        {props.status === "ready" ? (
          <section
            className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
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
            className="mt-8 max-w-xl border border-amber-500/40 p-5"
            data-testid="rotator-empty-state"
          >
            <h2 className="text-xl font-medium">
              No waiting targets right now
            </h2>
            <p className="mt-2 text-amber-100/80">
              The current waiting pool is empty. Check back later for a target
              to rotate for.
            </p>
          </section>
        ) : null}

        {props.status === "error" ? (
          <section
            className="mt-8 max-w-xl border border-amber-500/40 p-5"
            data-testid="rotator-error-state"
          >
            <h2 className="text-xl font-medium">
              Could not load waiting targets
            </h2>
            <p className="mt-2 text-amber-100/80">
              The waiting pool could not be read. This does not mean it is
              empty.
            </p>
            <Link
              href="/fame/rotate"
              className="mt-4 inline-flex min-h-11 items-center text-amber-100 underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-amber-300"
            >
              Retry
            </Link>
          </section>
        ) : null}
      </div>
    </main>
  );
}
