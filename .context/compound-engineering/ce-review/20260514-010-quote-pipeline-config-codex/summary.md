# Code Review: Todo 010 Quote Pipeline And Config Cleanup

Date: 2026-05-14
Mode: headless, current checkout, scoped to todo 010 quote projection and router config cleanup.

## Scope

- `src/features/fame-swap/config.ts`
- `src/features/fame-swap/config.test.ts`
- `src/features/fame-swap/solver/quote.ts`
- `src/features/fame-swap/solver/quote.test.ts`
- `docs/plans/2026-05-14-010-fame-swap-quote-pipeline-config-cleanup-plan.md`

## Findings

No P1/P2 findings.

## Checks

- Correctness: sync and async quote entrypoints now share precheck/readiness gating and solver-result projection, while keeping separate sync and async solver/ranker implementations.
- Safety: blocked readiness, unsupported pairs, no-safe-route results, and quote-adapter failures still return non-executable quote states.
- Config: the production router default now comes from generated wagmi address data, with the existing environment override preserved for local and fork development.
- Testing: equivalence coverage compares sync and async ready, unsupported, no-safe-route, and not-live-ready quote projections; config coverage verifies generated default, valid override, and invalid override fallback.
- Scope: route selection, route math, slippage math, fee math, API response shape, and generated wagmi files were not changed.

## Verification

- `bun test src/features/fame-swap/config.test.ts src/features/fame-swap/solver/quote.test.ts`
- `bun test src/features/fame-swap/config.test.ts src/features/fame-swap/solver/quote.test.ts src/app/api/fame/swap/quote/route.test.ts scripts/fame-swap-route-lab.test.ts src/features/fame-swap/solver/amountSolver.test.ts src/features/fame-swap/solver/quotes/rankRoutes.test.ts`
- `yarn lint --file src/features/fame-swap/config.ts --file src/features/fame-swap/config.test.ts --file src/features/fame-swap/solver/quote.ts --file src/features/fame-swap/solver/quote.test.ts`
- `./node_modules/.bin/prettier --check src/features/fame-swap/config.ts src/features/fame-swap/config.test.ts src/features/fame-swap/solver/quote.ts src/features/fame-swap/solver/quote.test.ts docs/plans/2026-05-14-010-fame-swap-quote-pipeline-config-cleanup-plan.md`
- `git diff --check -- src/features/fame-swap/config.ts src/features/fame-swap/config.test.ts src/features/fame-swap/solver/quote.ts src/features/fame-swap/solver/quote.test.ts docs/plans/2026-05-14-010-fame-swap-quote-pipeline-config-cleanup-plan.md`
- `rg "as any|as unknown" src/features/fame-swap/config.ts src/features/fame-swap/config.test.ts src/features/fame-swap/solver/quote.ts src/features/fame-swap/solver/quote.test.ts`

Review complete.
