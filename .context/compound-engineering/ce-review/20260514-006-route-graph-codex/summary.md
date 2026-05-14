# Code Review: Todo 006 Richer FAME Swap Route Graph

Date: 2026-05-14
Mode: headless, current checkout, scoped to todo 006 route metadata and graph UI changes.

## Scope

- `src/features/fame-swap/ui/routeMetadata.ts`
- `src/features/fame-swap/ui/routeMetadata.test.ts`
- `src/features/fame-swap/ui/poolDisplay.ts`
- `src/features/fame-swap/ui/quoteView.ts`
- `src/features/fame-swap/ui/quoteView.test.ts`
- `src/features/fame-swap/components/RouteMap.tsx`
- `src/features/fame-swap/components/RouteMap.test.tsx`
- `docs/plans/2026-05-14-008-fame-swap-richer-route-graph-plan.md`

## Findings

No P1/P2 findings.

## Checks

- Correctness: route metadata is derived through shared helpers and ready quotes still fail closed when fee metadata is unavailable.
- Testing: artifact-driven tests now fail when pinned route tokens or pools lack reviewed display metadata; the route graph component render path is covered.
- Maintainability: token metadata, pool metadata, quote-view projection, and component rendering have separate responsibilities.
- UI/accessibility: raw pool IDs are collapsed behind an inspector disclosure with an icon-only copy affordance; token nodes use stable badge dimensions and wrapping labels.

## Verification

- `bun test src/features/fame-swap/ui/routeMetadata.test.ts src/features/fame-swap/ui/quoteView.test.ts src/features/fame-swap/components/RouteMap.test.tsx src/features/fame-swap/components/FameSwapWidget.test.ts src/features/fame-swap/solver/poolUniverse.test.ts src/features/fame-swap/solver/quotes/rankRoutes.test.ts`
- `yarn lint --file src/features/fame-swap/ui/routeMetadata.ts --file src/features/fame-swap/ui/routeMetadata.test.ts --file src/features/fame-swap/ui/poolDisplay.ts --file src/features/fame-swap/ui/quoteView.ts --file src/features/fame-swap/ui/quoteView.test.ts --file src/features/fame-swap/components/RouteMap.tsx --file src/features/fame-swap/components/RouteMap.test.tsx`
- `./node_modules/.bin/prettier --check src/features/fame-swap/ui/routeMetadata.ts src/features/fame-swap/ui/routeMetadata.test.ts src/features/fame-swap/ui/poolDisplay.ts src/features/fame-swap/ui/quoteView.ts src/features/fame-swap/ui/quoteView.test.ts src/features/fame-swap/components/RouteMap.tsx src/features/fame-swap/components/RouteMap.test.tsx docs/plans/2026-05-14-008-fame-swap-richer-route-graph-plan.md`
- `git diff --check -- src/features/fame-swap/ui/routeMetadata.ts src/features/fame-swap/ui/routeMetadata.test.ts src/features/fame-swap/ui/poolDisplay.ts src/features/fame-swap/ui/quoteView.ts src/features/fame-swap/ui/quoteView.test.ts src/features/fame-swap/components/RouteMap.tsx src/features/fame-swap/components/RouteMap.test.tsx docs/plans/2026-05-14-008-fame-swap-richer-route-graph-plan.md`

## Visual Note

The dev server started on `http://localhost:3001` with dummy local RPC environment values, and `/fame/swap` rendered the widget shell. The normal ready route graph state still requires a connected wallet address, so the full graph state was verified through the component render test and route-view model tests rather than browser interaction.

Review complete.
