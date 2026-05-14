# FAME Swap Todo Clearance Goal

Complete the remaining FAME swap todos in `.context/compound-engineering/todos/`. Do not resurrect the removed route-lab/fork-harness todo. Mark `complete` only after criteria, verification, and work-log updates.

Loop for every todo:

1. Create/update a plan.
2. Run `document-review mode:headless <plan>` with subagents/autofix; fold valid findings in.
3. Execute with `ce:work <plan>`.
4. Review with `ce:review mode:autofix plan:<plan>`.
5. Fix residual P1/P2s, verify, mark `complete`, continue.

Priority order and workflow:

1. `011-ready-p1-expand-route-solver-graph-and-liquidity-gap-matrix.md`: full `ce:ideate -> ce:brainstorm -> ce:plan`. Build a bounded graph solver. Public swaps stay FAME buy/sell; internal search must consider WETH/USDC, Aerodrome/Solidly connectors, missing/disabled edges, and routes absent from original artifacts.

2. `007-ready-p1-validate-protocol-quoter-coverage-and-state-outputs.md`: `ce:plan` after `011`. Cover every selected/rejected/disabled/missing edge; finish V4 state/simulation, Slipstream2 status, computable per-leg outputs.

3. `008-ready-p2-add-shared-quote-wire-contract-and-ready-path-tests.md`: `ce:plan` only. Shared DTOs, ready-path tests, non-ready serialization, hash checks, no blocked-state tx data.

4. `009-ready-p2-complete-widget-fetch-and-recovery-tests.md`: `ce:plan` only. Prove debounce, stale suppression, timeout/error conversion, wallet retryability, expired quote recovery.

5. `005-ready-p2-add-pre-approval-quote-fallback-for-fame-swap.md`: `ce:plan` only. Use server quote outputs as display fallback; protected simulation remains final gate.

6. `004-ready-p2-estimate-liquidity-fees-for-fame-swap-routes.md`: `ce:plan` only. Venue fee labels or unavailable reasons for every pinned leg; keep FLS router fee separate.

7. `006-ready-p2-richer-fame-swap-route-graph.md`: `ce:plan` only. Depends on `004`; consume `007` evidence without fake route strength/fee precision.

8. `010-ready-p2-simplify-quote-pipeline-and-config-sources.md`: `ce:plan` only. Reduce quote drift; source default router address from wagmi.

Operational rules:

- Use "recorded-state quote evidence"; avoid "snapshot liquidity" in user-facing docs.
- Treat fake/scaled/hard-coded/incomplete router behavior as deprecated; remove unless test-only and non-executable.
- Prefer protocol quote/state infra; use official Uniswap, Aerodrome/Velodrome, and Doppler docs for `007`.
- Keep non-ready quote/API/widget states structurally non-executable.
- Run focused tests after each todo and a broader FAME swap suite before declaring the stack complete.

## Completion

Status: complete on 2026-05-14.

- All todo files in `.context/compound-engineering/todos/` are marked complete: `001` through `011`.
- The removed route-lab/fork-harness todo was not recreated.
- The final broader FAME swap suite passed with `144 pass`, `0 fail` across `24` files.
- Final ready-status scan found no `status: ready` todo files.
