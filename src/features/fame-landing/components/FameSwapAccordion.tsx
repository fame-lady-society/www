"use client";

import Link from "next/link";
import { useEffect, useState, type ComponentType } from "react";

type EmbeddedModule = { default: ComponentType };

export function FameSwapAccordion() {
  const [open, setOpen] = useState(false);
  const [module, setModule] = useState<EmbeddedModule | null>(null);
  const [error, setError] = useState(false);
  const load = () => {
    setError(false);
    void import("./EmbeddedFameSwap")
      .then((loaded) => setModule(loaded))
      .catch(() => setError(true));
  };

  useEffect(() => {
    if (open && !module && !error) load();
  }, [open, module, error]);
  const Embedded = module?.default;
  return (
    <section
      className="border border-[#8e762c]"
      aria-labelledby="fame-swap-trigger"
    >
      <button
        id="fame-swap-trigger"
        type="button"
        aria-expanded={open}
        aria-controls="fame-swap-panel"
        className="min-h-12 w-full px-4 py-3 text-left font-semibold text-[#fff5d8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[#f5d46d]"
        onClick={() => setOpen((value) => !value)}
      >
        Swap now
      </button>
      {open ? (
        <div
          id="fame-swap-panel"
          role="region"
          aria-live="polite"
          className="border-t border-[#8e762c] p-4"
        >
          {!Embedded && !error ? <p>Loading swap…</p> : null}
          {error ? (
            <p>
              Swap could not load.{" "}
              <button type="button" className="underline" onClick={load}>
                Retry
              </button>{" "}
              or{" "}
              <Link className="underline" href="/fame/swap">
                open the full swap page
              </Link>
              .
            </p>
          ) : null}
          {Embedded ? <Embedded /> : null}
        </div>
      ) : null}
    </section>
  );
}
