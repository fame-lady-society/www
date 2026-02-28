# Copilot Instructions

## Project Overview

This is `fls`, a Next.js 14 / React 18 web app for Fame Lady Society — NFT wrapping, customization portals, presale flows, and community tools. It runs on Ethereum mainnet, Base, and Sepolia via wagmi/viem.

## TypeScript & Code Style

- Write strict, clean TypeScript. Never use `as any`, `as unknown`, or `"key" in obj` type narrowing hacks.
- Use explicit type imports: `import type { FC } from "react"`.
- Always import from `react` explicitly: `import { useState, useEffect } from "react"` — never rely on a global `React`.
- Use functional components exclusively. No class components.
- Formatting: 2-space indentation, no tabs (Prettier config in `.prettierrc`).
- Path alias `@/*` maps to `./src/*` (configured in `tsconfig.json`).

## React & Component Patterns

- Prefer React hooks (`useState`, `useEffect`, `useMemo`, `useCallback`) for state and side effects.
- Use React Query (`@tanstack/react-query`) for async server state, not `useEffect` + `useState` fetch patterns.
- Redux Toolkit (`@reduxjs/toolkit`) is used for global client state in some features.
- Styling: TailwindCSS is primary. Emotion (`@emotion/react`, `@emotion/styled`) and MUI (`@mui/material`) are also used — match the surrounding code's approach.

## Next.js Conventions

- `src/app/` uses the App Router (React Server Components by default; add `"use client"` directive when needed).
- `src/pages/` contains legacy Pages Router routes and API endpoints (`pages/api/*`).
- When working in `src/app/`, respect the client/server component boundary — hooks and browser APIs require `"use client"`.
- API routes in `src/pages/api/` use the Pages Router API format (`NextApiRequest`/`NextApiResponse`).

## Project Structure

- `src/features/` — Domain-focused modules (e.g., `wrap`, `customize`, `claim-to-fame`, `fameus`, `notifications`, `naming`). Each feature encapsulates its own components, hooks, and logic.
- `src/components/` — Shared, reusable UI components.
- `src/layouts/` — Page layout shells.
- `src/hooks/` — Shared React hooks.
- `src/context/` — Global React context providers.
- `src/service/` — Service-layer utilities (Irys uploads, metadata fetching, Farcaster, IPFS).
- `src/viem/` — Chain-specific viem clients.
- `src/wagmi/` — Generated wagmi hooks and contract ABIs (from `wagmi.config.ts`).
- `src/styles/` — Global styles.

## Blockchain & Web3

- Use wagmi v3 hooks for contract reads/writes and wallet interactions.
- Use viem v2 for low-level blockchain operations, encoding, and decoding.
- ethers v5 (`@ethersproject/providers`) exists for legacy code only — prefer wagmi/viem for new code.
- Contract addresses and ABIs are configured in `wagmi.config.ts`; generated hooks live in `src/wagmi/index.ts`.
- Supported chains: Ethereum mainnet, Base, Sepolia.

## Authentication

- next-auth with SIWE (Sign-In with Ethereum) via `connectkit-next-siwe`.
- Session management uses `SESSION_SECRET` from environment.

## Deprecated — Do Not Use

- GraphQL / `@graphprotocol/client` — subgraphs are offline. Do not add new GraphQL operations or import from `@/graphclient`.
- `yarn schema:types` / `graphclient build` — broken while subgraphs are down.

## File Uploads & IPFS

- Irys (`@irys/web-upload`) for decentralized uploads.
- IPFS via `kubo-rpc-client`.
- On-chain metadata routes in `src/pages/api/`.

## Key Commands

- `yarn dev` — development server on http://localhost:3000
- `yarn build` — production build
- `yarn lint` — ESLint (Next.js preset)
- `npx wagmi generate` — regenerate contract hooks (needs API keys)
