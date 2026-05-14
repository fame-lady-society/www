"use client";

import Typography from "@mui/material/Typography";
import { FAME_SWAP_ROUTE_GRAPH_EXAMPLES } from "../ui/routeGraphExamples";
import { FameSwapRouteGraph } from "./RouteGraph";

export function RouteGraphExamplesPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-3 py-8 text-slate-950 dark:bg-slate-950 dark:text-slate-50 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-5">
        <section className="grid gap-1">
          <Typography variant="h4" component="h1" fontWeight={800}>
            FAME route examples
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Display-safe fixtures for serial, split, merge, native ETH, and
            fallback route states.
          </Typography>
        </section>

        <section
          aria-label="Route graph fixtures"
          className="grid gap-4"
          data-testid="fame-route-graph-examples"
        >
          {FAME_SWAP_ROUTE_GRAPH_EXAMPLES.map((example) => (
            <article
              className="grid gap-3 rounded-lg border border-black/10 bg-white/80 p-4 shadow-sm dark:border-white/15 dark:bg-black/20"
              data-route-example={example.id}
              data-route-kind={example.kind}
              key={example.id}
            >
              <div className="grid gap-1 sm:grid-cols-[1fr_auto] sm:items-start">
                <div>
                  <Typography variant="subtitle1" fontWeight={800}>
                    {example.label}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    {example.note}
                  </Typography>
                </div>
                <Typography
                  color="text.secondary"
                  sx={{ fontWeight: 700, overflowWrap: "anywhere" }}
                  variant="caption"
                >
                  {example.routeArtifactId ?? example.corpusId ?? "fixture"}
                </Typography>
              </div>
              <FameSwapRouteGraph graph={example.graph} />
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
