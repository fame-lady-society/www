---
date: 2026-05-14
topic: fame-swap-route-display
origin: docs/ideation/2026-05-14-fame-swap-route-display-ideation.md
status: ready-for-planning
---

# FAME Swap Route Display Requirements

## Problem Frame

The current `/fame/swap` route display explains selected liquidity as repeated leg rows. That is readable for a single serial route, but it does not visually communicate the route as a graph. Split and split-then-merge routes need users and reviewers to see branches diverge, run in separate lanes, and rejoin without parsing debug diagnostics.

This work should turn the route section into a compact, product-facing node graph. It should stay grounded in selected quote data, keep raw technical identifiers secondary, and provide an inspectable examples page so design review and agent-browser verification can evaluate route shapes without wallet or live RPC dependencies.

The feature supplements `docs/brainstorms/2026-05-13-fame-swap-widget-ui-ux-requirements.md`; it does not reopen the full swap widget scope.

```mermaid
flowchart TB
  Quote[Selected ready quote] --> Model[Route graph view model]
  Model --> Widget[Swap widget route graph]
  Model --> Examples[/fame/liquidity/examples]
  Assets[Local token and pool assets] --> Widget
  Assets --> Examples
  Widget --> Inspect[Collapsed technical inspector]
  Examples --> Review[Design and browser review]
```

## Requirements

**Route Graph Comprehension**

- R1. The normal route section must render selected routes as a node graph, not as a table or repeated row list.
- R2. Token nodes must be visually distinct from pool edges and must include both a compact visual mark and a readable token symbol.
- R3. A serial route must read as one connected row or lane of token nodes and pool edges in execution order.
- R4. A split route must show branches diverging from the shared input token and running on separate lanes before reaching their output token.
- R5. A split-then-merge route must show separate branch lanes that visibly converge before the shared merge leg or output token.
- R6. The graph must keep a compact route summary visible so the route remains understandable when the graph is visually dense or collapsed.

**Data Honesty And Labels**

- R7. The graph may only show route shape, split share, amount share, fee tiers, venue labels, pool types, and output labels when those values are present in selected quote, route, pool, or reviewed metadata.
- R8. If a branch uses an `All` or "remaining" amount without a defensible percentage, the graph must label it as remaining or unavailable rather than inventing a percentage.
- R9. Arrow or edge thickness may encode branch share only when backed by `allocationBps`, selected-leg input amounts, or another explicit selected-route value.
- R10. Per-edge labels must prioritize pool type, token pair, venue family, and fee tier over raw pool IDs or hashes.
- R11. Venue fee labels must remain clear that venue fees are included in the quoted output and are backed by reviewed metadata or quote evidence, not guessed live reads.

**Visual Coding**

- R12. Token visuals must prefer local token images when available and fall back to the existing symbol/initial badge model when unavailable.
- R13. Pool visuals must communicate the token pair, such as a cross-section or split icon of token A and token B, without depending on third-party pool logos.
- R14. Pool type must have a stable visual code, such as border color, stroke pattern, or small type label, for constant-product, stable, concentrated-liquidity, and hook or PoolManager pools, and must not rely on color alone.
- R15. The graph must avoid one-off decorative styling; colors, stroke widths, labels, and fallback marks must be defined as a small route-display visual language.
- R16. Technical details such as full pool IDs, route artifact IDs, and hashes must remain accessible through a collapsed inspector or diagnostics path, not as the primary visible route story.

**Examples And Inspection**

- R17. A route inspection page must be available at `/fame/liquidity/examples`.
- R18. The examples page must render the same graph display model used by the swap widget, not a separate mock-only visualization.
- R19. The examples page must include fixtures for at least: single-hop, multi-hop serial, direct split, split-then-merge, native ETH, missing token image fallback, and unknown token fallback.
- R20. The examples page must be usable without wallet connection, live quote RPC, or user signing.
- R21. The examples page must expose stable route labels or test hooks so `agent-browser` and human reviewers can target each fixture reliably.
- R21a. The examples page must use display-safe fixture data and must not expose reusable raw calldata, private RPC configuration, wallet-specific data, or secrets.

**Asset Acquisition And Caching**

- R22. Token and pool visual assets used by the graph must be local app assets at runtime, not hotlinked third-party images.
- R23. Any online or onchain asset discovery must happen through a controlled fetch/cache step with explicit provenance, reviewable output, and deterministic fallback behavior.
- R24. The cached asset set should be scoped to tokens and pool types used by known FAME swap routes, not every Base token.
- R25. Missing, broken, untrusted, or unavailable token images must never block quote display or route inspection; the fallback badge must remain first-class.
- R25a. Fetched or generated image assets must be constrained by type and size, sanitized or converted to safe static image formats, and exclude executable or unreviewed SVG content from the runtime asset set.

**Responsive, Accessible, And Inspectable UI**

- R26. The graph must avoid text overlap, clipped labels, and horizontal scrolling for normal supported routes on mobile and desktop.
- R27. Mobile may use a vertically stacked or compressed graph variant as long as split and merge relationships remain visible.
- R28. Interactive graph affordances, including inspectors and copy buttons, must be keyboard reachable, have accessible names, and preserve at least 44px tap targets where they appear as controls.
- R29. The graph must provide a semantic text or list fallback for screen readers that includes route order, branch structure, token symbols, venue labels, and pool labels.
- R30. The graph must work in the app's light and dark themes with sufficient contrast for token visuals, pool borders, labels, and arrow thickness.

**Verification And Design Review**

- R31. Unit or component tests must cover graph view-model behavior for serial, split, split-then-merge, unavailable-share, and fallback-token cases.
- R32. Metadata coverage tests must fail when known route tokens or pools lack required display metadata or documented fallback behavior.
- R33. Browser verification must cover the examples page and `/fame/swap` on desktop and mobile widths.
- R34. Design review is required before completion and must inspect the examples page for route readability, split/merge legibility, asset fallback quality, and label overlap in light and dark themes where feasible.
- R35. The implementation must preserve existing swap safety tests and must not change route selection, quote math, fee math, approval behavior, or transaction submission behavior.

## Success Criteria

- A reviewer can identify the selected route shape at a glance: serial path, split, or split-then-merge.
- A user can understand which tokens and pools are involved without opening diagnostics.
- Split and merge routes show branch structure honestly without fake percentages.
- Token and pool visuals make the route more scannable while retaining reliable fallbacks.
- `/fame/liquidity/examples` lets an agent or human inspect every required route shape without a wallet.
- The graph remains readable on mobile and desktop in light and dark themes.
- Automated tests, formatting, lint checks, and browser/design review either pass or have explicit documented blockers.

## Scope Boundaries

- This work does not change the router, solver, candidate generation, quote ranking, fee calculations, readiness policy, approval flow, or swap submission.
- This work does not turn `/fame/swap` into a general liquidity explorer.
- This work does not support arbitrary non-FAME token pairs beyond what the selected quote flow already supports.
- This work does not require runtime token image fetching in the user-facing swap flow.
- This work does not require a full graph library, force-directed graph, canvas renderer, or editor-like graph UI unless planning proves the simple graph model cannot satisfy the requirements.
- This work does not require complete online asset discovery before the graph can ship; badge fallbacks are acceptable when image provenance is unresolved.

## Key Decisions

- Build the graph from selected quote data: This keeps user-facing route display aligned with executable quote evidence and avoids presenting unselected candidate or operator-only diagnostics as if they were the route.
- Keep examples separate from wallet flow: A fixture-backed examples page gives design review reliable coverage for uncommon route shapes without requiring wallet signing or live RPC.
- Prefer local assets at runtime: Cached token and generated pool visuals avoid broken third-party images, tracking concerns, and layout instability in the swap flow.
- Treat SVG or equivalent deterministic markup as the baseline direction: The route shapes are small and bounded, so planning should only add D3 or another graphing library for a specific proven layout need.
- Preserve diagnostics as secondary: Technical IDs remain accessible, but the primary route story is tokens, pools, venues, fees, and branch structure.

## Dependencies / Assumptions

- Current selected quote data exposes enough route leg, pool, venue, fee, token, and capability metadata to derive the first route graph model.
- Known route token and pool metadata is currently centralized enough to support coverage tests.
- Asset licensing and provenance for token images must be reviewed before committing fetched images.
- Browser automation can inspect examples and read-only `/fame/swap` states, but wallet signing remains a human-assisted boundary.

## Alternatives Considered

| Alternative                                     | Decision | Rationale                                                                                                                         |
| ----------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Keep the current row display and improve labels | Rejected | Better labels do not solve split and merge comprehension.                                                                         |
| Use React Flow or an editor-style graph library | Deferred | Too heavy and visually mismatched for a compact route widget.                                                                     |
| Use canvas rendering                            | Rejected | Worse for text, accessibility, screenshots, and inspectors at this graph size.                                                    |
| Hotlink token logos at runtime                  | Rejected | Adds reliability, privacy, CORS, and broken-image risks to the swap flow.                                                         |
| Require perfect token images before shipping    | Rejected | The known token set can improve over time; robust fallback badges are enough for first release.                                   |
| Default to D3 Sankey                            | Deferred | The route is Sankey-like, but current routes are bounded enough for deterministic custom layout unless planning proves otherwise. |

## Outstanding Questions

### Resolve Before Planning

None.

### Deferred to Planning

- [Affects R9][Technical] Decide the exact precedence for branch thickness labels when both `allocationBps` and selected-leg input amounts are available.
- [Affects R12, R22, R23][Needs research] Choose approved token-image sources and provenance rules for the first cached asset set.
- [Affects R13, R14][Design] Define the first pool icon and pool type visual language, including dark-mode contrast.
- [Affects R17, R19, R21a][Technical] Decide whether examples are generated from existing route artifacts, route corpus cases, hand-authored fixtures, or a mix, while keeping the example data display-safe.
- [Affects R33, R34][Technical] Define the exact browser verification matrix and screenshot capture locations.

## Next Steps

-> `/ce:plan docs/brainstorms/2026-05-14-fame-swap-route-display-requirements.md` for structured implementation planning.
