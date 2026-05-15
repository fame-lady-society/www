---
date: 2026-05-15
status: active
topic: fame-swap-adaptive-route-search
origin: docs/brainstorms/2026-05-15-fame-swap-adaptive-route-search-requirements.md
source_todo: .context/compound-engineering/todos/013-complete-p2-add-adaptive-route-search-algorithms.md
---

# Plan: FAME Swap Adaptive Route Search

## Scope

Implement adaptive allocation search on top of the existing baseline optimizer. Keep the coarse grid as fallback and oracle, preserve `maxTemplates: 32`, and keep raw traces route-lab-only.

## Implementation Units

### 1. Optimizer Evidence

Files:

- `src/features/fame-swap/solver/optimizer/types.ts`
- `scripts/fame-swap-route-lab.ts`

Work:

- Add optimizer algorithm and stop-reason fields to allocation trial evidence.
- Add optional allocation vectors for 3+ trials while preserving `selectedAllocationBps` for existing two-way summaries.
- Render algorithm and stop reason in route-lab JSON/Markdown.

Tests:

- `scripts/fame-swap-route-lab.test.ts` verifies algorithm and stop-reason fields are present and redacted output remains safe.

### 2. Adaptive Two-Way Search

Files:

- `src/features/fame-swap/solver/optimizer/search.ts`
- `src/features/fame-swap/solver/optimizer/search.test.ts`

Work:

- Keep the existing coarse samples as the oracle.
- Add a smooth/unimodal classifier for successful two-way samples.
- Run a bounded ternary-style refinement only when the classifier passes.
- Use grid fallback when samples fail, are non-unimodal, or touch unsupported protocols.

Tests:

- Smooth deterministic fixture selects an adaptive two-way allocation.
- Capacity/quote-failure fixture falls back to grid and records `quote_failure`.
- Non-unimodal fixture records `non_unimodal_samples` and does not use adaptive selection.

### 3. Bounded 3+ Coordinate Search

Files:

- `src/features/fame-swap/solver/optimizer/templates.ts`
- `src/features/fame-swap/solver/optimizer/materialize.ts`
- `src/features/fame-swap/solver/optimizer/search.ts`
- `src/features/fame-swap/solver/optimizer/templates.test.ts`
- `src/features/fame-swap/solver/optimizer/materialize.test.ts`
- `src/features/fame-swap/solver/optimizer/search.test.ts`

Work:

- Generate capped N-way templates for 3+ eligible direct, terminal, or split-merge branch groups.
- Materialize N-way allocations as flat route legs using sequential exact shares and a final `All` leg.
- Run coordinate descent under `maxTrialsPerTemplate` and quote budgets.
- Emit stop reasons for convergence, no improvement, and quote budget.

Tests:

- Template extraction includes a capped 3+ terminal split for FAME/USDC.
- Materialization spends intended branch shares without zero-spend legs.
- Coordinate search stays under a low configured trial budget.

### 4. Local-Math Gate And Follow-Up

Files:

- `src/features/fame-swap/solver/optimizer/search.ts`
- `.context/compound-engineering/todos/`

Work:

- Add an explicit local-math eligibility check that currently fails closed unless complete local math is available.
- Create a follow-up todo for exact marginal-price local math if the adapter boundary still lacks complete pinned state.

Tests:

- Search evidence records `unsupported_protocol` or local-math ineligibility rather than selecting speculative local math.

## Verification

- `doppler run -- bun test src/features/fame-swap/solver/optimizer src/features/fame-swap/solver/amountSolver.test.ts scripts/fame-swap-route-lab.test.ts src/features/fame-swap/solver/quoteWire.test.ts`
- `doppler run -- bun test src/features/fame-swap`
- `doppler run -- bun scripts/fame-swap-route-lab.ts --markdown`
- `git diff --check`

## Risks

- N-way materialization can accidentally spend percentages of the remaining balance instead of the original intended allocation; tests must prove branch input amounts.
- Adaptive search can mask quote failures if the classifier is too permissive; quote failures must force fallback.
- Route-lab output can become noisy; Markdown should stay compact and JSON should remain the detailed source of truth.
