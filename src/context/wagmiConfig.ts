import { fallback, http } from "wagmi";
import {
  base,
  mainnet,
  polygon as polygonChain,
  polygonAmoy,
  sepolia,
  baseSepolia,
} from "wagmi/chains";
import type { Chain, Transport } from "viem";
import { parseRpcUrls } from "@/viem/rpcUrls";
import { baseRpcUrls } from "@/viem/baseRpcUrls";

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

export const transports: Record<number, Transport> = {
  [mainnet.id]: http(process.env.NEXT_PUBLIC_MAINNET_RPC_URL_1!, {
    batch: { batchSize: 10, wait: 500 },
    retryCount: 5,
    retryDelay: 100,
  }),
  [base.id]: fallback(baseRpcUrls().map((rpc) => http(rpc, { batch: true }))),
  [polygonChain.id]: fallback(
    [
      process.env.NEXT_PUBLIC_POLYGON_RPC_URL_1,
      process.env.NEXT_PUBLIC_POLYGON_RPC_URL_2,
    ]
      .filter((rpc): rpc is string => Boolean(rpc))
      .map((rpc) => http(rpc, { batch: true })),
  ),
  [sepolia.id]: fallback(
    sepoliaRpcUrls.map((rpc) => http(rpc, { batch: true })),
  ),
  [baseSepolia.id]: fallback(
    baseSepoliaRpcUrls.map((rpc) => http(rpc, { batch: true })),
  ),
  [polygonAmoy.id]: fallback(
    polygonAmoyRpcUrls.map((rpc) => http(rpc, { batch: true })),
  ),
} as const;

export const chains: readonly [Chain, ...Chain[]] = [
  mainnet,
  base,
  polygonChain,
  sepolia,
  baseSepolia,
  polygonAmoy,
] as const;
