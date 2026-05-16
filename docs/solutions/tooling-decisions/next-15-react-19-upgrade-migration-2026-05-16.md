---
title: "Next 15 and React 19 Upgrade Migration"
date: "2026-05-16"
category: "docs/solutions/tooling-decisions"
module: "nextjs-react-upgrade"
problem_type: "tooling_decision"
component: "tooling"
severity: "high"
applies_when:
  - "Upgrading this repo from Next.js 14 to Next.js 15"
  - "Upgrading React 18 code to React 19 in TypeScript-heavy App Router routes"
  - "Applying official Next.js codemods that leave TODOs or unsafe unwrap casts"
  - "Reviewing cache behavior in owner, wallet, auth, or token-gated routes"
related_components:
  - "development_workflow"
  - "testing_framework"
  - "documentation"
tags:
  - "nextjs-15"
  - "react-19"
  - "codemods"
  - "app-router"
  - "async-request-apis"
  - "react-three"
  - "react-spring"
  - "caching"
---

# Next 15 and React 19 Upgrade Migration

## Context

PR #5 upgraded `www` from Next.js 14 / React 18 to Next.js 15 / React 19. The main lesson is that this migration is not a package bump: it combines version targeting, official codemods, async App Router request API fixes, React 19 type cleanup, dependency compatibility work, and cache-behavior review.

The repo uses Yarn classic. The upgrade must target `next@15`, not `latest`, because current Next docs and npm defaults can now point at Next 16. Build validation also needs project secrets, so the production build command for this app is `doppler run -- yarn build`.

Session history search found other Next/React upgrade context in unrelated repos, but no prior Codex session directly covering this `www` Next 14 to Next 15 migration.

## Guidance

Start by recording baseline versions and checks, then upgrade with explicit major targets:

```bash
yarn add next@15 react@19 react-dom@19 eslint-config-next@15
yarn add -D @types/react@19 @types/react-dom@19
```

For this migration, React 19 also required upgrading the rendering stack together:

```json
{
  "@react-three/fiber": "9.x",
  "@react-three/drei": "10.x",
  "@react-three/postprocessing": "3.x",
  "three": "0.184.x",
  "@types/three": "0.184.x",
  "react-spring": "10.x",
  "@react-spring/three": "10.x",
  "@react-spring/web": "10.x"
}
```

Run the official Next codemods, but treat their output as a draft:

```bash
npx @next/codemod@latest upgrade 15 --verbose
npx @next/codemod@latest next-async-request-api . --force
npx @next/codemod@latest app-dir-runtime-config-experimental-edge .
npx @next/codemod@latest next-request-geo-ip .
npx @next/codemod@latest built-in-next-font .
```

After codemods, search for and remove transitional markers before calling the migration complete:

```bash
rg -n "@next-codemod|UnsafeUnwrapped|next15-followup" src
```

For App Router entries, make request-bound props honest and await them at the boundary:

```ts
type PageProps = {
  params: Promise<{ address: string }>;
};

export default async function Page({ params }: PageProps) {
  const { address } = await params;

  return <Owned address={address} />;
}
```

For route handlers:

```ts
type RouteContext = {
  params: Promise<{ tokenId: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { tokenId } = await params;

  return Response.json({ tokenId });
}
```

For request helpers:

```ts
import { cookies } from "next/headers";

const cookieStore = await cookies();
const session = cookieStore.get("session");
```

React 19 type fixes should stay narrow. Avoid `any` and unsafe casts; prefer local prop types, explicit refs, and current React Three Fiber prop patterns:

```ts
type ChildProps = {
  className?: string;
};

const child = React.Children.only(children);

if (!React.isValidElement<ChildProps>(child)) {
  throw new Error("Expected a single React element child");
}

return React.cloneElement(child, { className });
```

For WebGL checks, avoid obsolete renderer types:

```ts
const context = gl.getContext();

if (context instanceof WebGLRenderingContext) {
  context.getExtension("OES_standard_derivatives");
}
```

## Why This Matters

Next 15 changes default assumptions around request APIs and caching. If codemod casts or comments remain, future App Router code inherits uncertainty. If caching is updated mechanically, user-specific data can become wrong.

The key review catch in PR #5 was authenticated owner lookup caching. Static owner lists can keep explicit revalidation:

```ts
export const revalidate = 300;
export const dynamic = "force-static";
```

Authenticated owned-token lookups should not use permanent fetch caching:

```ts
await fetch(ownerUrl, {
  cache: "force-cache",
});
```

Use time-bounded Next revalidation instead:

```ts
await fetch(ownerUrl, {
  next: { revalidate: 300 },
});
```

That preserves the old five-minute freshness expectation without pinning wallet-specific ownership responses indefinitely.

## When to Apply

- Major-version upgrades for Next.js, React, or their lint/type packages.
- App Router pages, layouts, route handlers, metadata functions, or client components receiving promised route props.
- Code review of fetch caching in owner, owned, wallet, auth, or token-gated routes.
- React Three Fiber, drei, postprocessing, three, or react-spring compatibility work.
- Schwing route maintenance. Schwing is Base-backed test-token code; keep params limited to actual route segments and do not invent `network` params or misleading mainnet/sepolia context values.

## Examples

Route params should match the folder path, not copied aliases from related routes:

```ts
// src/app/schwing/[address]/unwrap/page.tsx
type Props = {
  params: Promise<{ address: string }>;
};
```

Do not keep a nonexistent network segment alive in types:

```ts
type Props = {
  params: Promise<{ address: string; network: string }>;
};
```

If a client component truly receives promised params, unwrap with React `use()`:

```ts
"use client";

import { use } from "react";

type Props = {
  params: Promise<{ tokenId: string }>;
};

export function ClientRoute({ params }: Props) {
  const { tokenId } = use(params);

  return <TokenView tokenId={tokenId} />;
}
```

A compact migration checklist for future agents:

```text
1. Identify package manager, routers, TypeScript usage, config, tests, and current versions.
2. Run baseline lint/build/test scripts that exist; do not invent missing scripts.
3. Install explicit Next 15 / React 19 targets, never unverified latest.
4. Upgrade React rendering dependencies that need React 19 compatibility.
5. Run official Next 15 codemods.
6. Await params, searchParams, cookies(), headers(), and draftMode() where used.
7. Remove UnsafeUnwrapped casts and codemod comments.
8. Fix React 19 type errors without any.
9. Audit caching explicitly, especially user-specific fetches.
10. Validate with yarn lint and doppler run -- yarn build.
```

## Related

- PR #5: `https://github.com/fame-lady-society/www/pull/5`
- Existing related doc: `docs/solutions/performance-issues/fame-swap-quote-solver-timeouts-native-wrap-routing-2026-05-15.md` covers request-scoped FAME swap caching and is adjacent but not overlapping.
- Build validation from the migration passed with pre-existing warnings: two `no-img-element` warnings, MetaMask optional React Native storage resolution warnings, Graph Mesh dynamic import warnings, and outdated Browserslist data.
