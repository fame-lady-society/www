---
title: "feat: Open FAME swap connector graph and edge gap matrix"
type: feat
status: complete
date: 2026-05-14
origin: docs/brainstorms/2026-05-14-fame-swap-open-connector-graph-requirements.md
source_todo: .context/compound-engineering/todos/011-ready-p1-expand-route-solver-graph-and-liquidity-gap-matrix.md
---

# feat: Open FAME Swap Connector Graph And Edge Gap Matrix

## Overview

Expand the FAME swap solver from route-family-shaped candidate generation into a bounded connector graph search with explicit edge-gap reporting. Public quotes remain FAME buy/sell only, but internal search and route-lab diagnostics should consider reviewed connector edges, disabled Aerodrome/Solidly variants, missing WETH/USDC liquidity, and routes absent from original pinned artifacts.

## Requirements Trace

- R1-R3: Keep public quote/API inputs limited to FAME paired with USDC, WETH, or native ETH.
- R4-R9: Let internal search traverse reviewed connector edges, preserve WETH/native separation, and select non-original route artifacts when quote evidence supports them.
- R10-R14: Add a route-lab edge gap matrix with selected, considered, rejected, disabled, and missing statuses, including WETH/USDC and Aerodrome/Solidly connectors.
- R15-R18: Keep executable decisions quote-evidence-backed and non-ready states structurally non-executable.

## Scope Boundaries

- Do not add public non-FAME swap support.
- Do not add arbitrary Base pool discovery.
- Do not enable Slipstream2 quote execution here; todo `007` owns protocol quoter validation.
- Do not rank executable routes from topology-only strength or synthetic capacity labels.
- Do not write route promotion state or contract-repo todos automatically.

## Current-State Findings

- `src/features/fame-swap/solver/graph/buildGraph.ts` filters to `manifestReady`, which is correct for executable routes but hides disabled pool-universe edges from diagnostics.
- `src/features/fame-swap/solver/graph/candidates.ts` traverses non-FAME connectors internally, but `MAX_SIMPLE_PATH_LEGS` and lack of matrix output make connector coverage hard to audit.
- The current pool universe has no WETH/USDC pool. It has indirect connector pairs through ZORA and several Aerodrome/Solidly pairs, plus Slipstream2 pools that should remain disabled until protocol support is validated.
- `scripts/fame-swap-route-lab.ts` can report selected pools and rejected candidates per corpus bucket, but it does not report considered, disabled, or missing graph edges.

## Key Technical Decisions

| Decision | Rationale |
| --- | --- |
| Keep executable graph filtering separate from diagnostic graph coverage | Candidate routes must stay live-ready, while route-lab diagnostics need visibility into disabled and missing connector edges. |
| Keep simple path depth at 3 and make all other budgets explicit | Current reviewed connector goals such as USDC/ZORA/WETH/FAME need three edges, not four. This keeps scope tighter while adding candidate-count, split-count, cycle, and quote-call budgets. |
| Deduplicate and sort candidates deterministically | Broader graph traversal can produce duplicate pool paths; stable output keeps tests and route-lab diffs reviewable. |
| Emit matrix rows from route-lab, not the public quote API | The matrix is an operator artifact and follow-up source, not a user-facing executable contract. |
| Treat WETH/USDC as a configured connector probe | Reviewed WETH/USDC edges get normal selected/considered/rejected/disabled status; absent reviewed edges get explicit `missing` rows. |
| Use status precedence in matrix rows | If an edge appears in multiple places for one bucket, report the strongest status in this order: `selected > considered > rejected > disabled > missing`. |

## Budget Decisions

- Simple path depth: maximum 3 legs.
- Cycle guard: no repeated pool id and no repeated intermediate token, except the final output token.
- Candidate budget: maximum 96 generated candidates per public quote request after deterministic sort/dedupe.
- Split budget: maximum 40 split or split-merge candidates per request after deterministic sort/dedupe; allocation samples remain `1000`, `2500`, `5000`, `7500`, and `9000` bps.
- Quote-call budget: public async ranking may attempt at most the candidate budget times the simple-path depth in edge quote calls before returning a typed non-ready result.
- Timeout/work budget: route generation uses deterministic work-unit accounting rather than wall-clock timeout in tests; live adapter calls remain under the existing bounded async quote runner timeout path.
- Truncation signal: if candidate generation hits a budget, it must add a non-executable diagnostic that route-lab can surface.

## Implementation Units

- [x] **Unit 1: Split Executable And Diagnostic Graph Edges**

**Goal:** Let executable candidate generation continue using manifest-ready edges while exposing all reviewed pool-universe edges for gap reporting.

**Requirements:** R4, R5, R6, R12, R15

**Files:**

- Modify: `src/features/fame-swap/solver/graph/buildGraph.ts`
- Modify: `src/features/fame-swap/solver/graph/routePlan.ts`
- Test: `src/features/fame-swap/solver/graph/candidates.test.ts`

**Approach:**

- Add graph options for executable-only versus diagnostic-inclusive edge sets.
- Preserve the default executable graph as manifest-ready only so production search does not use disabled targets.
- Expose disabled edge reasons from manifest readiness, including disabled venue family/target and unsupported quote status where available.

**Test scenarios:**

- Happy path: default candidate generation excludes Slipstream2 edges from executable candidates.
- Happy path: diagnostic graph includes Slipstream2 pool-universe edges with disabled status.
- Error path: manifest-disabled edges never appear in ready route candidates.

**Verification:**

- Executable graph safety is unchanged, and diagnostics can see disabled connector edges.

- [x] **Unit 2: Broaden Bounded Connector Candidate Search**

**Goal:** Allow deterministic connector paths absent from original artifacts while keeping search constrained.

**Requirements:** R4, R7, R8, R9, R15

**Files:**

- Modify: `src/features/fame-swap/solver/graph/candidates.ts`
- Test: `src/features/fame-swap/solver/graph/candidates.test.ts`
- Test: `src/features/fame-swap/solver/quotes/rankRoutes.test.ts`

**Approach:**

- Keep simple path depth at 3.
- Add explicit max-candidate, max-split-candidate, and work-unit budgets plus deterministic deduplication by candidate id/pool path.
- Keep the public `supportedFamePair` guard.
- Keep native ETH candidates free of WETH legs.
- Add tests for USDC/ZORA/WETH/FAME and injected reviewed WETH/USDC connector routes when pool-universe edges support them.
- Add a ranking test with an injected quote adapter that makes a non-original connector path win.
- Add a generated-route boundary test proving a non-original winning route materializes, hashes, and produces approval/swap intent only when every leg has execution metadata and quote evidence.
- Add a counting-adapter test proving public async ranking stays within the quote-call budget.

**Test scenarios:**

- Happy path: USDC -> FAME candidates include a route using ZORA/WETH connector liquidity and WETH/FAME output when executable edges exist.
- Happy path: an injected reviewed WETH/USDC edge can be traversed inside a supported FAME route, while USDC -> WETH remains unsupported as a public request.
- Happy path: ranking can select a route whose id is not in `FAME_SWAP_ARTIFACT_MANIFEST.routeArtifactIds`.
- Happy path: a generated winning route has a valid materialized route hash and route call encoding before quote/API code exposes approval or swap intent.
- Edge case: native ETH -> FAME still excludes WETH connector candidates.
- Edge case: FAME -> native ETH also excludes WETH connector candidates.
- Edge case: dense graphs hit candidate/split/work budgets deterministically and report truncation.
- Error path: USDC -> WETH remains unsupported as a public request.
- Error path: a generated route missing execution metadata or quote evidence returns a non-ready result with no approval, swap, route calldata, or failed-state transaction payload.

**Verification:**

- Candidate search is broader than the original artifact families but still bounded, deterministic, and FAME-facing.

- [x] **Unit 3: Add Edge Gap Matrix Model And Route-Lab Output**

**Goal:** Report selected, considered, rejected, disabled, and missing graph edges for each route-lab amount bucket.

**Requirements:** R10, R11, R12, R13, R14, R16, R18

**Files:**

- Create: `src/features/fame-swap/solver/graph/edgeMatrix.ts`
- Modify: `scripts/fame-swap-route-lab.ts`
- Modify: `docs/fame-swap-route-lab.md`
- Test: `src/features/fame-swap/solver/graph/edgeMatrix.test.ts`
- Test: `scripts/fame-swap-route-lab.test.ts`

**Approach:**

- Build matrix rows from the pool universe, candidate set, selected quote, and rejected candidates.
- Statuses:
  - `selected`: edge appears in the ready selected route.
  - `considered`: edge appears in executable candidates but not selected.
  - `rejected`: edge appears only in rejected candidates, or all candidates using it were rejected.
  - `disabled`: edge exists in reviewed pool universe but is not executable under manifest/readiness policy.
  - `missing`: configured connector check has no reviewed pool-universe edge.
- Apply status precedence `selected > considered > rejected > disabled > missing` when an edge has mixed membership in a bucket.
- Include configured connector probes for WETH/USDC in both directions. If a reviewed WETH/USDC edge exists it receives normal selected/considered/rejected/disabled status; otherwise it is `missing`.
- Add a connector probe registry for required gap checks, including WETH/USDC and Aerodrome/Solidly connector expectations where a missing reviewed edge should be explicit.
- Use a canonical matrix row identity of chain id, token in, token out, venue family, protocol variant, pool id when present, and target when present.
- Include token pair, pool id when known, venue family, status, machine-readable reason category, and display-safe reason.
- Reason categories include `selected_edge`, `considered_edge`, `quote_adapter_failure`, `unsafe_output`, `disabled_edge`, and `missing_edge`.
- Sanitize every emitted reason through the existing display-safe diagnostic path before route-lab JSON or Markdown output.
- Keep JSON output machine-readable and Markdown output concise.

**Test scenarios:**

- Happy path: a ready route marks its selected pool edges as `selected`.
- Happy path: WETH/USDC appears as `missing` when no reviewed pool exists.
- Happy path: an injected reviewed WETH/USDC edge resolves to normal edge status instead of `missing`.
- Happy path: Slipstream2 connector pools appear as `disabled`, not `missing` or executable.
- Happy path: parallel pools for the same token pair keep separate matrix row identities and statuses.
- Happy path: an edge used by selected and rejected candidates resolves to `selected` by precedence.
- Error path: rejected candidates mark their edges as `rejected` when no selected route uses the edge.
- Error path: quote adapter failures and unsafe output rejections stay distinct in machine-readable reason categories.
- Error path: route-lab JSON and Markdown contain no approval request, swap request, route payload, calldata, RPC URL, signer material, or long raw hex for non-ready rows.

**Verification:**

- Route-lab output answers which connector edges were selected, considered, rejected, disabled, and missing for every bucket.

- [x] **Unit 4: Refresh Todo, Docs, And Focused Verification**

**Goal:** Mark todo `011` complete only after evidence and work-log updates are in place.

**Requirements:** R10-R18

**Files:**

- Modify: `.context/compound-engineering/todos/011-ready-p1-expand-route-solver-graph-and-liquidity-gap-matrix.md`
- Modify: `docs/fame-swap-route-lab.md`
- Optional modify: `docs/fame-swap-contract-followups.md`

**Approach:**

- Update route-lab docs to describe the edge gap matrix and use "recorded-state quote evidence" wording.
- Add work-log entries with tests run and acceptance criteria evidence.
- Rename the todo to complete only after focused tests pass and route-lab output includes matrix rows.
- Treat R17 as an unchanged invariant owned by existing quote/API/widget tests plus the new generated-route negative test.

**Test scenarios:**

- Focused graph, ranking, and route-lab tests pass.
- Route-lab Markdown includes edge matrix rows and no failed-state transaction payloads.
- Existing non-ready API/widget tests still prove approval/swap data is absent for blocked states.

**Verification:**

- `bun x vitest` is not the project runner; use focused `bun test` or repository-supported commands for the touched `node:test` files.

## Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Broader graph search becomes too large | Medium | Medium | Hard depth and candidate-count budgets, deterministic dedupe, focused tests around candidate count. |
| Disabled edges accidentally become executable | Low | High | Keep default graph executable-only and test Slipstream2 exclusion. |
| Matrix output is mistaken for launch approval | Medium | Medium | Docs and suggested follow-ups say evidence/follow-up only, not promotion or approval. |
| WETH/native routing regresses | Low | High | Keep existing native ETH exclusion tests and add connector-depth coverage. |

## Verification Plan

- `bun test src/features/fame-swap/solver/graph/candidates.test.ts`
- `bun test src/features/fame-swap/solver/graph/edgeMatrix.test.ts`
- `bun test src/features/fame-swap/solver/quotes/rankRoutes.test.ts`
- `bun test src/features/fame-swap/solver/amountSolver.test.ts`
- `bun test src/app/api/fame/swap/quote/route.test.ts`
- `bun test src/features/fame-swap/hooks/useFameSwapQuote.test.ts`
- `bun test scripts/fame-swap-route-lab.test.ts`
- `bun scripts/fame-swap-route-lab.ts --markdown` to inspect recorded-state route-lab matrix output.
