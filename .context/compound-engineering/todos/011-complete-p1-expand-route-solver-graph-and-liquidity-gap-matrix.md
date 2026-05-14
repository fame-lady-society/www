---
status: complete
priority: p1
issue_id: "011"
tags: [fame-swap, solver, graph, liquidity, aerodrome]
dependencies: []
---

# Expand Route Solver Graph And Liquidity Gap Matrix

## Problem Statement

The FAME swap solver must solve along a liquidity graph, not only recombine the original contract test routes. Current candidate generation is still too route-family-shaped: it starts from the pinned pool universe, filters to manifest-ready edges, caps simple paths at three legs, supports only FAME-facing request pairs, and does not appear to probe obvious connector liquidity such as WETH/USDC when searching for better FAME routes.

## Findings

- `src/features/fame-swap/solver/graph/candidates.ts` rejects non-FAME request pairs and only generates simple paths, direct splits, and same-intermediate split-then-merge candidates from the current manifest-ready graph.
- `src/features/fame-swap/solver/graph/buildGraph.ts` filters edges to `manifestReady`, so any useful pool missing from `FAME_SWAP_ARTIFACT_MANIFEST.requiredVenueTargets` is invisible to candidate search.
- Current docs and route-lab follow-ups still describe route families mostly in terms of original pinned artifacts and known launch directions.
- User feedback: WETH/USDC never seems to get requested, Aerodrome support should expose more pools, and liquidity gaps should be discovered and baked into the matrix now.

## Proposed Solutions

### Option 1: Open Connector Graph Search

**Approach:** Keep public swaps FAME-facing, but let internal candidate search traverse reviewed connector tokens and pools such as WETH/USDC, USDC/ZORA, WETH/ZORA, frxUSD, basedflick, and Aerodrome pools within bounded depth and candidate budgets.

**Pros:**

- Builds the actual route solver instead of hard-coding old evidence paths.
- Makes missing useful pools visible as explicit liquidity gaps.
- Preserves bounded public API inputs while broadening internal route exploration.

**Cons:**

- Requires stronger candidate budgets, cycle controls, and diagnostics so search does not become an unbounded aggregator.

**Effort:** 1-2 days

**Risk:** Medium

### Option 2: Liquidity Gap Matrix

**Approach:** Add a route-lab/report artifact that lists useful token-pair edges that were considered, quoted, missing, disabled, or rejected, including WETH/USDC and Aerodrome/Solidly connector pools.

**Pros:**

- Converts "why did we not try this pool?" into a reviewed artifact.
- Produces concrete contract-repo or manifest follow-ups.

**Cons:**

- Needs careful wording so "gap" does not become implicit launch approval.

**Effort:** 4-8 hours

**Risk:** Low

## Recommended Action

Use the full `ce:ideate -> ce:brainstorm -> ce:plan` path. Then implement Option 1 and Option 2 together: expand reviewed pool discovery/manifest inputs, broaden bounded candidate search, add WETH/USDC and Aerodrome connector coverage, and emit a liquidity gap matrix showing considered, quoted, disabled, and missing edges.

## Acceptance Criteria

- [x] Public quote requests remain limited to supported FAME buy/sell pairs, but internal search can traverse non-FAME connector pairs when they improve or validate a FAME route.
- [x] Candidate generation includes WETH/USDC connector paths when reviewed pools exist, or reports an explicit missing-pool gap when they do not.
- [x] Aerodrome/Solidly connector pools are either included with validated quote support or listed as disabled/missing with reasons.
- [x] Candidate search has deterministic depth, cycle, candidate-count, split, and timeout budgets.
- [x] Route-lab output reports considered, selected, rejected, disabled, and missing graph edges for each amount bucket.
- [x] The gap matrix feeds manifest/pool-universe follow-ups without treating original test routes as the only known routes.
- [x] Tests prove the solver can choose a route that was not present as an original pinned route artifact when quote evidence supports it.

## Work Log

### 2026-05-14 - Implementation Complete

**By:** Codex

**Actions:**

- Created the 011-specific ideation, requirements, and plan artifacts:
  - `docs/ideation/2026-05-14-fame-swap-open-connector-graph-ideation.md`
  - `docs/brainstorms/2026-05-14-fame-swap-open-connector-graph-requirements.md`
  - `docs/plans/2026-05-14-001-fame-swap-open-connector-graph-plan.md`
- Ran headless document review with coherence, feasibility, scope, security/API-boundary, and adversarial reviewers; folded valid P1/P2 findings into the plan.
- Kept public quote requests FAME-facing while adding tests that internal candidate search can traverse an injected reviewed WETH/USDC connector.
- Added explicit graph budgets: simple path depth, no repeated pool/token cycles, candidate count, split candidate count, work-unit truncation diagnostics, and async quote-call budget enforcement.
- Added `src/features/fame-swap/solver/graph/edgeMatrix.ts` and route-lab JSON/Markdown output for selected, considered, rejected, disabled, and missing edges.
- Added WETH/USDC Aerodrome/Solidly connector probes in both directions and disabled Slipstream2 matrix rows with explicit unvalidated-quoter reasons.
- Fixed residual code-review P2s: quote-call budget exhaustion now fails closed, diagnostic graphs cannot leak disabled edges into executable candidates, route-lab JSON reasons are sanitized, and candidate-generation budget diagnostics are surfaced.
- Updated `docs/fame-swap-route-lab.md` with edge gap matrix semantics and recorded-state quote evidence wording.

**Verification:**

- `bun test src/features/fame-swap/solver/graph/candidates.test.ts src/features/fame-swap/solver/graph/edgeMatrix.test.ts src/features/fame-swap/solver/quotes/rankRoutes.test.ts src/features/fame-swap/solver/amountSolver.test.ts scripts/fame-swap-route-lab.test.ts src/app/api/fame/swap/quote/route.test.ts src/features/fame-swap/hooks/useFameSwapQuote.test.ts` passed: 52 tests.
- `bun scripts/fame-swap-route-lab.ts --markdown` passed and emitted recorded-state edge matrix rows with selected/considered/disabled/missing counts for every corpus bucket.

**Learnings:**

- The current reviewed pool universe has no WETH/USDC connector pool, so the route lab now reports WETH/USDC as an explicit missing connector gap for Aerodrome Slipstream and Solidly.
- Broader internal graph search already finds non-original connector routes such as USDC/ZORA/WETH/FAME; executable readiness still depends on quote evidence and manifest-ready edges.
- Slipstream2 should stay visible as disabled evidence until todo `007` validates protocol quoter support.

### 2026-05-14 - Triage

**By:** Codex

**Actions:**

- Created from user feedback that the quoter still feels hard-coded around original test routes.
- Promoted to P1 because graph openness is foundational to building a real route solver.

**Learnings:**

- Protocol quote support is not enough if candidate generation never asks for useful connector liquidity.
