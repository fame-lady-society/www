---
status: complete
priority: p2
issue_id: "003"
tags: [fame-swap, artifacts, typescript, validation]
dependencies: []
---

# Generate Typed FAME Swap Artifacts

## Problem Statement

The FAME swap feature imports copied JSON artifacts and validates route hashes/encodings at runtime, but the JSON imports still require TypeScript assertions. A generator or schema parser would make malformed artifact shape fail earlier and more clearly.

## Findings

- `src/features/fame-swap/solver/artifacts.ts` casts copied JSON into route file interfaces.
- `src/features/fame-swap/solver/integrity.ts` now validates schema version, pinned block, route ids, ABI encodings, and route hashes at readiness time.
- There is no generated `.ts` artifact module using `satisfies`, and no runtime schema library in the current implementation.

## Proposed Solutions

### Option 1: Generate `.ts` Artifact Modules

**Approach:** Add a sync script that reads sibling `fame-contracts` JSON fixtures and writes typed `.ts` modules with `satisfies` declarations.

**Pros:**

- Moves malformed shape failures into TypeScript compile time.
- Keeps runtime bundle simple.

**Cons:**

- Requires generator maintenance when artifact schema evolves.

**Effort:** 1 day

**Risk:** Low

### Option 2: Add Runtime Schema Parser

**Approach:** Validate imported JSON through a small hand-written parser or a schema library before exposing artifacts to solver code.

**Pros:**

- Gives precise runtime errors for bad artifacts.
- Does not require checked-in generated TypeScript data.

**Cons:**

- Adds parser code or a dependency.

**Effort:** 1 day

**Risk:** Low

## Recommended Action

Implement generated `.ts` artifacts with `satisfies` declarations or an equivalent runtime schema parser. The 2026-05-14 pass added imported JSON content-hash checks, so this todo no longer needs to solve manifest drift; it should focus on shape validation, clearer diagnostics, and removing loose JSON assertions.

## Acceptance Criteria

- [x] Invalid addresses, hex strings, route ids, and numeric strings fail before quote construction.
- [x] Artifact sync from `../fame-contracts/test/router/fixtures` is documented and repeatable.
- [x] Existing route hash and ABI parity tests still pass.
- [x] No `as any` or `as unknown` is introduced.
- [x] New generated/schema validation composes with the existing imported content-hash checks instead of replacing them.

## Work Log

### 2026-05-14 - Completed

**By:** Codex

**Actions:**

- Added a dependency-free runtime schema parser for FAME swap route, gap matrix, parity vector, pool universe, and recorded-state snapshot artifacts.
- Centralized raw JSON imports and cached parsed artifact access in `src/features/fame-swap/solver/artifactFiles.ts`.
- Removed loose JSON assertions from solver artifact exports, artifact integrity checks, and route encoding tests.
- Preserved imported-content hash checks by making `artifactIntegrityIssue()` hash raw JSON before requesting parsed artifacts.
- Documented repeatable artifact sync from `../fame-contracts/test/router/fixtures` in `docs/fame-swap-fork-validation.md`.
- Added parser tests for malformed addresses, bytes32 hex strings, route ids, numeric strings, current checked-in artifacts, and integrity composition.

**Verification:**

- `bun test src/features/fame-swap/solver/artifactSchema.test.ts src/features/fame-swap/router/encodeRoute.test.ts src/features/fame-swap/solver/poolUniverse.test.ts src/features/fame-swap/solver/quotes/snapshotAdapter.test.ts src/features/fame-swap/solver/readiness.test.ts`
- `bun test src/features/fame-swap/solver/quote.test.ts src/features/fame-swap/solver/amountSolver.test.ts src/features/fame-swap/solver/materializeRoute.test.ts src/features/fame-swap/solver/routeCorpus.test.ts`
- `yarn lint --file src/features/fame-swap/solver/artifactSchema.ts --file src/features/fame-swap/solver/artifactSchema.test.ts --file src/features/fame-swap/solver/artifactFiles.ts --file src/features/fame-swap/solver/artifacts.ts --file src/features/fame-swap/solver/integrity.ts --file src/features/fame-swap/solver/quotes/snapshotAdapter.ts --file src/features/fame-swap/solver/quotes/snapshotTypes.ts --file src/features/fame-swap/router/encodeRoute.test.ts`
- Prettier and `git diff --check` on touched files.

**Learnings:**

- Runtime schema parsing is lower churn than generated TypeScript data modules here because the checked-in artifact files remain the canonical source and the manifest already owns drift detection.

### 2026-05-14 - Triage

**By:** Codex

**Actions:**

- Promoted from pending to ready.
- Narrowed scope now that runtime imported-content hash checks exist in `artifactIntegrityIssue()`.

**Learnings:**

- Content drift and malformed-shape failures are adjacent but separate defenses; both are worth keeping.

### 2026-05-13 - Initial Discovery

**By:** Codex

**Actions:**

- Added runtime artifact integrity checks for copied JSON content.
- Captured stronger artifact shape typing as durable follow-up.

**Learnings:**

- Runtime route hash checks protect execution, but generated typed artifacts would make artifact drift easier to diagnose.
