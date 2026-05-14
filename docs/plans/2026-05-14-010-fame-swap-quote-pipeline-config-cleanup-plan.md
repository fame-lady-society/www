---
title: "refactor: Simplify FAME swap quote pipeline and config"
type: refactor
status: complete
date: 2026-05-14
source_todo: .context/compound-engineering/todos/010-complete-p2-simplify-quote-pipeline-and-config-sources.md
---

# refactor: Simplify FAME Swap Quote Pipeline And Config

## Overview

Reduce drift between sync and async FAME quote paths by sharing quote precheck and solver-result projection, and source the default FAME router address from generated wagmi contract address data. Keep the current sync and async solver entrypoints intact so this remains a low-risk cleanup.

## Requirements Trace

- Todo `010`: shared helper coverage proves sync and async status mapping, fee projection, warnings, and materialization remain equivalent.
- Todo `010`: production quote path still cannot return executable quotes from deterministic hard-cap profiles.
- Todo `010`: default FAME router address comes from generated wagmi address data, with env override only for fork/local development.
- Todo `010`: existing route lab, API, and focused solver tests pass after cleanup.

## Current-State Findings

- `quoteFameSwap` and `quoteFameSwapAsync` duplicate amount/pair/readiness/recipient prechecks and solved-status projection.
- `solveFameSwapAmount` and `solveFameSwapAmountAsync` already return the same `FameAmountSolverResult` shape, so quote projection can be shared without rewriting ranking.
- `config.ts` hard-codes the production router address even though `src/wagmi/index.ts` already exports `fameRouterAddress`.

## Scope Boundaries

- Do not collapse sync and async rankers into one async-only implementation.
- Do not change route selection, quote math, slippage math, or API response shape.
- Do not remove env override support for fork/local development.
- Do not change generated `src/wagmi/index.ts`.

## Implementation Units

- [x] **Unit 1: Share Quote Precheck And Projection**

**Files:**

- Modify: `src/features/fame-swap/solver/quote.ts`
- Test: `src/features/fame-swap/solver/quote.test.ts`

**Approach:**

- Extract shared preparation for amount, pair, readiness, recipient, deadline, and slippage.
- Extract shared projection from `FameAmountSolverResult` into `FameSwapQuote`.
- Add an equivalence test comparing sync and async deterministic quotes across ready, unsupported, no-safe-route, and not-live-ready statuses.

- [x] **Unit 2: Source Router Address From Wagmi**

**Files:**

- Modify: `src/features/fame-swap/config.ts`
- Add: `src/features/fame-swap/config.test.ts`

**Approach:**

- Set `DEFAULT_FAME_ROUTER_ADDRESS` from `fameRouterAddress[base.id]`.
- Keep `NEXT_PUBLIC_FAME_ROUTER_ADDRESS` as the documented fork/local override.
- Add tests for generated default, valid env override, and invalid override fallback.

- [x] **Unit 3: Review, Verify, And Close Todo**

**Files:**

- Modify: `.context/compound-engineering/todos/010-complete-p2-simplify-quote-pipeline-and-config-sources.md`
- Optional: this plan file completion notes.

**Approach:**

- Run config, quote, API, route-lab, and focused solver tests.
- Run formatting/lint checks for touched files.
- Run a review pass and fix P1/P2 findings.
- Mark todo `010` complete only after verification passes.

## Verification Plan

- `bun test src/features/fame-swap/config.test.ts src/features/fame-swap/solver/quote.test.ts src/app/api/fame/swap/quote/route.test.ts scripts/fame-swap-route-lab.test.ts src/features/fame-swap/solver/amountSolver.test.ts src/features/fame-swap/solver/quotes/rankRoutes.test.ts`
- `yarn lint --file src/features/fame-swap/config.ts --file src/features/fame-swap/config.test.ts --file src/features/fame-swap/solver/quote.ts --file src/features/fame-swap/solver/quote.test.ts`
- `./node_modules/.bin/prettier --check src/features/fame-swap/config.ts src/features/fame-swap/config.test.ts src/features/fame-swap/solver/quote.ts src/features/fame-swap/solver/quote.test.ts docs/plans/2026-05-14-010-fame-swap-quote-pipeline-config-cleanup-plan.md`

## Risks

| Risk                                        | Likelihood | Impact | Mitigation                                                                                                      |
| ------------------------------------------- | ---------- | ------ | --------------------------------------------------------------------------------------------------------------- |
| Shared projection changes ready quote shape | Medium     | High   | Compare sync and async deterministic ready quotes across route hash, fees, warnings, and route materialization. |
| Failure statuses drift during extraction    | Medium     | Medium | Cover unsupported, no-safe-route, and not-live-ready statuses in equivalence tests.                             |
| Config import pulls generated client code   | Low        | Medium | Import only generated address constants, not hooks or client runtime.                                           |
| Env override behavior breaks local forks    | Low        | Medium | Add explicit config tests for valid override and invalid override fallback.                                     |

## Completion Notes

- Extracted shared quote request preparation and solver-result projection used by both `quoteFameSwap` and `quoteFameSwapAsync`.
- Added sync/async equivalence tests for ready, unsupported, no-safe-route, and not-live-ready quote states, including route materialization, fee projection, warnings, and non-executable blocked states.
- Sourced `DEFAULT_FAME_ROUTER_ADDRESS` from generated `fameRouterAddress[base.id]` and kept `NEXT_PUBLIC_FAME_ROUTER_ADDRESS` as the local/fork override.
- Added config tests for generated default, valid override, and invalid override fallback.
- Completed review in `.context/compound-engineering/ce-review/20260514-010-quote-pipeline-config-codex/summary.md` with no P1/P2 findings.
- Verification passed for config, quote, API, route-lab, focused solver tests, lint, formatting, diff check, and unsafe-cast scan.
