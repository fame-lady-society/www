---
mode: headless
scope: todo-007-protocol-quoter-coverage
status: complete
---

# Code Review: Todo 007 Protocol Coverage

## Review Scope

- `src/features/fame-swap/solver/quotes/*`
- `src/features/fame-swap/solver/graph/edgeMatrix.ts`
- `scripts/fame-swap-route-lab.ts`
- `src/app/api/fame/swap/quote/route.ts`
- `src/features/fame-swap/hooks/useFameSwapQuote.ts`
- `src/features/fame-swap/solver/readiness.ts`
- `docs/fame-swap-route-lab.md`

## P1/P2 Findings

None remaining after fixes.

## Fixes Applied During Review

- Hardened live adapter, readiness, route API, hook, edge-matrix, and route-lab diagnostic sanitizers for provider URLs, bearer/token strings, and long raw hex.
- Kept V4 `StateView.getLiquidity` as non-gating evidence by capping the evidence read timeout and overlapping it with the V4 quote call.
- Escaped Markdown table pipe characters in route-lab edge and protocol coverage output.
- Corrected selected-edge fallback attribution in protocol coverage when retained selected-leg evidence is unavailable.
- Replaced stale todo-007 Slipstream2 wording in route-lab docs with a separate future-validation statement.

## Verification

- `./node_modules/.bin/prettier --check ...` passed for the touched 007 files.
- `bun test src/features/fame-swap/solver/quotes/liveAdapters.test.ts src/features/fame-swap/solver/quotes/snapshotAdapter.test.ts src/features/fame-swap/solver/quotes/rankRoutes.test.ts src/features/fame-swap/solver/graph/edgeMatrix.test.ts scripts/fame-swap-route-lab.test.ts src/app/api/fame/swap/quote/route.test.ts src/features/fame-swap/solver/amountSolver.test.ts src/features/fame-swap/hooks/useFameSwapQuote.test.ts src/features/fame-swap/solver/readiness.test.ts` passed.
- `bun scripts/fame-swap-route-lab.ts --markdown` passed in recorded mode.

## Residual Risk

- Fresh live route-lab and live simulation commands were not run from this shell because neither `BASE_RPC_URL` nor `NEXT_PUBLIC_BASE_RPC_URL_1` is configured.
