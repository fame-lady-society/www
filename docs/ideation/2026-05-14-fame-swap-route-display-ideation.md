---
date: 2026-05-14
topic: fame-swap-route-display
focus: "Compact visual display of selected FAME swap routes as token and pool node graphs, with split and merge support, visual annotations, image assets, and inspectable examples."
status: active
inputs:
  - docs/images/routev0.png
  - docs/brainstorms/2026-05-13-fame-swap-widget-ui-ux-requirements.md
  - docs/plans/2026-05-13-002-feat-fame-swap-widget-ux-plan.md
  - docs/plans/2026-05-14-008-fame-swap-richer-route-graph-plan.md
  - docs/ideation/2026-05-14-fame-swap-quoter-solver-audit-ideation.md
---

# Ideation: FAME Swap Route Display

## Codebase Context

`docs/images/routev0.png` shows the current selected route display as a repeated row list: token box, horizontal rail, pool metadata, arrow, token box. It explains a single serial path, but it does not look like a route graph and will not scale cleanly to split and merge routes.

The current app is a Next.js 14 / React 18 app with MUI, TailwindCSS, wagmi, and viem. The FAME swap implementation lives under `src/features/fame-swap`. The key current display path is:

- `src/features/fame-swap/components/FameSwapWidget.tsx` renders `FameSwapRouteMap`.
- `src/features/fame-swap/components/RouteMap.tsx` renders the current route display.
- `src/features/fame-swap/ui/quoteView.ts` converts a ready quote into `FameSwapRouteMap`.
- `src/features/fame-swap/ui/routeMetadata.ts` has local token display metadata for known route tokens.
- `src/features/fame-swap/ui/poolDisplay.ts` has reviewed pool venue, pool type, pair, and fee-label metadata.
- `src/features/fame-swap/solver/routeCorpus.ts` defines route cases useful for an examples page.

The model already exposes enough to start: ordered route legs, token in/out, venue, pool IDs, pool type labels, fee labels, `capabilities.split`, `capabilities.splitThenMerge`, `allocationBps` on candidate display legs, and quoted per-leg amounts in `feeBreakdown`. The missing piece is a graph-facing view model that treats the route as nodes and edges instead of independent rows.

Past route UI work intentionally avoided inventing unavailable split percentages. That constraint has changed partially because generated candidates now carry `allocationBps` and quoted legs carry actual amounts. The route graph should still avoid pretending "remaining" is a percentage unless the selected route provides a defensible split or amount.

There is no `docs/solutions/` directory in this repo, so there was no separate learnings corpus to search. Relevant prior context comes from the route UI plan and solver audit docs listed above.

No external token image or token-list research was performed in this ideation pass. The asset-fetching ideas below should be validated in a follow-up implementation or brainstorm because runtime external image fetches are a reliability and privacy risk.

## Ranked Ideas

### 1. Route Topology View Model

**Description:** Add a graph-specific route view model between `quoteView.ts` and the renderer. It should normalize a selected route into token nodes, pool edges, graph columns, lane indices, merge groups, allocation labels, amount labels, and inspector metadata. The current row model can be preserved as a fallback while the graph model becomes the primary API for richer rendering.

**Rationale:** This is the highest-leverage foundation. The current `FameSwapRouteMap` is an ordered edge list; split and split-merge routes need a topology model so the renderer can know when two edges leave the same token, when branches rejoin, and how to align lanes without reverse-engineering layout from display strings. Keeping this pure and tested also makes examples pages, visual regression, and future renderers cheaper.

**Downsides:** It creates another display-layer abstraction. The implementation must stay narrow and derived only from selected quote data, not from unselected graph candidates or private operator evidence.

**Confidence:** 94%

**Complexity:** Medium

**Status:** Unexplored

### 2. Compact React SVG Route Graph

**Description:** Replace the row-like route map with a compact SVG graph renderer: token image nodes sit in columns, pool edges are curved or straight rails between columns, split branches occupy separate lanes, and merge branches visibly converge. Arrow stroke width represents defensible split share or leg input share, while labels show pool type, venue, fee tier, and percent/amount where available.

**Rationale:** A custom React SVG renderer fits the current graph size better than adopting a heavy graph library immediately. FAME routes are bounded, directed, and small. SVG gives accessible labels, deterministic screenshots, responsive scaling, and enough control to encode pool type with borders, patterns, and labels.

**Downsides:** Custom layout is real UI logic. It should not grow into a general graph engine; if future routes become arbitrary DAGs, the team should revisit D3/Sankey layout.

**Confidence:** 90%

**Complexity:** Medium

**Status:** Unexplored

### 3. Route Examples Gallery At `/fame/liquidity/examples`

**Description:** Add an internal inspection page, preferably `/fame/liquidity/examples`, that renders curated route graph fixtures from route corpus and artifact examples: single path, multi-hop serial path, direct split, split-then-merge, native ETH path, unknown-token fallback, missing-logo fallback, and narrow mobile width. Include route IDs, fixture selectors, theme controls if practical, and stable test hooks for `agent-browser`.

**Rationale:** This directly supports design review and agent/browser inspection without needing wallet connection, live RPC, or a successful quote flow. It also gives users and implementers a way to evaluate multi-leg display cases that are rare in normal manual testing.

**Downsides:** It is a non-user-facing route unless intentionally linked. It must avoid becoming a second quote implementation; fixtures should use the same route display model as the swap widget.

**Confidence:** 92%

**Complexity:** Low-Medium

**Status:** Unexplored

### 4. Token And Pool Visual Asset Registry

**Description:** Create a local asset registry for route tokens and generated pool icons. Token entries should map known addresses to local images under `public/images/fame-swap/tokens/`, with initials/color fallback preserved. Pool visuals should be generated composites: a cross-section of token A and token B with border color or pattern indicating pool family/type.

**Rationale:** Token images make the route glanceable, while pool icons communicate "this edge is a pool between these assets" without relying on inconsistent DEX or pool logos. Because the route token set is known and small, local caching is safer than runtime external image loading.

**Downsides:** Asset sourcing and licensing need review. ERC20 metadata usually provides name/symbol/decimals, not images, so onchain metadata should be treated as supplementary. Token lists or trusted repositories may provide logo URIs, but they should be fetched by a controlled script and committed or cached locally with provenance.

**Confidence:** 86%

**Complexity:** Medium

**Status:** Unexplored

### 5. Visual Semantics Contract

**Description:** Define a compact visual language before implementation: token nodes use image discs with symbol labels; pool edges use border or stroke pattern by pool type; venue family gets a small label; fee tier is secondary; arrow thickness maps to selected branch share; dashed or lighter rails indicate "remaining" or amount not known; technical pool IDs stay collapsed behind an inspector.

**Rationale:** The display needs to be dense without becoming decorative. A small visual contract prevents ad hoc color use, keeps split/merge annotations consistent, and lets tests assert semantic labels even when exact coordinates change.

**Downsides:** Up-front design constraints can slow the first renderer. The contract should be treated as implementation guidance, not a large design system.

**Confidence:** 89%

**Complexity:** Low

**Status:** Unexplored

### 6. Design Review And Browser Verification Gate

**Description:** Require design review during implementation using the examples gallery and `/fame/swap`. Capture desktop and mobile screenshots with `agent-browser`; check light/dark modes if feasible; verify no overlapping labels, no blank images, readable arrow labels, and stable compact layout for all fixture shapes.

**Rationale:** The route graph is a visual comprehension feature. Automated unit tests can prove metadata coverage, but screenshots are needed to catch cramped lanes, clipped labels, bad pool icon contrast, and arrow thickness that overpowers the widget.

**Downsides:** Adds implementation time and may require a local dev server. The examples gallery reduces this cost by avoiding wallet and RPC dependencies.

**Confidence:** 93%

**Complexity:** Low

**Status:** Unexplored

### 7. Renderer Tech Stack Spike

**Description:** Start with plain React SVG. Only add D3 modules if they solve a specific problem: `d3-shape` for link curves, `d3-scale` for thickness/spacing, or a Sankey layout if the topology model outgrows simple columns and lanes. Avoid React Flow, canvas, Cytoscape, or full force-directed graph stacks for the first implementation.

**Rationale:** The current route graph is not a freeform network; it is a small directed swap route. A custom SVG keeps bundle size, accessibility, and design control aligned with the app. This also leaves room to adopt D3 surgically without committing the whole UI to a graph library.

**Downsides:** If future route selection grows into larger arbitrary DAGs, the custom renderer may need to be replaced or backed by a stronger layout library.

**Confidence:** 85%

**Complexity:** Low

**Status:** Unexplored

## Rejection Summary

| #   | Idea                                                                      | Reason Rejected                                                                                                                             |
| --- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Adopt React Flow for the first route display                              | Too heavy for a tiny bounded route graph and likely to look like an editor rather than a compact swap widget.                               |
| 2   | Render the graph on canvas                                                | Hurts accessibility, text quality, screenshots, and click/tooltip behavior for little benefit at current graph sizes.                       |
| 3   | Fetch token logos from arbitrary URLs at runtime                          | Introduces broken-image, tracking, CORS, latency, and reliability risks inside the swap flow.                                               |
| 4   | Use pool logos from DEXs as primary pool identity                         | Pools usually do not have stable user-recognizable logos; generated token cross-section icons communicate the pair more directly.           |
| 5   | Store every Base token image in `public`                                  | Scope is too broad; the FAME route token set is known and should stay curated.                                                              |
| 6   | Use deprecated Graph/subgraph data for metadata                           | Project docs say Graph endpoints are offline and should not receive new work.                                                               |
| 7   | Put raw pool IDs and hashes on every visible edge                         | Duplicates diagnostics and makes the graph technical before it is readable. Keep them in an inspector.                                      |
| 8   | Animate route flow in the first pass                                      | Nice but not needed to prove comprehension; it risks distracting from amount/share labels and design review.                                |
| 9   | Build a general pool/liquidity explorer before the route graph            | Adjacent but larger than the requested route display; the examples page should stay focused on route inspection.                            |
| 10  | Use only token symbols and skip images                                    | Already close to the current initials badges and misses the user's visual coding goal.                                                      |
| 11  | Infer split percentages from SVG lane widths when quote data lacks shares | Misleading. Width and labels must come from `allocationBps`, leg inputs, or an explicit unavailable state.                                  |
| 12  | Make D3 Sankey the default renderer immediately                           | The shape is Sankey-like, but current routes are small enough for deterministic custom layout. Revisit only if custom lanes become brittle. |

## Suggested Next Brainstorm Seeds

1. Exact topology view model shape for route graph rendering.
2. Visual semantics for token images, pool cross-section icons, pool type borders, and split/merge labels.
3. `/fame/liquidity/examples` fixture set and design-review workflow.
4. Controlled token/pool asset cache script and provenance rules.

## Session Log

- 2026-05-14: Initial fresh ideation. Grounded in current route screenshot, route map implementation, quote view model, token/pool metadata, route corpus, and prior FAME swap UI/solver docs. Generated 26 candidate ideas; kept 7 survivors and rejected 12 explicit alternatives.
- 2026-05-14: Brainstormed the survivor set into `docs/brainstorms/2026-05-14-fame-swap-route-display-requirements.md`.
