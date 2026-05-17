---
title: "Next 15/16 and React 19 Upgrade Migration"
date: "2026-05-16"
category: "docs/solutions/tooling-decisions"
module: "nextjs-react-upgrade"
problem_type: "tooling_decision"
component: "tooling"
severity: "high"
applies_when:
  - "Upgrading this repo from Next.js 14 to Next.js 15"
  - "Upgrading this repo from Next.js 15 to Next.js 16"
  - "Upgrading React 18 code to React 19 in TypeScript-heavy App Router routes"
  - "Applying official Next.js codemods that leave TODOs or unsafe unwrap casts"
  - "Reviewing cache behavior in owner, wallet, auth, or token-gated routes"
related_components:
  - "development_workflow"
  - "testing_framework"
  - "documentation"
tags:
  - "nextjs-15"
  - "nextjs-16"
  - "react-19"
  - "codemods"
  - "app-router"
  - "async-request-apis"
  - "turbopack"
  - "eslint-9"
---

# Next 15/16 and React 19 Upgrade Migration

## Context

PR #5 upgraded `www` from Next.js 14 / React 18 to Next.js 15 / React 19. The main lesson is that this migration is not a package bump: it combines version targeting, official codemods, async App Router request API fixes, React 19 type cleanup, dependency compatibility work, and cache-behavior review.

The repo uses Yarn classic. The upgrade must target `next@15`, not `latest`, because current Next docs and npm defaults can now point at Next 16. Build validation also needs project secrets, so the production build command for this app is `doppler run -- yarn build`.

PR #6 followed by upgrading from Next 15 to Next 16. That pass confirmed the same principle still applies: target the major explicitly, run the official codemods, then manually review the places where Next 16 removes compatibility surfaces such as `next lint`, Webpack-by-default builds, legacy image defaults, and synchronous request API access.

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

For the Next 15 to 16 follow-up, keep the same discipline: target Next 16 explicitly and verify the resolved version before calling the framework upgrade complete:

```bash
yarn add next@16 react@latest react-dom@latest
yarn add -D typescript@latest @types/react@latest @types/react-dom@latest eslint@^9 eslint-config-next@16
npx @next/codemod@canary upgrade 16 --verbose
npx @next/codemod@canary next-lint-to-eslint-cli . --force
npx next typegen
```

Next 16 uses Turbopack by default for `next dev` and `next build`. If custom Webpack config only externalized server packages, prefer moving that behavior to `serverExternalPackages` and test the Turbopack build:

```js
const nextConfig = {
  serverExternalPackages: ["@aws-sdk/client-s3"],
};
```

If the Webpack config still carries behavior that cannot be expressed with Turbopack-compatible config, keep the production script explicit with `next build --webpack` and document why. Do not silently drop custom bundler behavior.

Next 16 also removes `next lint`. Keep lint available as an ordinary project script:

```json
{
  "scripts": {
    "lint": "eslint ."
  }
}
```

If the ESLint 9 migration exposes existing React hooks compiler violations that are outside the migration scope, keep the disabled rules local and leave a durable TODO rather than pretending the rules were intentionally abandoned:

```js
// TODO(next16-react-hooks): Re-enable these rules after the existing
// violations are fixed. They are disabled to preserve pre-migration lint
// behavior during the Next.js 16 upgrade.
```

Run `npx next typegen` after the dependency update. In this repo it also moved TypeScript toward the Next 16 defaults, including `moduleResolution: "bundler"` and `jsx: "react-jsx"`. That can expose invalid deep imports hidden by older resolution behavior; fix those imports at the source instead of weakening TypeScript.

Image defaults changed in Next 16. Preserve behavior explicitly when the old default matters:

```js
const nextConfig = {
  images: {
    minimumCacheTTL: 60,
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};
```

When build-time config reads JSON env vars, fail fast. Do not turn missing required env into an empty array to get a local build farther along; for viem transports that creates delayed failures such as `fallback([])`:

```ts
export type RpcUrls = [string, ...string[]];

function isRpcUrls(value: unknown): value is RpcUrls {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (url): url is string => typeof url === "string" && url.trim().length > 0,
    )
  );
}

export function parseRpcUrls(
  value: string | undefined,
  envName: string,
): RpcUrls {
  if (!value?.trim()) {
    throw new Error(`${envName} must be set to a JSON array of RPC URLs.`);
  }

  const parsed: unknown = JSON.parse(value);

  if (!isRpcUrls(parsed)) {
    throw new Error(`${envName} must be a non-empty JSON array of RPC URLs.`);
  }

  return parsed;
}
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

Next 16 removes more migration-era compatibility and makes Turbopack the default build path. That is useful because it exposes real problems earlier, including CSS import order, invalid package deep imports, and client/server bundling mistakes. Treat those failures as migration findings unless the official guide says the old behavior must be retained through an explicit compatibility flag.

The key review catch in PR #6 was RPC env parsing. A missing JSON env var should fail with a clear message at the point it is parsed. Returning `[]` preserves neither behavior nor type safety because the downstream transport still requires at least one RPC URL.

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
- Next 15 to Next 16 follow-ups involving Turbopack, ESLint 9, image defaults, or generated route types.
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

For a Next 15 to Next 16 follow-up:

```text
1. Install next@16 explicitly and verify it resolves to a 16.x version.
2. Run the official Next 16 upgrade codemod and review the diff manually.
3. Replace next lint with eslint . so linting remains available outside next build.
4. Run npx next typegen and keep the generated type/config changes that Next requires.
5. Remove unnecessary --turbopack flags; migrate simple Webpack externals to serverExternalPackages.
6. Preserve changed next/image defaults explicitly when the app depends on old behavior.
7. Re-audit async request APIs, middleware/proxy, runtime config, cache APIs, and parallel route defaults.
8. Keep required env parsing fail-fast; never convert missing required RPC config into fallback([]).
9. Validate lint, typecheck, and the configured production build path.
```

## Related

- PR #5: `https://github.com/fame-lady-society/www/pull/5`
- PR #6: `https://github.com/fame-lady-society/www/pull/6`
- Existing related doc: `docs/solutions/performance-issues/fame-swap-quote-solver-timeouts-native-wrap-routing-2026-05-15.md` covers request-scoped FAME swap caching and is adjacent but not overlapping.
- Build validation from the migration passed with pre-existing warnings: two `no-img-element` warnings, MetaMask optional React Native storage resolution warnings, Graph Mesh dynamic import warnings, and outdated Browserslist data.
