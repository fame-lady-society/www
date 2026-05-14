# FAME Swap Route Token Assets

The route graph reads token visuals from committed local assets only. The first
implementation did not run online discovery or cache remote token images; every
known route token currently uses the reviewed badge fallback recorded in
`public/images/fame-swap/route-assets.json`.

Future cached images must be scoped to known FAME swap route tokens, documented
in the manifest, and stored under `public/images/fame-swap/tokens/`. Do not
commit hotlinked URLs, unreviewed SVG content, oversized files, or files without
a provenance note.
