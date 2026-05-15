import type { Address, Hex } from "viem";

export const FAME_SWAP_SCHEMA_VERSION = 1;
export const NATIVE_ETH_ADDRESS =
  "0x0000000000000000000000000000000000000000" as const satisfies Address;

export const venueFamilyOrdinals = {
  Solidly: 0,
  UniswapV2: 1,
  Slipstream: 2,
  Slipstream2: 3,
  UniswapV3: 4,
  UniswapV4: 5,
  NativeWrap: 6,
} as const;

export type VenueFamilyName = keyof typeof venueFamilyOrdinals;
export type VenueFamilyOrdinal =
  (typeof venueFamilyOrdinals)[VenueFamilyName];

export const amountModeOrdinals = {
  Exact: 0,
  BalanceBps: 1,
  All: 2,
} as const;

export type AmountModeName = keyof typeof amountModeOrdinals;
export type AmountModeOrdinal = (typeof amountModeOrdinals)[AmountModeName];

export interface FameRouteLeg {
  tokenIn: Address;
  tokenOut: Address;
  venue: VenueFamilyName;
  venueOrdinal: VenueFamilyOrdinal;
  amountMode: AmountModeName;
  amountModeOrdinal: AmountModeOrdinal;
  amount: bigint;
  minAmountOut: bigint;
  target: Address;
  data: Hex;
}

export interface FameRoute {
  version: typeof FAME_SWAP_SCHEMA_VERSION;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  minAmountOutAfterFee: bigint;
  recipient: Address;
  deadline: bigint;
  legs: FameRouteLeg[];
}

export interface JsonFameRouteLeg {
  tokenIn: Address;
  tokenOut: Address;
  venue: VenueFamilyName;
  venueOrdinal: VenueFamilyOrdinal;
  amountMode: AmountModeName;
  amountModeOrdinal: AmountModeOrdinal;
  amount: string;
  minAmountOut: string;
  target: Address;
  data: Hex;
}

export interface JsonFameRoute {
  version: typeof FAME_SWAP_SCHEMA_VERSION;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: string;
  minAmountOutAfterFee: string;
  recipient: Address;
  deadline: string;
  legs: JsonFameRouteLeg[];
}

export interface FameRouteCapabilities {
  nativeEth: boolean;
  weth: boolean;
  nativeWrap: boolean;
  permit2UniversalRouter: boolean;
  v4Hooks: boolean;
  v4HookAddress: boolean;
  v4NonEmptyHookData: boolean;
  v4MultiHopPathKeys: boolean;
  split: boolean;
  splitThenMerge: boolean;
}

export interface FameRouteDebug {
  selectedPath: Address[];
  candidateSummary: string[];
  amountModes: AmountModeName[];
  venueFamilies: VenueFamilyName[];
  perLegMinimums: string[];
  perLegQuoteValues: string[];
  finalPostFeeMinimum: string;
}

export type FameRouteFunding =
  | {
      type: "deal-erc20";
      token: Address;
      amount: string;
      justification: string;
    }
  | {
      type: "native-weth-wrap";
      token: Address;
      amount: string;
    }
  | {
      type: "native-eth";
      amount: string;
    }
  | {
      type: "acquire-via-route";
      routeId: string;
      amountIn: string;
      expectedAmountOut: string;
    };

export interface FameRouteArtifact {
  id: string;
  description: string;
  poolIds: string[];
  executionContext: {
    executor: Address;
    recipient: Address;
    deadline: string;
  };
  route: JsonFameRoute;
  abiEncodedRoute: Hex;
  routeHash: Hex;
  callValue: string;
  funding: FameRouteFunding;
  capabilities: FameRouteCapabilities;
  debug: FameRouteDebug;
}

export interface FameSolverRoutesFile {
  schemaVersion: typeof FAME_SWAP_SCHEMA_VERSION;
  status: "generated-fork-evidence";
  pinnedBaseBlock: number;
  generator: "router-ts";
  routes: FameRouteArtifact[];
}

export interface FameRouteParityVector {
  id: string;
  route: JsonFameRoute;
  abiEncodedRoute: Hex;
  routeHash: Hex;
}

export interface FameRouteParityVectorsFile {
  schemaVersion: typeof FAME_SWAP_SCHEMA_VERSION;
  pinnedBaseBlock: number;
  vectors: FameRouteParityVector[];
}

export interface FameRouteGapRow {
  id: string;
  tokenIn: Address;
  tokenOut: Address;
  direction: string;
  supported: boolean;
  executable: "executable" | "blocked";
  tsGenerated: boolean;
  forkTested: boolean;
  routeArtifactId: string | null;
  blocker: string | null;
  capabilities: FameRouteCapabilities;
}

export interface FameRouteGapMatrixFile {
  schemaVersion: typeof FAME_SWAP_SCHEMA_VERSION;
  pinnedBaseBlock: number;
  rows: FameRouteGapRow[];
}

export type FamePoolEnablement =
  | {
      status: "enabled";
    }
  | {
      status: "blocked";
      reason: string;
    };

export type FamePoolVenue =
  | "solidly"
  | "uniswap-v2"
  | "aerodrome-slipstream"
  | "aerodrome-slipstream2"
  | "uniswap-v3"
  | "uniswap-v4"
  | "native-wrap";

export interface FamePoolBase {
  id: string;
  venue: FamePoolVenue;
  router: Address;
  enablement?: FamePoolEnablement;
}

export interface FameConstantProductPoolBase extends FamePoolBase {
  pool: Address;
  token0: Address;
  token1: Address;
}

export interface FameSolidlyPoolConfig extends FameConstantProductPoolBase {
  venue: "solidly";
  stable: boolean;
  feeBps: number;
}

export interface FameUniswapV2PoolConfig extends FameConstantProductPoolBase {
  venue: "uniswap-v2";
  feeBps: number;
}

export interface FameSlipstreamPoolConfig extends FameConstantProductPoolBase {
  venue: "aerodrome-slipstream" | "aerodrome-slipstream2";
  factory: Address;
  tickSpacing: number;
  feeBps: number;
}

export interface FameUniswapV3PoolConfig extends FameConstantProductPoolBase {
  venue: "uniswap-v3";
  fee: number;
  tickSpacing: number;
}

export interface FameUniswapV4PoolConfig extends FamePoolBase {
  venue: "uniswap-v4";
  poolManager: Address;
  stateView: Address;
  poolId: Hex;
  currency0: Address;
  currency1: Address;
  fee: number;
  tickSpacing: number;
  hooks: Address;
  hookData?: Hex;
}

export interface FameNativeWrapPoolConfig extends FamePoolBase {
  venue: "native-wrap";
  weth: Address;
}

export type FamePoolConfig =
  | FameSolidlyPoolConfig
  | FameUniswapV2PoolConfig
  | FameSlipstreamPoolConfig
  | FameUniswapV3PoolConfig
  | FameUniswapV4PoolConfig
  | FameNativeWrapPoolConfig;

export interface FamePoolUniverseFile {
  schemaVersion: typeof FAME_SWAP_SCHEMA_VERSION;
  status: string;
  pinnedBaseBlock: number;
  source: string;
  pools: FamePoolConfig[];
  pendingLaunchBlockingPools: string[];
}

export function routeFromJson(route: JsonFameRoute): FameRoute {
  return {
    version: route.version,
    tokenIn: route.tokenIn,
    tokenOut: route.tokenOut,
    amountIn: BigInt(route.amountIn),
    minAmountOutAfterFee: BigInt(route.minAmountOutAfterFee),
    recipient: route.recipient,
    deadline: BigInt(route.deadline),
    legs: route.legs.map((leg) => ({
      tokenIn: leg.tokenIn,
      tokenOut: leg.tokenOut,
      venue: leg.venue,
      venueOrdinal: leg.venueOrdinal,
      amountMode: leg.amountMode,
      amountModeOrdinal: leg.amountModeOrdinal,
      amount: BigInt(leg.amount),
      minAmountOut: BigInt(leg.minAmountOut),
      target: leg.target,
      data: leg.data,
    })),
  };
}
