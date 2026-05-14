---
title: "chore: Validate FAME swap artifact schemas"
type: chore
status: complete
date: 2026-05-14
source_todo: .context/compound-engineering/todos/003-ready-p2-generate-typed-fame-swap-artifacts.md
---

# chore: Validate FAME Swap Artifact Schemas

## Overview

Replace loose JSON import assertions at the FAME swap artifact boundary with a typed schema parser. The parser should reject malformed copied artifacts before solver quote construction while preserving the existing imported-content hash, route hash, ABI parity, and pinned-block integrity checks.

## Requirements Trace

- Todo `003`: invalid addresses, hex strings, route ids, and numeric strings fail before quote construction.
- Todo `003`: artifact sync from `../fame-contracts/test/router/fixtures` is documented and repeatable.
- Todo `003`: existing route hash and ABI parity tests still pass.
- Todo `003`: no `as any` or `as unknown` is introduced.
- Todo `003`: schema validation composes with existing imported content-hash checks instead of replacing them.

## Current-State Findings

- `src/features/fame-swap/solver/artifacts.ts` casts JSON imports to route, gap-matrix, pool, and snapshot interfaces.
- `src/features/fame-swap/solver/integrity.ts` casts JSON imports again before running manifest/content-hash, header, route hash, ABI, pool-reference, and snapshot checks.
- `src/features/fame-swap/solver/quotes/snapshotAdapter.ts` owns the snapshot interfaces and still casts the imported snapshot JSON.
- The artifact JSON files are small enough that a checked-in generated TypeScript data module is unnecessary churn for this todo.
- `artifactIntegrityIssue()` should keep comparing raw imported JSON content hashes before it asks for parsed artifacts, so manifest drift remains distinguishable from malformed shape.

## Scope Boundaries

- Do not regenerate or alter the artifact JSON contents.
- Do not remove imported-content hash checks or route hash/ABI parity checks.
- Do not add a schema validation dependency unless the hand-written parser becomes clearly unmaintainable.
- Do not broaden solver route selection or live adapter behavior.

## Implementation Units

- [x] **Unit 1: Add Artifact Schema Parser**

**Files:**

- Add: `src/features/fame-swap/solver/artifactSchema.ts`
- Test: `src/features/fame-swap/solver/artifactSchema.test.ts`

**Approach:**

- Parse `unknown` JSON values into the existing artifact interfaces with path-specific diagnostics.
- Validate address fields with viem `isAddress`, hex fields with viem `isHex`, bytes32 fields by exact length, route ids as non-empty strings, and bigint-like numeric strings with a decimal-string guard.
- Validate enum/string discriminators for venue families, amount modes, funding variants, pool venues, snapshot status/source fields, and price-impact methods.
- Keep the parser dependency-free and avoid `as any` / `as unknown`.

- [x] **Unit 2: Centralize Parsed Artifact Exports**

**Files:**

- Add: `src/features/fame-swap/solver/artifactFiles.ts`
- Modify: `src/features/fame-swap/solver/artifacts.ts`
- Modify: `src/features/fame-swap/solver/integrity.ts`
- Modify: `src/features/fame-swap/solver/quotes/snapshotAdapter.ts`
- Modify: `src/features/fame-swap/router/encodeRoute.test.ts`

**Approach:**

- Import raw JSON once and export raw values for content-hash checks plus a cached parsed accessor for solver code.
- Remove duplicated loose casts from the solver artifact boundary.
- Keep `artifactIntegrityIssue()` order so content-hash checks run before schema parsing and before semantic route/hash/pool checks.

- [x] **Unit 3: Document Repeatable Artifact Sync**

**Files:**

- Modify: `docs/fame-swap-fork-validation.md` or add a focused artifact doc if no suitable section exists.

**Approach:**

- Document the sibling source path `../fame-contracts/test/router/fixtures`.
- Include repeatable copy/sync commands and the verification commands needed after copying.
- State that schema validation is an early shape gate and manifest/content-hash checks remain the drift gate.

- [x] **Unit 4: Review, Verify, And Close Todo**

**Files:**

- Modify: `.context/compound-engineering/todos/003-ready-p2-generate-typed-fame-swap-artifacts.md`
- Optional: this plan file completion notes.

**Approach:**

- Run focused schema, route parity, pool universe, snapshot, and readiness tests.
- Run formatting/lint checks for touched files.
- Run a review pass and fix P1/P2 findings.
- Mark todo `003` complete only after verification passes.

## Verification Plan

- `bun test src/features/fame-swap/solver/artifactSchema.test.ts src/features/fame-swap/router/encodeRoute.test.ts src/features/fame-swap/solver/poolUniverse.test.ts src/features/fame-swap/solver/quotes/snapshotAdapter.test.ts src/features/fame-swap/solver/readiness.test.ts`
- `./node_modules/.bin/prettier --check src/features/fame-swap/solver/artifactSchema.ts src/features/fame-swap/solver/artifactSchema.test.ts src/features/fame-swap/solver/artifactFiles.ts src/features/fame-swap/solver/artifacts.ts src/features/fame-swap/solver/integrity.ts src/features/fame-swap/solver/quotes/snapshotAdapter.ts src/features/fame-swap/router/encodeRoute.test.ts docs/fame-swap-fork-validation.md docs/plans/2026-05-14-005-fame-swap-artifact-schema-validation-plan.md`
- `yarn lint --file src/features/fame-swap/solver/artifactSchema.ts --file src/features/fame-swap/solver/artifactSchema.test.ts --file src/features/fame-swap/solver/artifactFiles.ts --file src/features/fame-swap/solver/artifacts.ts --file src/features/fame-swap/solver/integrity.ts --file src/features/fame-swap/solver/quotes/snapshotAdapter.ts --file src/features/fame-swap/router/encodeRoute.test.ts`

## Risks

| Risk                                                                         | Likelihood | Impact | Mitigation                                                                                                                  |
| ---------------------------------------------------------------------------- | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------- |
| Parser accepts malformed nested data because it only checks top-level fields | Medium     | High   | Validate every route leg, funding variant, pool variant, snapshot row, and quote-table row.                                 |
| Parser rejects legitimate zero amounts used by `All` amount mode             | Medium     | Medium | Allow zero decimal strings generally; existing semantic integrity checks and solver logic own positive-output constraints.  |
| Content-hash checks become unreachable when raw JSON is malformed            | Low        | Medium | Keep raw exports separate from the cached parsed accessor and make `artifactIntegrityIssue()` hash raw JSON before parsing. |
| Documentation copy commands drift from manifest expectations                 | Medium     | Medium | Document both the sync command and the required manifest/hash verification tests after syncing.                             |

## Completion Notes

- Added `src/features/fame-swap/solver/artifactSchema.ts`, a dependency-free parser with path-specific diagnostics for solver routes, gap matrix rows, parity vectors, pools, and recorded-state snapshot rows.
- Added `src/features/fame-swap/solver/artifactFiles.ts` to centralize raw JSON imports and expose a cached parsed artifact accessor.
- Updated solver artifact exports and route parity tests to use parsed artifacts instead of JSON type assertions.
- Updated `artifactIntegrityIssue()` to hash raw imported JSON before schema parsing, then run the existing header, route hash, ABI parity, pool-reference, and snapshot integrity checks on parsed artifacts.
- Split snapshot interfaces/integrity into `snapshotTypes.ts` while preserving the existing `snapshotAdapter.ts` public default `snapshotIntegrityIssue()` wrapper.
- Documented repeatable artifact sync from `../fame-contracts/test/router/fixtures` in `docs/fame-swap-fork-validation.md`.
- Review artifact: `.context/compound-engineering/ce-review/20260514-003-artifact-schema-codex/summary.md`; no P1/P2 findings.
- Verification passed with focused schema/parity/readiness tests, artifact-adjacent quote/materialization tests, Prettier, lint, no `as any` / `as unknown` scan, and diff whitespace checks.
