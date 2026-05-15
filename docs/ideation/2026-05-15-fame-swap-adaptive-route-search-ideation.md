---
date: 2026-05-15
topic: fame-swap-adaptive-route-search
focus: "Todo 013: adaptive route search after the baseline optimizer"
source_todo: .context/compound-engineering/todos/013-complete-p2-add-adaptive-route-search-algorithms.md
---

# Ideation: FAME Swap Adaptive Route Search

## Codebase Context

The baseline route allocation optimizer from todo `012` is now present under `src/features/fame-swap/solver/optimizer/`.

- `templates.ts` generates single-path, direct-split, terminal-split, and split-merge templates.
- `search.ts` runs bounded coarse-grid allocation trials plus local refinement and keeps `maxTemplates: 32`.
- `quoteRunAdapter.ts` provides request-scoped exact-quote and state-read memoization.
- `scripts/fame-swap-route-lab.ts` already emits optimizer trials and quote-plan stats.
- NativeWrap is live as venue ordinal `6`, and Aerodrome V2 is now a distinct venue family ordinal `7`.

The next useful step is not a bigger graph. It is smarter search over the templates that are already executable.

## Raw Candidate Pool

1. Add algorithm and stop-reason fields to optimizer evidence.
2. Use ternary/golden-section search for smooth two-branch curves.
3. Use coarse grid as the oracle and fallback path whenever adaptive assumptions fail.
4. Add non-unimodal detection from the baseline samples.
5. Treat quote failures near the best sample as a hard adaptive fallback trigger.
6. Add bounded coordinate descent for 3+ branch templates.
7. Keep N-way branch count capped before materialization to avoid combinatorial growth.
8. Extend materialization to N-way flat legs with sequential Exact shares plus final All.
9. Add route-lab stop reasons: convergence, quote budget, non-unimodal samples, quote failure, unsupported protocol, and no improvement.
10. Add local marginal-price allocation only through an explicit local-math capability.
11. Infer local math from venue names alone.
12. Try adaptive search on V4 hooks because the quoter can quote them.
13. Increase `maxTemplates` so N-way templates fit more easily.
14. Replace the grid optimizer with adaptive search.
15. Put raw optimizer traces in public quote responses for debugging.

## Ranked Ideas

### 1. Algorithm And Stop-Reason Evidence

Add `algorithm` and `stopReason` to allocation trial evidence and route-lab summaries.

This is the smallest change that makes adaptive behavior auditable. Operators can see whether a route used grid fallback, adaptive two-way search, coordinate descent, or an explicitly disabled local-math path.

### 2. Adaptive Two-Way Search With Grid Fallback

Run adaptive search only after coarse samples prove a smooth, unimodal, fully quoted curve for a two-branch template. Fall back to the existing grid/refinement behavior on quote failures, non-unimodal samples, unsupported protocols, or budget pressure.

This preserves the baseline optimizer as the correctness oracle while adding a cheaper refinement path for well-behaved constant-product split curves.

### 3. Bounded N-Way Coordinate Search

Generate a capped N-way template for eligible 3+ branch groups and run coordinate descent under `maxTrialsPerTemplate` and quote budgets. Materialize only flat executable routes: prefix, sequential branch legs, suffix.

This satisfies the 3+ search requirement without introducing a general aggregator or combinatorial simplex grid.

### 4. Explicit Local-Math Capability Gate

Do not infer local marginal-price safety from pool venue alone. Local-math allocation should require complete pinned-block state and a vetted exact math source before it can select routes.

This keeps local math honest. The current work can expose the gate and stop reason; deeper pool-state math can land in a follow-up if the adapter boundary needs to grow.

## Rejections

| Idea                                    | Reason Rejected                                                                                                                                |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Infer local math from venue names alone | A volatile pool label is not proof that the current adapter has complete pinned reserves and exact rounding semantics for marginal allocation. |
| Try adaptive search on V4 hooks         | Hooks can make output discontinuous or path-dependent; fail closed to grid/quoter validation.                                                  |
| Increase `maxTemplates`                 | The goal explicitly preserves `maxTemplates: 32`; smarter search must fit inside current budgets.                                              |
| Replace the grid optimizer              | The grid baseline is the oracle for adaptive parity and fallback.                                                                              |
| Expose raw optimizer traces publicly    | Route-lab is the operator evidence surface; public quote responses must stay compact and non-executable on failures.                           |

## Recommended Sequence

1. Add evidence types for algorithm selection, stop reasons, and optional allocation vectors.
2. Add adaptive two-way refinement gated by smooth/unimodal samples.
3. Add capped N-way template materialization and coordinate descent.
4. Add local-math capability gating and follow-up todo text for deeper marginal-price work.
5. Extend route-lab and focused tests to prove algorithm selection, stop reasons, budget behavior, and public trace stripping.

## Session Log

- 2026-05-15: Created focused ideation for todo `013` after todo `015` completion. Grounded in the implemented baseline optimizer, route-lab evidence, request-scoped memoization, NativeWrap readiness, and Aerodrome V2 venue support.
