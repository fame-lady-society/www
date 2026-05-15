import { isAddress, isHex, type Address, type Hex } from "viem";
import {
  amountModeOrdinals,
  FAME_SWAP_SCHEMA_VERSION,
  venueFamilyOrdinals,
  type AmountModeName,
  type FamePoolEnablement,
  type FamePoolConfig,
  type FamePoolUniverseFile,
  type FameRouteArtifact,
  type FameRouteCapabilities,
  type FameRouteDebug,
  type FameRouteFunding,
  type FameRouteGapMatrixFile,
  type FameRouteGapRow,
  type FameRouteParityVector,
  type FameRouteParityVectorsFile,
  type FameSolverRoutesFile,
  type JsonFameRoute,
  type JsonFameRouteLeg,
  type VenueFamilyName,
} from "../router/types";
import type { FameProtocolEvidence } from "./quotes/adapters";
import type {
  FamePoolStateSnapshotFile,
  FameSnapshotQuoteEntry,
  FameSnapshotReserveState,
} from "./quotes/snapshotTypes";

export class FameArtifactSchemaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FameArtifactSchemaError";
  }
}

const venueFamilyNames = [
  "Solidly",
  "UniswapV2",
  "Slipstream",
  "Slipstream2",
  "UniswapV3",
  "UniswapV4",
  "NativeWrap",
] as const satisfies readonly VenueFamilyName[];

const amountModeNames = [
  "Exact",
  "BalanceBps",
  "All",
] as const satisfies readonly AmountModeName[];

const poolVenues = [
  "solidly",
  "uniswap-v2",
  "aerodrome-slipstream",
  "aerodrome-slipstream2",
  "uniswap-v3",
  "uniswap-v4",
  "native-wrap",
] as const satisfies readonly FamePoolConfig["venue"][];

const priceImpactMethods = [
  "constant-product-reserves",
  "concentrated-liquidity-slot0",
  "quote-table",
  "quoter-price-after",
] as const;

const protocolEvidenceStatuses = [
  "available",
  "unavailable",
  "not_applicable",
  "disabled",
] as const;

function schemaError(path: string, message: string): never {
  throw new FameArtifactSchemaError(
    `FAME artifact schema invalid at ${path}: ${message}.`,
  );
}

export function artifactSchemaErrorMessage(error: unknown): string {
  if (error instanceof FameArtifactSchemaError) return error.message;
  if (error instanceof Error) {
    return `FAME artifact schema validation failed: ${error.message}`;
  }
  return "FAME artifact schema validation failed.";
}

function parseObject(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    schemaError(path, "expected an object");
  }
  return value as Record<string, unknown>;
}

function getField(
  record: Record<string, unknown>,
  key: string,
  path: string,
): unknown {
  if (!Object.hasOwn(record, key)) {
    schemaError(`${path}.${key}`, "missing required field");
  }
  return record[key];
}

function getOptionalField(
  record: Record<string, unknown>,
  key: string,
): unknown | undefined {
  return Object.hasOwn(record, key) ? record[key] : undefined;
}

function parseString(value: unknown, path: string): string {
  if (typeof value !== "string") {
    schemaError(path, "expected a string");
  }
  return value;
}

function parseNonEmptyString(value: unknown, path: string): string {
  const parsed = parseString(value, path);
  if (parsed.length === 0) {
    schemaError(path, "expected a non-empty string");
  }
  return parsed;
}

function parseRouteId(value: unknown, path: string): string {
  return parseNonEmptyString(value, path);
}

function parseDecimalString(value: unknown, path: string): string {
  const parsed = parseString(value, path);
  if (!/^(0|[1-9][0-9]*)$/.test(parsed)) {
    schemaError(path, "expected a non-negative decimal integer string");
  }
  return parsed;
}

function parseBoolean(value: unknown, path: string): boolean {
  if (typeof value !== "boolean") {
    schemaError(path, "expected a boolean");
  }
  return value;
}

function parseInteger(
  value: unknown,
  path: string,
  options: { min?: number } = {},
): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    schemaError(path, "expected an integer");
  }
  const min = options.min ?? 0;
  if (value < min) {
    schemaError(path, `expected an integer greater than or equal to ${min}`);
  }
  return value;
}

function parseFiniteNumber(
  value: unknown,
  path: string,
  options: { min?: number } = {},
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    schemaError(path, "expected a finite number");
  }
  if (options.min !== undefined && value < options.min) {
    schemaError(
      path,
      `expected a finite number greater than or equal to ${options.min}`,
    );
  }
  return value;
}

function parseNullableFiniteNumber(
  value: unknown,
  path: string,
): number | null {
  if (value === null) return null;
  return parseFiniteNumber(value, path);
}

function parseEnum<T extends string>(
  value: unknown,
  path: string,
  allowed: readonly T[],
): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    schemaError(path, `expected one of ${allowed.join(", ")}`);
  }
  return value as T;
}

function parseArray<T>(
  value: unknown,
  path: string,
  parser: (item: unknown, itemPath: string) => T,
): T[] {
  if (!Array.isArray(value)) {
    schemaError(path, "expected an array");
  }
  return value.map((item, index) => parser(item, `${path}[${index}]`));
}

function parseStringArray(value: unknown, path: string): string[] {
  return parseArray(value, path, parseNonEmptyString);
}

function parseAddress(value: unknown, path: string): Address {
  const parsed = parseString(value, path);
  if (!isAddress(parsed, { strict: false })) {
    schemaError(path, "expected an EVM address");
  }
  return parsed as Address;
}

function parseHex(value: unknown, path: string): Hex {
  const parsed = parseString(value, path);
  if (!isHex(parsed, { strict: true })) {
    schemaError(path, "expected a hex string");
  }
  return parsed as Hex;
}

function parseBytes32(value: unknown, path: string): Hex {
  const parsed = parseHex(value, path);
  if (parsed.length !== 66) {
    schemaError(path, "expected a 32-byte hex string");
  }
  return parsed;
}

function parseSchemaVersion(
  value: unknown,
  path: string,
): typeof FAME_SWAP_SCHEMA_VERSION {
  if (value !== FAME_SWAP_SCHEMA_VERSION) {
    schemaError(path, `expected schema version ${FAME_SWAP_SCHEMA_VERSION}`);
  }
  return FAME_SWAP_SCHEMA_VERSION;
}

function parseVenueFamily(value: unknown, path: string): VenueFamilyName {
  return parseEnum(value, path, venueFamilyNames);
}

function parseAmountMode(value: unknown, path: string): AmountModeName {
  return parseEnum(value, path, amountModeNames);
}

function parseJsonFameRouteLeg(value: unknown, path: string): JsonFameRouteLeg {
  const record = parseObject(value, path);
  const venue = parseVenueFamily(
    getField(record, "venue", path),
    `${path}.venue`,
  );
  const expectedVenueOrdinal = venueFamilyOrdinals[venue];
  const venueOrdinal = parseInteger(
    getField(record, "venueOrdinal", path),
    `${path}.venueOrdinal`,
  );
  if (venueOrdinal !== expectedVenueOrdinal) {
    schemaError(
      `${path}.venueOrdinal`,
      `expected ordinal ${expectedVenueOrdinal} for ${venue}`,
    );
  }

  const amountMode = parseAmountMode(
    getField(record, "amountMode", path),
    `${path}.amountMode`,
  );
  const expectedAmountModeOrdinal = amountModeOrdinals[amountMode];
  const amountModeOrdinal = parseInteger(
    getField(record, "amountModeOrdinal", path),
    `${path}.amountModeOrdinal`,
  );
  if (amountModeOrdinal !== expectedAmountModeOrdinal) {
    schemaError(
      `${path}.amountModeOrdinal`,
      `expected ordinal ${expectedAmountModeOrdinal} for ${amountMode}`,
    );
  }

  return {
    tokenIn: parseAddress(getField(record, "tokenIn", path), `${path}.tokenIn`),
    tokenOut: parseAddress(
      getField(record, "tokenOut", path),
      `${path}.tokenOut`,
    ),
    venue,
    venueOrdinal: expectedVenueOrdinal,
    amountMode,
    amountModeOrdinal: expectedAmountModeOrdinal,
    amount: parseDecimalString(
      getField(record, "amount", path),
      `${path}.amount`,
    ),
    minAmountOut: parseDecimalString(
      getField(record, "minAmountOut", path),
      `${path}.minAmountOut`,
    ),
    target: parseAddress(getField(record, "target", path), `${path}.target`),
    data: parseHex(getField(record, "data", path), `${path}.data`),
  };
}

function parseJsonFameRoute(value: unknown, path: string): JsonFameRoute {
  const record = parseObject(value, path);
  return {
    version: parseSchemaVersion(
      getField(record, "version", path),
      `${path}.version`,
    ),
    tokenIn: parseAddress(getField(record, "tokenIn", path), `${path}.tokenIn`),
    tokenOut: parseAddress(
      getField(record, "tokenOut", path),
      `${path}.tokenOut`,
    ),
    amountIn: parseDecimalString(
      getField(record, "amountIn", path),
      `${path}.amountIn`,
    ),
    minAmountOutAfterFee: parseDecimalString(
      getField(record, "minAmountOutAfterFee", path),
      `${path}.minAmountOutAfterFee`,
    ),
    recipient: parseAddress(
      getField(record, "recipient", path),
      `${path}.recipient`,
    ),
    deadline: parseDecimalString(
      getField(record, "deadline", path),
      `${path}.deadline`,
    ),
    legs: parseArray(
      getField(record, "legs", path),
      `${path}.legs`,
      parseJsonFameRouteLeg,
    ),
  };
}

function parseRouteCapabilities(
  value: unknown,
  path: string,
): FameRouteCapabilities {
  const record = parseObject(value, path);
  return {
    nativeEth: parseBoolean(
      getField(record, "nativeEth", path),
      `${path}.nativeEth`,
    ),
    weth: parseBoolean(getField(record, "weth", path), `${path}.weth`),
    nativeWrap:
      getOptionalField(record, "nativeWrap") === undefined
        ? false
        : parseBoolean(
            getOptionalField(record, "nativeWrap"),
            `${path}.nativeWrap`,
          ),
    permit2UniversalRouter: parseBoolean(
      getField(record, "permit2UniversalRouter", path),
      `${path}.permit2UniversalRouter`,
    ),
    v4Hooks: parseBoolean(getField(record, "v4Hooks", path), `${path}.v4Hooks`),
    v4HookAddress: parseBoolean(
      getField(record, "v4HookAddress", path),
      `${path}.v4HookAddress`,
    ),
    v4NonEmptyHookData: parseBoolean(
      getField(record, "v4NonEmptyHookData", path),
      `${path}.v4NonEmptyHookData`,
    ),
    v4MultiHopPathKeys: parseBoolean(
      getField(record, "v4MultiHopPathKeys", path),
      `${path}.v4MultiHopPathKeys`,
    ),
    split: parseBoolean(getField(record, "split", path), `${path}.split`),
    splitThenMerge: parseBoolean(
      getField(record, "splitThenMerge", path),
      `${path}.splitThenMerge`,
    ),
  };
}

function parseRouteDebug(value: unknown, path: string): FameRouteDebug {
  const record = parseObject(value, path);
  return {
    selectedPath: parseArray(
      getField(record, "selectedPath", path),
      `${path}.selectedPath`,
      parseAddress,
    ),
    candidateSummary: parseStringArray(
      getField(record, "candidateSummary", path),
      `${path}.candidateSummary`,
    ),
    amountModes: parseArray(
      getField(record, "amountModes", path),
      `${path}.amountModes`,
      parseAmountMode,
    ),
    venueFamilies: parseArray(
      getField(record, "venueFamilies", path),
      `${path}.venueFamilies`,
      parseVenueFamily,
    ),
    perLegMinimums: parseArray(
      getField(record, "perLegMinimums", path),
      `${path}.perLegMinimums`,
      parseDecimalString,
    ),
    perLegQuoteValues: parseArray(
      getField(record, "perLegQuoteValues", path),
      `${path}.perLegQuoteValues`,
      parseDecimalString,
    ),
    finalPostFeeMinimum: parseDecimalString(
      getField(record, "finalPostFeeMinimum", path),
      `${path}.finalPostFeeMinimum`,
    ),
  };
}

function parseRouteFunding(value: unknown, path: string): FameRouteFunding {
  const record = parseObject(value, path);
  const type = parseEnum(getField(record, "type", path), `${path}.type`, [
    "deal-erc20",
    "native-weth-wrap",
    "native-eth",
    "acquire-via-route",
  ] as const);

  switch (type) {
    case "deal-erc20":
      return {
        type,
        token: parseAddress(getField(record, "token", path), `${path}.token`),
        amount: parseDecimalString(
          getField(record, "amount", path),
          `${path}.amount`,
        ),
        justification: parseNonEmptyString(
          getField(record, "justification", path),
          `${path}.justification`,
        ),
      };
    case "native-weth-wrap":
      return {
        type,
        token: parseAddress(getField(record, "token", path), `${path}.token`),
        amount: parseDecimalString(
          getField(record, "amount", path),
          `${path}.amount`,
        ),
      };
    case "native-eth":
      return {
        type,
        amount: parseDecimalString(
          getField(record, "amount", path),
          `${path}.amount`,
        ),
      };
    case "acquire-via-route":
      return {
        type,
        routeId: parseRouteId(
          getField(record, "routeId", path),
          `${path}.routeId`,
        ),
        amountIn: parseDecimalString(
          getField(record, "amountIn", path),
          `${path}.amountIn`,
        ),
        expectedAmountOut: parseDecimalString(
          getField(record, "expectedAmountOut", path),
          `${path}.expectedAmountOut`,
        ),
      };
  }
}

function parseRouteArtifact(value: unknown, path: string): FameRouteArtifact {
  const record = parseObject(value, path);
  const executionContext = parseObject(
    getField(record, "executionContext", path),
    `${path}.executionContext`,
  );

  return {
    id: parseRouteId(getField(record, "id", path), `${path}.id`),
    description: parseNonEmptyString(
      getField(record, "description", path),
      `${path}.description`,
    ),
    poolIds: parseArray(
      getField(record, "poolIds", path),
      `${path}.poolIds`,
      parseRouteId,
    ),
    executionContext: {
      executor: parseAddress(
        getField(executionContext, "executor", `${path}.executionContext`),
        `${path}.executionContext.executor`,
      ),
      recipient: parseAddress(
        getField(executionContext, "recipient", `${path}.executionContext`),
        `${path}.executionContext.recipient`,
      ),
      deadline: parseDecimalString(
        getField(executionContext, "deadline", `${path}.executionContext`),
        `${path}.executionContext.deadline`,
      ),
    },
    route: parseJsonFameRoute(getField(record, "route", path), `${path}.route`),
    abiEncodedRoute: parseHex(
      getField(record, "abiEncodedRoute", path),
      `${path}.abiEncodedRoute`,
    ),
    routeHash: parseBytes32(
      getField(record, "routeHash", path),
      `${path}.routeHash`,
    ),
    callValue: parseDecimalString(
      getField(record, "callValue", path),
      `${path}.callValue`,
    ),
    funding: parseRouteFunding(
      getField(record, "funding", path),
      `${path}.funding`,
    ),
    capabilities: parseRouteCapabilities(
      getField(record, "capabilities", path),
      `${path}.capabilities`,
    ),
    debug: parseRouteDebug(getField(record, "debug", path), `${path}.debug`),
  };
}

export function parseFameSolverRoutesFile(
  value: unknown,
  path = "solverRoutes",
): FameSolverRoutesFile {
  const record = parseObject(value, path);
  return {
    schemaVersion: parseSchemaVersion(
      getField(record, "schemaVersion", path),
      `${path}.schemaVersion`,
    ),
    status: parseEnum(getField(record, "status", path), `${path}.status`, [
      "generated-fork-evidence",
    ] as const),
    pinnedBaseBlock: parseInteger(
      getField(record, "pinnedBaseBlock", path),
      `${path}.pinnedBaseBlock`,
    ),
    generator: parseEnum(
      getField(record, "generator", path),
      `${path}.generator`,
      ["router-ts"] as const,
    ),
    routes: parseArray(
      getField(record, "routes", path),
      `${path}.routes`,
      parseRouteArtifact,
    ),
  };
}

function parseRouteParityVector(
  value: unknown,
  path: string,
): FameRouteParityVector {
  const record = parseObject(value, path);
  return {
    id: parseRouteId(getField(record, "id", path), `${path}.id`),
    route: parseJsonFameRoute(getField(record, "route", path), `${path}.route`),
    abiEncodedRoute: parseHex(
      getField(record, "abiEncodedRoute", path),
      `${path}.abiEncodedRoute`,
    ),
    routeHash: parseBytes32(
      getField(record, "routeHash", path),
      `${path}.routeHash`,
    ),
  };
}

export function parseFameRouteParityVectorsFile(
  value: unknown,
  path = "parityVectors",
): FameRouteParityVectorsFile {
  const record = parseObject(value, path);
  return {
    schemaVersion: parseSchemaVersion(
      getField(record, "schemaVersion", path),
      `${path}.schemaVersion`,
    ),
    pinnedBaseBlock: parseInteger(
      getField(record, "pinnedBaseBlock", path),
      `${path}.pinnedBaseBlock`,
    ),
    vectors: parseArray(
      getField(record, "vectors", path),
      `${path}.vectors`,
      parseRouteParityVector,
    ),
  };
}

function parseRouteGapRow(value: unknown, path: string): FameRouteGapRow {
  const record = parseObject(value, path);
  const routeArtifactIdValue = getField(record, "routeArtifactId", path);
  const blockerValue = getField(record, "blocker", path);

  return {
    id: parseRouteId(getField(record, "id", path), `${path}.id`),
    tokenIn: parseAddress(getField(record, "tokenIn", path), `${path}.tokenIn`),
    tokenOut: parseAddress(
      getField(record, "tokenOut", path),
      `${path}.tokenOut`,
    ),
    direction: parseNonEmptyString(
      getField(record, "direction", path),
      `${path}.direction`,
    ),
    supported: parseBoolean(
      getField(record, "supported", path),
      `${path}.supported`,
    ),
    executable: parseEnum(
      getField(record, "executable", path),
      `${path}.executable`,
      ["executable", "blocked"] as const,
    ),
    tsGenerated: parseBoolean(
      getField(record, "tsGenerated", path),
      `${path}.tsGenerated`,
    ),
    forkTested: parseBoolean(
      getField(record, "forkTested", path),
      `${path}.forkTested`,
    ),
    routeArtifactId:
      routeArtifactIdValue === null
        ? null
        : parseRouteId(routeArtifactIdValue, `${path}.routeArtifactId`),
    blocker:
      blockerValue === null
        ? null
        : parseNonEmptyString(blockerValue, `${path}.blocker`),
    capabilities: parseRouteCapabilities(
      getField(record, "capabilities", path),
      `${path}.capabilities`,
    ),
  };
}

export function parseFameRouteGapMatrixFile(
  value: unknown,
  path = "gapMatrix",
): FameRouteGapMatrixFile {
  const record = parseObject(value, path);
  return {
    schemaVersion: parseSchemaVersion(
      getField(record, "schemaVersion", path),
      `${path}.schemaVersion`,
    ),
    pinnedBaseBlock: parseInteger(
      getField(record, "pinnedBaseBlock", path),
      `${path}.pinnedBaseBlock`,
    ),
    rows: parseArray(
      getField(record, "rows", path),
      `${path}.rows`,
      parseRouteGapRow,
    ),
  };
}

function parseConstantProductPoolFields(
  record: Record<string, unknown>,
  path: string,
): {
  pool: Address;
  token0: Address;
  token1: Address;
} {
  return {
    pool: parseAddress(getField(record, "pool", path), `${path}.pool`),
    token0: parseAddress(getField(record, "token0", path), `${path}.token0`),
    token1: parseAddress(getField(record, "token1", path), `${path}.token1`),
  };
}

function parsePoolEnablement(
  value: unknown,
  path: string,
): FamePoolEnablement {
  const record = parseObject(value, path);
  const status = parseEnum(getField(record, "status", path), `${path}.status`, [
    "enabled",
    "blocked",
  ] as const);

  if (status === "enabled") return { status };

  return {
    status,
    reason: parseNonEmptyString(
      getField(record, "reason", path),
      `${path}.reason`,
    ),
  };
}

function poolBaseFields(
  record: Record<string, unknown>,
  path: string,
): {
  enablement?: FamePoolEnablement;
} {
  const enablement = getOptionalField(record, "enablement");
  return enablement === undefined
    ? {}
    : { enablement: parsePoolEnablement(enablement, `${path}.enablement`) };
}

function parsePoolConfig(value: unknown, path: string): FamePoolConfig {
  const record = parseObject(value, path);
  const id = parseRouteId(getField(record, "id", path), `${path}.id`);
  const venue = parseEnum(
    getField(record, "venue", path),
    `${path}.venue`,
    poolVenues,
  );
  const router = parseAddress(
    getField(record, "router", path),
    `${path}.router`,
  );
  const baseFields = poolBaseFields(record, path);

  switch (venue) {
    case "solidly": {
      const constantProduct = parseConstantProductPoolFields(record, path);
      return {
        id,
        venue,
        router,
        ...baseFields,
        ...constantProduct,
        stable: parseBoolean(
          getField(record, "stable", path),
          `${path}.stable`,
        ),
        feeBps: parseFiniteNumber(
          getField(record, "feeBps", path),
          `${path}.feeBps`,
          { min: 0 },
        ),
      };
    }
    case "uniswap-v2": {
      const constantProduct = parseConstantProductPoolFields(record, path);
      return {
        id,
        venue,
        router,
        ...baseFields,
        ...constantProduct,
        feeBps: parseFiniteNumber(
          getField(record, "feeBps", path),
          `${path}.feeBps`,
          { min: 0 },
        ),
      };
    }
    case "aerodrome-slipstream":
    case "aerodrome-slipstream2": {
      const constantProduct = parseConstantProductPoolFields(record, path);
      return {
        id,
        venue,
        router,
        ...baseFields,
        ...constantProduct,
        factory: parseAddress(
          getField(record, "factory", path),
          `${path}.factory`,
        ),
        tickSpacing: parseInteger(
          getField(record, "tickSpacing", path),
          `${path}.tickSpacing`,
          { min: 1 },
        ),
        feeBps: parseFiniteNumber(
          getField(record, "feeBps", path),
          `${path}.feeBps`,
          { min: 0 },
        ),
      };
    }
    case "uniswap-v3": {
      const constantProduct = parseConstantProductPoolFields(record, path);
      return {
        id,
        venue,
        router,
        ...baseFields,
        ...constantProduct,
        fee: parseInteger(getField(record, "fee", path), `${path}.fee`),
        tickSpacing: parseInteger(
          getField(record, "tickSpacing", path),
          `${path}.tickSpacing`,
          { min: 1 },
        ),
      };
    }
    case "uniswap-v4": {
      const hookData = getOptionalField(record, "hookData");
      return {
        id,
        venue,
        router,
        ...baseFields,
        poolManager: parseAddress(
          getField(record, "poolManager", path),
          `${path}.poolManager`,
        ),
        stateView: parseAddress(
          getField(record, "stateView", path),
          `${path}.stateView`,
        ),
        poolId: parseBytes32(
          getField(record, "poolId", path),
          `${path}.poolId`,
        ),
        currency0: parseAddress(
          getField(record, "currency0", path),
          `${path}.currency0`,
        ),
        currency1: parseAddress(
          getField(record, "currency1", path),
          `${path}.currency1`,
        ),
        fee: parseInteger(getField(record, "fee", path), `${path}.fee`),
        tickSpacing: parseInteger(
          getField(record, "tickSpacing", path),
          `${path}.tickSpacing`,
          { min: 1 },
        ),
        hooks: parseAddress(getField(record, "hooks", path), `${path}.hooks`),
        ...(hookData === undefined
          ? {}
          : { hookData: parseHex(hookData, `${path}.hookData`) }),
      };
    }
    case "native-wrap": {
      return {
        id,
        venue,
        router,
        ...baseFields,
        weth: parseAddress(getField(record, "weth", path), `${path}.weth`),
      };
    }
  }
}

export function parseFamePoolUniverseFile(
  value: unknown,
  path = "pools",
): FamePoolUniverseFile {
  const record = parseObject(value, path);
  return {
    schemaVersion: parseSchemaVersion(
      getField(record, "schemaVersion", path),
      `${path}.schemaVersion`,
    ),
    status: parseNonEmptyString(
      getField(record, "status", path),
      `${path}.status`,
    ),
    pinnedBaseBlock: parseInteger(
      getField(record, "pinnedBaseBlock", path),
      `${path}.pinnedBaseBlock`,
    ),
    source: parseNonEmptyString(
      getField(record, "source", path),
      `${path}.source`,
    ),
    pools: parseArray(
      getField(record, "pools", path),
      `${path}.pools`,
      parsePoolConfig,
    ),
    pendingLaunchBlockingPools: parseStringArray(
      getField(record, "pendingLaunchBlockingPools", path),
      `${path}.pendingLaunchBlockingPools`,
    ),
  };
}

function parseProtocolEvidenceItem(value: unknown, path: string) {
  const record = parseObject(value, path);
  const rawValue = getOptionalField(record, "value");
  const rawReason = getOptionalField(record, "reason");
  return {
    status: parseEnum(
      getField(record, "status", path),
      `${path}.status`,
      protocolEvidenceStatuses,
    ),
    source: parseNonEmptyString(
      getField(record, "source", path),
      `${path}.source`,
    ),
    ...(rawValue === undefined
      ? {}
      : { value: parseNonEmptyString(rawValue, `${path}.value`) }),
    ...(rawReason === undefined
      ? {}
      : { reason: parseNonEmptyString(rawReason, `${path}.reason`) }),
  };
}

function parseProtocolEvidence(
  value: unknown,
  path: string,
): FameProtocolEvidence {
  const record = parseObject(value, path);
  return {
    quote: parseProtocolEvidenceItem(
      getField(record, "quote", path),
      `${path}.quote`,
    ),
    prePrice: parseProtocolEvidenceItem(
      getField(record, "prePrice", path),
      `${path}.prePrice`,
    ),
    postPrice: parseProtocolEvidenceItem(
      getField(record, "postPrice", path),
      `${path}.postPrice`,
    ),
    marketImpact: parseProtocolEvidenceItem(
      getField(record, "marketImpact", path),
      `${path}.marketImpact`,
    ),
    activeLiquidity: parseProtocolEvidenceItem(
      getField(record, "activeLiquidity", path),
      `${path}.activeLiquidity`,
    ),
  };
}

function parsePriceImpact(
  value: unknown,
  path: string,
): FameSnapshotQuoteEntry["priceImpact"] {
  const record = parseObject(value, path);
  const postSwapPriceX18 = getField(record, "postSwapPriceX18", path);
  return {
    preSwapPriceX18: parseDecimalString(
      getField(record, "preSwapPriceX18", path),
      `${path}.preSwapPriceX18`,
    ),
    postSwapPriceX18:
      postSwapPriceX18 === null
        ? null
        : parseDecimalString(postSwapPriceX18, `${path}.postSwapPriceX18`),
    executionPriceX18: parseDecimalString(
      getField(record, "executionPriceX18", path),
      `${path}.executionPriceX18`,
    ),
    marketImpactBps: parseNullableFiniteNumber(
      getField(record, "marketImpactBps", path),
      `${path}.marketImpactBps`,
    ),
    method: parseEnum(
      getField(record, "method", path),
      `${path}.method`,
      priceImpactMethods,
    ),
  };
}

function parseSnapshotReserveState(
  value: unknown,
  path: string,
): FameSnapshotReserveState {
  const record = parseObject(value, path);
  return {
    poolId: parseRouteId(getField(record, "poolId", path), `${path}.poolId`),
    pool: parseAddress(getField(record, "pool", path), `${path}.pool`),
    token0: parseAddress(getField(record, "token0", path), `${path}.token0`),
    token1: parseAddress(getField(record, "token1", path), `${path}.token1`),
    reserve0: parseDecimalString(
      getField(record, "reserve0", path),
      `${path}.reserve0`,
    ),
    reserve1: parseDecimalString(
      getField(record, "reserve1", path),
      `${path}.reserve1`,
    ),
    source: parseEnum(getField(record, "source", path), `${path}.source`, [
      "getReserves",
    ] as const),
  };
}

function parseSnapshotQuoteEntry(
  value: unknown,
  path: string,
): FameSnapshotQuoteEntry {
  const record = parseObject(value, path);
  const priceImpact = getOptionalField(record, "priceImpact");
  const protocolEvidence = getOptionalField(record, "protocolEvidence");
  return {
    poolId: parseRouteId(getField(record, "poolId", path), `${path}.poolId`),
    tokenIn: parseAddress(getField(record, "tokenIn", path), `${path}.tokenIn`),
    tokenOut: parseAddress(
      getField(record, "tokenOut", path),
      `${path}.tokenOut`,
    ),
    amountIn: parseDecimalString(
      getField(record, "amountIn", path),
      `${path}.amountIn`,
    ),
    amountOut: parseDecimalString(
      getField(record, "amountOut", path),
      `${path}.amountOut`,
    ),
    evidence: parseNonEmptyString(
      getField(record, "evidence", path),
      `${path}.evidence`,
    ),
    ...(priceImpact === undefined
      ? {}
      : { priceImpact: parsePriceImpact(priceImpact, `${path}.priceImpact`) }),
    ...(protocolEvidence === undefined
      ? {}
      : {
          protocolEvidence: parseProtocolEvidence(
            protocolEvidence,
            `${path}.protocolEvidence`,
          ),
        }),
  };
}

function parseUnsupportedQuotePool(value: unknown, path: string) {
  const record = parseObject(value, path);
  return {
    poolId: parseRouteId(getField(record, "poolId", path), `${path}.poolId`),
    reason: parseNonEmptyString(
      getField(record, "reason", path),
      `${path}.reason`,
    ),
  };
}

export function parseFamePoolStateSnapshotFile(
  value: unknown,
  path = "poolStateSnapshot",
): FamePoolStateSnapshotFile {
  const record = parseObject(value, path);
  return {
    schemaVersion: parseInteger(
      getField(record, "schemaVersion", path),
      `${path}.schemaVersion`,
    ),
    status: parseEnum(getField(record, "status", path), `${path}.status`, [
      "generated-live-liquidity-snapshot",
    ] as const),
    snapshotId: parseNonEmptyString(
      getField(record, "snapshotId", path),
      `${path}.snapshotId`,
    ),
    pinnedBaseBlock: parseInteger(
      getField(record, "pinnedBaseBlock", path),
      `${path}.pinnedBaseBlock`,
    ),
    capturedBaseBlock: parseInteger(
      getField(record, "capturedBaseBlock", path),
      `${path}.capturedBaseBlock`,
    ),
    generatedAt: parseNonEmptyString(
      getField(record, "generatedAt", path),
      `${path}.generatedAt`,
    ),
    source: parseNonEmptyString(
      getField(record, "source", path),
      `${path}.source`,
    ),
    reserveStates: parseArray(
      getField(record, "reserveStates", path),
      `${path}.reserveStates`,
      parseSnapshotReserveState,
    ),
    quoteTable: parseArray(
      getField(record, "quoteTable", path),
      `${path}.quoteTable`,
      parseSnapshotQuoteEntry,
    ),
    unsupportedQuotePools: parseArray(
      getField(record, "unsupportedQuotePools", path),
      `${path}.unsupportedQuotePools`,
      parseUnsupportedQuotePool,
    ),
  };
}
