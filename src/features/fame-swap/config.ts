import { isAddress, type Address, type Hex } from "viem";
import { FAME_SWAP_ARTIFACT_MANIFEST } from "./artifacts/manifest";
import { DEFAULT_FAME_SWAP_SLIPPAGE_BPS } from "./solver/slippage";

export const DEFAULT_FAME_ROUTER_ADDRESS =
  "0x13e0075EC96601AA90240d9e6D900C91AF764bBB" satisfies Address;

export interface FameSwapConfig {
  routerAddress: Address | null;
  defaultSlippageBps: number;
  expectedSchemaVersion: number;
  expectedPinnedBaseBlock: number;
  expectedSolverRoutesHash: Hex;
  expectedGapMatrixHash: Hex;
  expectedParityVectorsHash: Hex;
  expectedPoolsHash: Hex;
  expectedPoolStateSnapshotHash: Hex;
}

function envValue(value: string | undefined): string | undefined {
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

function envAddress(
  rawValue: string | undefined,
  fallback: Address | null = null,
): Address | null {
  const value = envValue(rawValue);
  return value && isAddress(value) ? value : fallback;
}

function envNumber(rawValue: string | undefined, fallback: number): number {
  const value = envValue(rawValue);
  if (!value) return fallback;

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : fallback;
}

function envHex(rawValue: string | undefined, fallback: Hex): Hex {
  const value = envValue(rawValue);
  return value && /^0x[a-fA-F0-9]+$/.test(value) ? (value as Hex) : fallback;
}

export function getFameSwapConfig(): FameSwapConfig {
  return {
    routerAddress: envAddress(
      process.env.NEXT_PUBLIC_FAME_ROUTER_ADDRESS,
      DEFAULT_FAME_ROUTER_ADDRESS,
    ),
    defaultSlippageBps: envNumber(
      process.env.NEXT_PUBLIC_FAME_SWAP_SLIPPAGE_BPS,
      DEFAULT_FAME_SWAP_SLIPPAGE_BPS,
    ),
    expectedSchemaVersion: envNumber(
      process.env.NEXT_PUBLIC_FAME_ROUTER_SCHEMA_VERSION,
      FAME_SWAP_ARTIFACT_MANIFEST.schemaVersion,
    ),
    expectedPinnedBaseBlock: envNumber(
      process.env.NEXT_PUBLIC_FAME_ROUTER_PINNED_BASE_BLOCK,
      FAME_SWAP_ARTIFACT_MANIFEST.pinnedBaseBlock,
    ),
    expectedSolverRoutesHash: envHex(
      process.env.NEXT_PUBLIC_FAME_SOLVER_ROUTES_HASH,
      FAME_SWAP_ARTIFACT_MANIFEST.solverRoutesJsonHash,
    ),
    expectedGapMatrixHash: envHex(
      process.env.NEXT_PUBLIC_FAME_ROUTE_GAP_MATRIX_HASH,
      FAME_SWAP_ARTIFACT_MANIFEST.gapMatrixJsonHash,
    ),
    expectedParityVectorsHash: envHex(
      process.env.NEXT_PUBLIC_FAME_ROUTE_PARITY_VECTORS_HASH,
      FAME_SWAP_ARTIFACT_MANIFEST.parityVectorsJsonHash,
    ),
    expectedPoolsHash: envHex(
      process.env.NEXT_PUBLIC_FAME_ROUTE_POOLS_HASH,
      FAME_SWAP_ARTIFACT_MANIFEST.poolsJsonHash,
    ),
    expectedPoolStateSnapshotHash: envHex(
      process.env.NEXT_PUBLIC_FAME_POOL_STATE_SNAPSHOT_HASH,
      FAME_SWAP_ARTIFACT_MANIFEST.poolStateSnapshotJsonHash,
    ),
  };
}
