---
title: "FAME Metadata and Farcaster Client Runtime Regressions"
date: "2026-05-17"
category: "docs/solutions/runtime-errors"
module: "fame"
problem_type: "runtime_error"
component: "service_object"
symptoms:
  - "FAME metadata cards rendered broken or empty images when Irys gateway metadata returned unusable image URLs"
  - "Client rendering crashed during Farcaster Mini App SDK or connector module evaluation"
  - "Dark-mode pages showed black text or white document bars on /fame, /fame/swap, and /lore"
  - "Creator and customize flows performed router redirects during render instead of after commit"
root_cause: "logic_error"
resolution_type: "code_fix"
severity: "high"
related_components:
  - "React client components"
  - "Farcaster Mini App SDK"
  - "MUI theme provider"
  - "Next.js App Router"
  - "FAME metadata service"
tags:
  - "fame"
  - "metadata"
  - "farcaster"
  - "irys"
  - "arweave"
  - "mui"
  - "react-19"
  - "app-router"
---

# FAME Metadata and Farcaster Client Runtime Regressions

## Problem

After the Next 16 / React 19 upgrade, several FAME pages exposed assumptions that older runtime behavior had tolerated. `/fame` and `/fame/creator/[address]` could render token images with empty or unusable `src` values, Farcaster mini-app packages could crash normal desktop loads during module evaluation, dark-mode pages inherited mismatched document colors, and some routes still navigated during render.

The fixes landed in PR #7 on branch `codex/fame-metadata-farcaster-fix`.

## Symptoms

- `/fame` and creator portal grids showed broken token image links, especially for mint-pool and creator-token metadata.
- Loading `/fame` or `/fame/creator` could crash with `TypeError: Cannot convert a BigInt value to a number` from Farcaster/Solana dependency evaluation.
- `/fame/swap` and `/lore` in dark mode showed black text on a dark background or white viewport strips from `html`/`body` styles.
- Creator and customize routes could call `router.push()` or `replace()` during render, which recent Next/React behavior surfaced as runtime exceptions.

## What Didn't Work

- Fetching `tokenURI` directly and trusting `metadata.image` assumed every gateway and metadata document was render-ready.

```ts
const response = await fetch(uri);
const { image } = await response.json();
return image;
```

- Falling back to an empty string on metadata failure avoided throwing in the data loader, but pushed invalid state into the renderer.

```ts
return { tokenId, image: "" };
```

- Checking only for a React Native WebView before importing Farcaster was too narrow. Desktop Chrome at `farcaster.xyz` can spawn mini apps, and other clients may support the mini-app contract without matching one browser environment.
- Fixing individual page text colors did not solve white document bars because `html`, `body`, `CssBaseline`, and the shared `Main` layout still disagreed about the active theme.
- Calling navigation methods directly in render worked until React/Next tightened client render behavior, but it was still a side effect in the wrong phase.

## Solution

Centralize FAME metadata URL handling and validate unknown JSON before it reaches UI components.

```ts
export function irysGatewayToArweaveUrl(rawUrl: string): string | null {
  const url = new URL(rawUrl);

  if (url.protocol !== "https:" || url.hostname !== "gateway.irys.xyz") {
    return null;
  }

  return `https://arweave.net${url.pathname}${url.search}`;
}

export function fameMetadataFetchUrls(uri: string): string[] {
  const arweaveUrl = irysGatewayToArweaveUrl(uri);

  return arweaveUrl ? [arweaveUrl, uri] : [uri];
}
```

Treat missing or empty image fields as invalid metadata, then resolve failures to a real local fallback image at the call site instead of rendering an empty `src`.

```ts
export function imageFromFameMetadata(metadata: unknown): string {
  if (
    metadata === null ||
    typeof metadata !== "object" ||
    !("image" in metadata)
  ) {
    throw new Error("FAME metadata is missing an image field");
  }

  const { image } = metadata;

  if (typeof image !== "string" || image.length === 0) {
    throw new Error("FAME metadata image must be a non-empty string");
  }

  return normalizeFameImageUrl(image);
}
```

Keep optional browser-context integrations behind guarded dynamic imports so package evaluation cannot crash the entire app.

```ts
useEffect(() => {
  let cancelled = false;

  const loadMiniApp = async () => {
    try {
      const { sdk } = await import("@farcaster/miniapp-sdk");
      const isInMiniApp = await sdk.isInMiniApp();

      if (cancelled || !isInMiniApp) {
        return;
      }

      await sdk.actions.ready();
      const context = await sdk.context;

      if (!cancelled) {
        setMiniAppContext(context);
      }
    } catch {
      if (cancelled) {
        return;
      }
    }
  };

  loadMiniApp();

  return () => {
    cancelled = true;
  };
}, []);
```

Move router redirects out of render and into effects.

```ts
useEffect(() => {
  if (!connectedAddress || connectedAddress !== address) {
    router.push("/fame/creator");
  }
}, [connectedAddress, address, router]);
```

Set dark-mode document colors at the provider boundary and make the shared `Main` layout inherit theme text color and fill the viewport.

```tsx
const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)", {
  defaultMatches: true,
});

<GlobalStyles
  styles={(theme) => ({
    html: {
      backgroundColor: `${theme.palette.background.default} !important`,
      color: `${theme.palette.text.primary} !important`,
      colorScheme: theme.palette.mode,
    },
    body: {
      backgroundColor: `${theme.palette.background.default} !important`,
      color: `${theme.palette.text.primary} !important`,
    },
  })}
/>;
```

## Why This Works

Irys gateway URLs are content-addressed by transaction id, so trying the matching Arweave gateway URL first gives metadata and image requests a second stable access path without changing token semantics. The original URL remains as a fallback.

The metadata parser is the right boundary for rejecting unknown JSON. UI components should receive usable image strings; they should not decide whether `unknown.image` is safe to render.

Dynamic imports move Farcaster package evaluation into a browser effect and only after the SDK can answer whether the page is inside a mini app. A failed optional integration no longer takes down normal desktop loads.

Document-level theme styles avoid the server/client style ordering problem where light `CssBaseline` output could still win for `html` or `body`. `Main` then carries `background.default`, `text.primary`, and `minHeight: "100vh"` so page content and viewport filler agree.

Redirect effects match React's side-effect model. Components render based on current state first, then navigation runs after commit when the account or network state says the route is wrong.

## Prevention

- Add small parser/normalizer modules for external metadata instead of decoding unknown JSON inline in pages or grids.
- Treat empty image URLs as invalid data. Use an explicit fallback asset at the loader boundary when the UI can continue.
- Put optional client SDKs with fragile environment assumptions behind dynamic imports and capability checks.
- Verify dark-mode fixes with computed styles for `html`, `body`, shared layout, and the affected page sections, not only a screenshot.
- Never call navigation methods during render. Use `useEffect` for client redirects based on wallet, account, or network state.
- Keep focused tests around gateway URL normalization and metadata shape validation.

## Related Issues

- `docs/solutions/tooling-decisions/next-15-react-19-upgrade-migration-2026-05-16.md` is the parent migration learning. This document captures concrete post-upgrade runtime regressions that the broader checklist did not cover.
- `docs/solutions/performance-issues/fame-swap-quote-solver-timeouts-native-wrap-routing-2026-05-15.md` is adjacent only by FAME area; it covers swap solver performance rather than metadata, mini-app loading, theme inheritance, or redirect timing.
