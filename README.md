This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, create a new local .env.local file

```bash
cp .env.example .env.local
```

## HTTPS local development (secure context)

Some browser APIs (wallet integrations, WebCrypto, etc.) require a secure context. Use one of the HTTPS dev scripts below.

### Option A (recommended): trusted HTTPS with mkcert

1. Install `mkcert` for your OS, then:

```bash
mkcert -install
mkdir -p certs
mkcert -key-file certs/localhost-key.pem -cert-file certs/localhost.pem localhost 127.0.0.1 ::1
```

2. Start the dev server with HTTPS:

```bash
yarn dev:https
```

Open `https://localhost:3000`.

### Option B: auto-generated self-signed cert (may show browser warning)

```bash
yarn dev:https:auto
```

### RPC keys

Signup for infura.io and alchemy.com (free accounts). Create an ethereum RPC for each and get API keys.

### optional

The etherscan.io API key, which is only needed to generate new wagmi generated files, for example when a new smart contract is added to [wagmi.config.ts](./wagmi.config.ts). For must development, this can be left blank.

Finally, run the development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
