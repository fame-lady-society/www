# Agent Guide

## Overview

- `fls` is a Next.js 14 / React 18 web app that powers multiple Fame Lady Society web experiences such as NFT wrapping, customization portals, and presale flows.
- The UI is written in TypeScript with TailwindCSS, Emotion, MUI, React Query, Redux Toolkit, wagmi, and viem for blockchain interactions.
- Deprecated: legacy GraphQL data integrations via `@graphprotocol/client` remain in the tree but the upstream subgraphs are offline and will be removed.
- The app integrates with Ethereum mainnet, Base, and Sepolia contracts plus Farcaster frames, Irys uploads, and IPFS-backed metadata services.

## Local Setup

1. Install dependencies with `yarn install`.
2. Copy `.env.example` to `.env.local` and provide required secrets:
   - `ETHERSCAN_API_KEY`, `BASESCAN_API_KEY` (wagmi codegen)
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`, `NEXT_PUBLIC_ALCHEMY_KEY`, `INFURA_KEY`, `INFURA_IPFS_KEY`
   - `SESSION_SECRET`, `SEPOLIA_SIGNER_PRIVATE_KEY`, `MAINNET_SIGNER_PRIVATE_KEY`
3. Start the dev server with `yarn dev` (served on `http://localhost:3000`).

## Key Scripts

- `yarn dev` – run the Next.js dev server with local deployment context.
- `yarn build` / `yarn start` – build and serve a production bundle.
- `yarn lint` – run ESLint (Next.js preset).
- Deprecated: `yarn schema:types` invokes `graphclient build`; subgraphs are offline so avoid running unless the Graph stack is restored.
- `npx wagmi generate` – regenerate `src/wagmi/index.ts` using `wagmi.config.ts` (requires explorer API keys and access to `../fame-contracts` when Foundry sources change).

## Architecture Notes

- `src/app` – App Router pages (e.g. `/fame`, `/upload`, `/[network]/wrap`); includes client/server components and route-specific helpers.
- `src/pages` – Legacy Pages Router routes and API endpoints (e.g. `pages/api/*` metadata, ownership APIs).
- `src/features` – Domain-focused feature modules (`wrap`, `customize`, `claim-to-fame`, `fameus`, `notifications`, etc.) composed by top-level pages.
- `src/components`, `src/layouts`, `src/hooks`, `src/context` – Shared UI building blocks, layout shells, React hooks, and global context providers.
- `src/service` – Service-layer utilities for Irys uploads, metadata fetching, owner lookups, Farcaster integrations, and other side effects.
- `src/viem`, `src/wagmi` – Chain-specific clients, contract ABIs, and generated wagmi hooks for interacting with deployed contracts.
- Styling is primarily TailwindCSS with supplemental Emotion/MUI components; global styles live in `src/styles`.

## Data & Integrations

- Deprecated: `.graphclientrc.yml` still lists Sepolia/Mainnet/Base subgraphs, but those endpoints are down; no new GraphQL operations should be added.
- Blockchain reads/writes go through wagmi/viem and ethers v5 providers, using addresses from `wagmi.config.ts` and environment-specific signer keys.
- File and metadata uploads leverage Irys (`@irys/web-upload`), IPFS (`kubo-rpc-client`), and on-chain metadata routes in `src/pages/api`.
- Authentication flows rely on `next-auth`, SIWE via `connectkit-next-siwe`, and session secrets in `.env.local`.
- Sentry (`@sentry/nextjs`) is configured but optional; enable by uncommenting the wrapper in `next.config.js` and ensuring DSN/keys are set.

## Build & Deployment

- Deploy through Vercel workflows with environment management handled there.
- Static asset domains are white-listed in `next.config.js` for S3, IPFS gateways, Irys, and related hosts.
- Vercel-specific configuration lives under `.vercel`; production deployments expect `DEPLOYMENT` to match `fls.0xflick.com` or `fameladysociety.com`.

## Development Practices

- Use TypeScript throughout; the repo ships with `tsconfig.json` and Next.js typings in `next-env.d.ts`.
- Run `yarn lint` before committing; Prettier 3 (`.prettierrc`) governs formatting.
- When adding new contracts, update `wagmi.config.ts`, supply explorer API keys, and regenerate wagmi outputs.
- Maintain parity between `src/app` and `src/pages` routes where migration is ongoing; confirm client/server component boundaries in the App Router.
- Prefer RPC and wagmi/viem sources; Graph endpoints are deprecated while subgraphs are offline.

## Reference Links

- Next.js docs: https://nextjs.org/docs
- wagmi CLI: https://wagmi.sh/cli
- Fame Lady Society: https://fameladysociety.com
