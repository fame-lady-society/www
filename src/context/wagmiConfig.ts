import { fallback, http } from "wagmi";
import {
  base,
  mainnet,
  polygon as polygonChain,
  polygonAmoy,
  sepolia,
  baseSepolia,
} from "wagmi/chains";
import { Chain, Transport } from "viem";
import { parseRpcUrls } from "@/viem/rpcUrls";

const sepoliaRpcUrls = parseRpcUrls(
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_JSON,
  "NEXT_PUBLIC_SEPOLIA_RPC_JSON",
);
const baseSepoliaRpcUrls = parseRpcUrls(
  process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_JSON,
  "NEXT_PUBLIC_BASE_SEPOLIA_RPC_JSON",
);
const polygonAmoyRpcUrls = parseRpcUrls(
  process.env.NEXT_PUBLIC_POLYGON_AMOY_RPCS_JSON,
  "NEXT_PUBLIC_POLYGON_AMOY_RPCS_JSON",
);

export const mainnetSepolia = {
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(process.env.NEXT_PUBLIC_MAINNET_RPC_URL_1!, {
      batch: {
        batchSize: 10,
        wait: 500,
      },
      retryCount: 5,
      retryDelay: 100,
    }),
    [sepolia.id]: fallback(
      sepoliaRpcUrls.map((rpc) => http(rpc, { batch: true })),
    ),
  },
} as const;

export const sepoliaOnly = {
  chains: [sepolia],
  transports: {
    [sepolia.id]: fallback(
      sepoliaRpcUrls.map((rpc) => http(rpc, { batch: true })),
    ),
  },
} as const;

export const baseSepoliaOnly = {
  chains: [base, sepolia],
  transports: {
    [base.id]: fallback([
      http(process.env.NEXT_PUBLIC_BASE_RPC_URL_1!, {
        batch: true,
      }),
    ]),
    [sepolia.id]: fallback(
      sepoliaRpcUrls.map((rpc) => http(rpc, { batch: true })),
    ),
  },
} as const;

export const baseSepoliaChainOnly = {
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: fallback(
      baseSepoliaRpcUrls.map((rpc) => http(rpc, { batch: true })),
    ),
  },
} as const;

export const polygonOnly = {
  chains: [polygonChain],
  transports: {
    [polygonChain.id]: fallback([
      http(process.env.NEXT_PUBLIC_POLYGON_RPC_URL_1!, {
        batch: true,
      }),
      http(process.env.NEXT_PUBLIC_POLYGON_RPC_URL_2!, {
        batch: true,
      }),
    ]),
  },
} as const;

export const polygonAmoyOnly = {
  chains: [polygonAmoy],
  transports: {
    [polygonAmoy.id]: fallback(
      polygonAmoyRpcUrls.map((rpc) => http(rpc, { batch: true })),
    ),
  },
} as const;

export const transports: Record<number, Transport> = {
  ...mainnetSepolia.transports,
  ...sepoliaOnly.transports,
  ...baseSepoliaOnly.transports,
  ...baseSepoliaChainOnly.transports,
  ...polygonOnly.transports,
  ...polygonAmoyOnly.transports,
} as const;

export const chains: readonly [Chain, ...Chain[]] = [
  base,
  polygonChain,
  polygonAmoy,
  sepolia,
  mainnet,
  baseSepolia,
] as const;
