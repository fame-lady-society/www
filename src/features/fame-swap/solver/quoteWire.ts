import { isAddress, isHex, type Address, type Hex } from "viem";
import type { FameSwapConfig } from "../config";
import { hashFameRoute } from "../router/encodeRoute";
import {
  routeFromJson,
  type FameRouteCapabilities,
  type JsonFameRoute,
} from "../router/types";
import { fameSwapTransactionRequests } from "../transactions";
import type { FameSwapToken } from "../tokens";
import { supportedDirections } from "./artifacts";
import type {
  FameSwapNotLiveReadyQuote,
  FameSwapQuote,
  FameSwapQuoteStatus,
  FameSwapRouteDisplayLeg,
} from "./types";
import type { FameCandidateRejection, FameLegQuote } from "./quotes/adapters";
import type { FameQuoteContext } from "./quotes/quoteContext";
import type { FameRouteFeeBreakdown } from "./quotes/rankRoutes";

export interface DeserializeQuoteInput {
  tokenIn: FameSwapToken;
  tokenOut: FameSwapToken;
  amountIn: bigint;
  config: FameSwapConfig;
}

type JsonSafe =
  | null
  | string
  | number
  | boolean
  | JsonSafe[]
  | { [key: string]: JsonSafe };

export const FAME_SWAP_QUOTE_WIRE_STATUSES = {
  ready: true,
  unsupported: true,
  stale_artifact: true,
  not_live_ready: true,
  no_safe_route: true,
  quote_adapter_failure: true,
  simulation_failure: true,
} satisfies Record<FameSwapQuoteStatus, true>;

function assertNever(value: never): never {
  throw new Error(
    `Unhandled FAME quote status ${(value as { status?: string }).status}`,
  );
}

function toJsonSafe(value: unknown): JsonSafe {
  if (value === null || value === undefined) return null;
  if (typeof value === "bigint") return value.toString();
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(toJsonSafe);
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, toJsonSafe(entry)]),
    );
  }

  return String(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function bigintFrom(value: unknown, fallback = 0n): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number" && Number.isSafeInteger(value)) {
    return BigInt(value);
  }
  if (typeof value === "string" && /^[0-9]+$/.test(value)) return BigInt(value);
  return fallback;
}

function numberFrom(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function booleanFrom(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function addressFrom(value: unknown, fallback: Address | null): Address | null {
  return typeof value === "string" && isAddress(value) ? value : fallback;
}

function parseQuoteContext(value: unknown): FameQuoteContext | undefined {
  const raw = asRecord(value);
  if (raw.source === "live" || raw.source === "fork") {
    return {
      source: raw.source,
      chainId: numberFrom(raw.chainId),
      blockNumber: bigintFrom(raw.blockNumber),
    };
  }

  if (raw.source === "snapshot") {
    return {
      source: "snapshot",
      snapshotId: String(raw.snapshotId ?? ""),
      pinnedBaseBlock: numberFrom(raw.pinnedBaseBlock),
    };
  }

  if (raw.source === "deterministic_test") {
    return {
      source: "deterministic_test",
      profileId: String(raw.profileId ?? ""),
    };
  }

  return undefined;
}

function parseRejections(value: unknown): FameCandidateRejection[] {
  return Array.isArray(value)
    ? value.map((entry) => {
        const raw = asRecord(entry);
        const failedLegIndex =
          typeof raw.failedLegIndex === "number" &&
          Number.isInteger(raw.failedLegIndex)
            ? raw.failedLegIndex
            : undefined;
        const failedPoolId =
          typeof raw.failedPoolId === "string" ? raw.failedPoolId : undefined;
        const failedAmountIn =
          raw.failedAmountIn === undefined
            ? undefined
            : bigintFrom(raw.failedAmountIn);

        return {
          candidateId: String(raw.candidateId ?? "unknown"),
          reason: String(
            raw.reason ?? "adapter_failure",
          ) as FameCandidateRejection["reason"],
          message: String(raw.message ?? "Quote candidate failed."),
          ...(failedLegIndex === undefined ? {} : { failedLegIndex }),
          ...(failedPoolId === undefined ? {} : { failedPoolId }),
          ...(failedAmountIn === undefined ? {} : { failedAmountIn }),
        };
      })
    : [];
}

function parseLegQuote(value: unknown): FameLegQuote {
  const raw = asRecord(value);
  const priceImpact = asRecord(raw.priceImpact);
  return {
    poolId: String(raw.poolId ?? "unknown"),
    tokenIn: addressFrom(
      raw.tokenIn,
      "0x0000000000000000000000000000000000000000",
    )!,
    tokenOut: addressFrom(
      raw.tokenOut,
      "0x0000000000000000000000000000000000000000",
    )!,
    venue: String(raw.venue ?? "unknown") as FameLegQuote["venue"],
    amountIn: bigintFrom(raw.amountIn),
    amountOut: bigintFrom(raw.amountOut),
    minAmountOut: bigintFrom(raw.minAmountOut),
    fee: asRecord(raw.fee) as FameLegQuote["fee"],
    feeAmount: raw.feeAmount === null ? null : bigintFrom(raw.feeAmount),
    feeIncludedInQuote: booleanFrom(raw.feeIncludedInQuote, true),
    evidence: String(raw.evidence ?? "quote evidence unavailable"),
    quoteContext: parseQuoteContext(raw.quoteContext),
    priceImpact:
      priceImpact.preSwapPriceX18 || priceImpact.executionPriceX18
        ? {
            preSwapPriceX18: bigintFrom(priceImpact.preSwapPriceX18),
            postSwapPriceX18:
              priceImpact.postSwapPriceX18 === null
                ? null
                : bigintFrom(priceImpact.postSwapPriceX18),
            executionPriceX18: bigintFrom(priceImpact.executionPriceX18),
            marketImpactBps:
              typeof priceImpact.marketImpactBps === "number"
                ? priceImpact.marketImpactBps
                : null,
            method:
              priceImpact.method === "quote-table" ||
              priceImpact.method === "concentrated-liquidity-slot0" ||
              priceImpact.method === "quoter-price-after"
                ? priceImpact.method
                : "constant-product-reserves",
          }
        : undefined,
  };
}

function parseFeeBreakdown(value: unknown): FameRouteFeeBreakdown {
  const raw = asRecord(value);
  const marketImpact = asRecord(raw.marketImpact);
  return {
    routerFeePpm: bigintFrom(raw.routerFeePpm),
    routerFeeAmount: bigintFrom(raw.routerFeeAmount),
    venueFeesIncluded: booleanFrom(raw.venueFeesIncluded, true),
    legs: Array.isArray(raw.legs) ? raw.legs.map(parseLegQuote) : [],
    marketImpact: {
      routeExecutionPriceX18:
        marketImpact.routeExecutionPriceX18 === null
          ? null
          : bigintFrom(marketImpact.routeExecutionPriceX18),
      maxLegMarketImpactBps:
        typeof marketImpact.maxLegMarketImpactBps === "number"
          ? marketImpact.maxLegMarketImpactBps
          : null,
      computableLegs: numberFrom(marketImpact.computableLegs, 0),
    },
  };
}

function parseCapabilities(value: unknown): FameRouteCapabilities {
  const raw = asRecord(value);
  return {
    nativeEth: booleanFrom(raw.nativeEth),
    weth: booleanFrom(raw.weth),
    permit2UniversalRouter: booleanFrom(raw.permit2UniversalRouter),
    v4Hooks: booleanFrom(raw.v4Hooks),
    v4HookAddress: booleanFrom(raw.v4HookAddress),
    v4NonEmptyHookData: booleanFrom(raw.v4NonEmptyHookData),
    v4MultiHopPathKeys: booleanFrom(raw.v4MultiHopPathKeys),
    split: booleanFrom(raw.split),
    splitThenMerge: booleanFrom(raw.splitThenMerge),
  };
}

function parseBlockedReadiness(
  value: unknown,
): FameSwapNotLiveReadyQuote["readiness"] {
  const raw = asRecord(value);
  return {
    status: "not_live_ready",
    reason: String(
      raw.reason ?? "read_error",
    ) as FameSwapNotLiveReadyQuote["readiness"]["reason"],
    message: String(raw.message ?? "FAME router is not live-ready."),
    routerAddress: addressFrom(raw.routerAddress, null),
  };
}

export function displaySafeErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  return (
    raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(
        (line) =>
          line.length > 0 &&
          !/\b(request body|calldata|approval|swap request|private key|signer|authorization|api[-_ ]?key)\b|(?:^|\s)secret(?:[-_ ]?(?:key|token))?\s*[:=]/i.test(
            line,
          ),
      ) ?? "FAME quote request failed."
  )
    .replace(/(?:https?|wss?):\/\/\S+/g, "[redacted-url]")
    .replace(/\b(?:bearer|token)\s+[a-z0-9._~+/=-]+/gi, "[redacted-secret]")
    .replace(/0x[a-fA-F0-9]{64,}/g, "[redacted-hex]");
}

export function quoteAdapterFailure(
  input: DeserializeQuoteInput,
  message: string,
): FameSwapQuote {
  return {
    status: "quote_adapter_failure",
    tokenIn: input.tokenIn,
    tokenOut: input.tokenOut,
    requestedAmountIn: input.amountIn,
    rejectedCandidates: [
      {
        candidateId: "api-runner",
        reason: "adapter_failure",
        message,
      },
    ],
    message,
    diagnosticsVisibleByDefault: true,
  };
}

export function publicFeeBreakdown(
  feeBreakdown: FameRouteFeeBreakdown,
): FameRouteFeeBreakdown {
  return {
    ...feeBreakdown,
    legs: feeBreakdown.legs.map(
      ({ protocolEvidence: _protocolEvidence, ...leg }) => leg,
    ),
  };
}

export function serializeFameSwapQuoteResponse(
  quote: FameSwapQuote,
): Record<string, JsonSafe> {
  switch (quote.status) {
    case "ready": {
      const requests = fameSwapTransactionRequests(quote);
      return toJsonSafe({
        status: quote.status,
        tokenIn: quote.tokenIn,
        tokenOut: quote.tokenOut,
        requestedAmountIn: quote.requestedAmountIn,
        message: quote.message,
        diagnosticsVisibleByDefault: quote.diagnosticsVisibleByDefault,
        routeArtifactId: quote.routeArtifactId,
        routeSource: quote.routeSource,
        routerAddress: quote.routerAddress,
        grossEstimatedOutput: quote.grossEstimatedOutput,
        estimatedOutput: quote.estimatedOutput,
        routerFeeAmount: quote.routerFeeAmount,
        minAmountOutAfterFee: quote.minAmountOutAfterFee,
        feeBreakdown: publicFeeBreakdown(quote.feeBreakdown),
        quoteContext: quote.quoteContext,
        feePpm: quote.feePpm,
        capabilities: quote.capabilities,
        callValue: quote.callValue,
        slippageBps: quote.slippageBps,
        expiresAt: quote.expiresAt,
        fixtureRouteHash: quote.fixtureRouteHash,
        materializedRouteHash: quote.materializedRouteHash,
        routeHash: quote.materializedRouteHash,
        poolIds: quote.poolIds,
        warnings: quote.warnings,
        rejectedCandidates: quote.rejectedCandidates,
        approval: requests.approval,
        swap: requests.swap,
        route: quote.route,
        routeDisplay: quote.routeDisplay,
      }) as Record<string, JsonSafe>;
    }
    case "unsupported":
    case "stale_artifact":
    case "not_live_ready":
    case "no_safe_route":
    case "quote_adapter_failure":
    case "simulation_failure":
      return toJsonSafe(quote) as Record<string, JsonSafe>;
    default:
      return assertNever(quote);
  }
}

export function deserializeFameSwapQuoteResponse(
  data: unknown,
  input: DeserializeQuoteInput,
): FameSwapQuote {
  const raw = asRecord(data);
  const status = raw.status;
  const message = String(raw.message ?? "FAME quote unavailable.");
  const requestedAmountIn = bigintFrom(raw.requestedAmountIn, input.amountIn);

  if (status === "ready") {
    try {
      const route = routeFromJson(raw.route as JsonFameRoute);
      const routerAddress = addressFrom(
        raw.routerAddress,
        input.config.routerAddress,
      );
      const fixtureRouteHash = String(
        raw.fixtureRouteHash ?? raw.routeHash ?? "0x",
      ) as Hex;
      const materializedRouteHash = String(
        raw.materializedRouteHash ?? raw.routeHash ?? "0x",
      ) as Hex;
      if (
        !routerAddress ||
        !isHex(fixtureRouteHash) ||
        fixtureRouteHash === "0x" ||
        !isHex(materializedRouteHash) ||
        materializedRouteHash === "0x" ||
        hashFameRoute(route) !== materializedRouteHash
      ) {
        return quoteAdapterFailure(input, "FAME quote response was malformed.");
      }

      return {
        status: "ready",
        tokenIn: input.tokenIn,
        tokenOut: input.tokenOut,
        requestedAmountIn,
        routerAddress,
        routeArtifactId: String(raw.routeArtifactId ?? "generated"),
        routeSource: raw.routeSource === "artifact" ? "artifact" : "generated",
        fixtureRouteHash,
        materializedRouteHash,
        poolIds: Array.isArray(raw.poolIds) ? raw.poolIds.map(String) : [],
        route,
        approval: input.tokenIn.native
          ? null
          : {
              token: input.tokenIn,
              spender: routerAddress,
              amount: route.amountIn,
            },
        callValue: input.tokenIn.native
          ? route.amountIn
          : bigintFrom(raw.callValue),
        grossEstimatedOutput: bigintFrom(raw.grossEstimatedOutput),
        routerFeeAmount: bigintFrom(raw.routerFeeAmount),
        estimatedOutput: bigintFrom(raw.estimatedOutput),
        minAmountOutAfterFee: bigintFrom(raw.minAmountOutAfterFee),
        feeBreakdown: parseFeeBreakdown(raw.feeBreakdown),
        quoteContext: parseQuoteContext(raw.quoteContext),
        feePpm: bigintFrom(raw.feePpm),
        capabilities: parseCapabilities(raw.capabilities),
        routeDisplay: Array.isArray(raw.routeDisplay)
          ? (raw.routeDisplay as FameSwapRouteDisplayLeg[])
          : [],
        rejectedCandidates: parseRejections(raw.rejectedCandidates),
        slippageBps: numberFrom(
          raw.slippageBps,
          input.config.defaultSlippageBps,
        ),
        expiresAt: new Date(String(raw.expiresAt ?? Date.now())),
        warnings: Array.isArray(raw.warnings) ? raw.warnings.map(String) : [],
        message,
        diagnosticsVisibleByDefault: booleanFrom(
          raw.diagnosticsVisibleByDefault,
        ),
      };
    } catch {
      return quoteAdapterFailure(input, "FAME quote response was malformed.");
    }
  }

  if (status === "unsupported") {
    return {
      status: "unsupported",
      tokenIn: input.tokenIn,
      tokenOut: input.tokenOut,
      requestedAmountIn,
      availableDirections: Array.isArray(raw.availableDirections)
        ? raw.availableDirections.map(String)
        : supportedDirections(),
      message,
      diagnosticsVisibleByDefault: booleanFrom(
        raw.diagnosticsVisibleByDefault,
        true,
      ),
    };
  }

  if (status === "not_live_ready") {
    return {
      status: "not_live_ready",
      tokenIn: input.tokenIn,
      tokenOut: input.tokenOut,
      requestedAmountIn,
      readiness: parseBlockedReadiness(raw.readiness),
      message,
      diagnosticsVisibleByDefault: booleanFrom(
        raw.diagnosticsVisibleByDefault,
        true,
      ),
    };
  }

  if (status === "stale_artifact") {
    return {
      status: "stale_artifact",
      tokenIn: input.tokenIn,
      tokenOut: input.tokenOut,
      requestedAmountIn,
      reason: String(raw.reason ?? message),
      message,
      diagnosticsVisibleByDefault: booleanFrom(
        raw.diagnosticsVisibleByDefault,
        true,
      ),
    };
  }

  if (status === "no_safe_route") {
    return {
      status: "no_safe_route",
      tokenIn: input.tokenIn,
      tokenOut: input.tokenOut,
      requestedAmountIn,
      rejectedCandidates: parseRejections(raw.rejectedCandidates),
      message,
      diagnosticsVisibleByDefault: booleanFrom(
        raw.diagnosticsVisibleByDefault,
        true,
      ),
    };
  }

  if (status === "simulation_failure") {
    return {
      status: "simulation_failure",
      tokenIn: input.tokenIn,
      tokenOut: input.tokenOut,
      requestedAmountIn,
      reason: String(raw.reason ?? message),
      rejectedCandidates: parseRejections(raw.rejectedCandidates),
      message,
      diagnosticsVisibleByDefault: booleanFrom(
        raw.diagnosticsVisibleByDefault,
        true,
      ),
    };
  }

  return {
    status: "quote_adapter_failure",
    tokenIn: input.tokenIn,
    tokenOut: input.tokenOut,
    requestedAmountIn,
    rejectedCandidates: parseRejections(raw.rejectedCandidates),
    message,
    diagnosticsVisibleByDefault: booleanFrom(
      raw.diagnosticsVisibleByDefault,
      true,
    ),
  };
}
