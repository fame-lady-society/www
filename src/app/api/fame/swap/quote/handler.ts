import { NextRequest } from "next/server";
import { isAddress, type Address } from "viem";
import { getFameSwapConfig } from "@/features/fame-swap/config";
import { routeArtifactById } from "@/features/fame-swap/solver/artifacts";
import {
  createProductionFameQuoteDependencies,
  quoteFameExactInput,
} from "@/features/fame-swap/server/quoteService";
import { DEFAULT_FAME_OPTIMIZER_BUDGETS } from "@/features/fame-swap/solver/optimizer/runContext";
import { serializeFameSwapQuoteResponse } from "@/features/fame-swap/solver/quoteWire";
import type { FameAsyncQuoteAdapter } from "@/features/fame-swap/solver/quotes/adapters";
import type { FamePoolQuoteClient } from "@/features/fame-swap/solver/quotes/indexedQuoteApiClient";
import { normalizeSlippageBps } from "@/features/fame-swap/solver/slippage";
import { deadlineMinutesToSeconds } from "@/features/fame-swap/solver/deadline";
import { displaySafeDiagnosticMessage } from "@/features/fame-swap/solver/diagnostics";
import { tokenForAddress } from "@/features/fame-swap/tokens";
import type {
  FameSwapQuote,
  FameSwapQuoteRequest,
  FameSwapReadiness,
} from "@/features/fame-swap/solver/types";

const MAX_JSON_BODY_BYTES = 4_096;
const MAX_UINT256 = (1n << 256n) - 1n;
const QUOTE_REQUEST_TIMEOUT_MS = 15_000;
const QUOTE_RESPONSE_CUSHION_MS = 1_500;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 90;

interface ParsedQuoteBody {
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  recipient: Address | null;
  routerAddress?: Address;
  slippageBps?: number;
  deadlineMinutes?: number;
  routeId?: string;
  includeDebug: boolean;
}

interface FameSwapQuotePostDependencies {
  readinessForQuote?: (
    routerAddress: Address | null,
  ) => FameSwapReadiness | Promise<FameSwapReadiness>;
  quoteForRequest?: (
    request: FameSwapQuoteRequest & { readiness: FameSwapReadiness },
  ) => FameSwapQuote | Promise<FameSwapQuote>;
  quoteAdapterForRequest?: (
    request: FameSwapQuoteRequest & { readiness: FameSwapReadiness },
  ) => FameAsyncQuoteAdapter | Promise<FameAsyncQuoteAdapter>;
  quoteApiClient?: FamePoolQuoteClient | null;
}

const rateLimitBuckets = new Map<string, { resetAt: number; count: number }>();

function json(data: unknown, init?: ResponseInit): Response {
  return new Response(
    JSON.stringify(data, (_key, value) =>
      typeof value === "bigint" ? value.toString() : value,
    ),
    {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(init?.headers ?? {}),
      },
    },
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function bodyTooLarge(request: NextRequest): boolean {
  const contentLength = request.headers.get("content-length");
  if (!contentLength) return false;

  const parsed = Number(contentLength);
  return Number.isFinite(parsed) && parsed > MAX_JSON_BODY_BYTES;
}

function clientRateLimitKey(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "local"
  );
}

function rateLimited(request: NextRequest): boolean {
  const now = Date.now();
  const key = clientRateLimitKey(request);
  const current = rateLimitBuckets.get(key);
  if (!current || current.resetAt <= now) {
    rateLimitBuckets.set(key, {
      resetAt: now + RATE_LIMIT_WINDOW_MS,
      count: 1,
    });
    return false;
  }

  current.count += 1;
  return current.count > RATE_LIMIT_MAX_REQUESTS;
}

function parseQuoteBody(value: unknown): ParsedQuoteBody | string {
  const body = asRecord(value);
  if (!body) return "Expected a JSON quote request object.";

  if (typeof body.tokenIn !== "string" || !isAddress(body.tokenIn)) {
    return "tokenIn must be an address.";
  }
  if (typeof body.tokenOut !== "string" || !isAddress(body.tokenOut)) {
    return "tokenOut must be an address.";
  }
  if (
    typeof body.amountIn !== "string" ||
    !/^[0-9]+$/.test(body.amountIn) ||
    body.amountIn.length > 78
  ) {
    return "amountIn must be a raw integer string.";
  }

  const amountIn = BigInt(body.amountIn);
  if (amountIn > MAX_UINT256) {
    return "amountIn must fit within uint256.";
  }

  if (body.routeId !== undefined) {
    if (
      typeof body.routeId !== "string" ||
      body.routeId.length > 160 ||
      !/^[A-Za-z0-9_.:-]+$/u.test(body.routeId) ||
      !routeArtifactById(body.routeId)
    ) {
      return "routeId must be a pinned route artifact id.";
    }
  }

  if (body.recipient !== undefined && body.recipient !== null) {
    if (typeof body.recipient !== "string" || !isAddress(body.recipient)) {
      return "recipient must be an address when provided.";
    }
  }

  if (body.routerAddress !== undefined) {
    if (
      typeof body.routerAddress !== "string" ||
      !isAddress(body.routerAddress)
    ) {
      return "routerAddress overrides are not supported.";
    }
  }

  return {
    tokenIn: body.tokenIn as Address,
    tokenOut: body.tokenOut as Address,
    amountIn,
    recipient:
      typeof body.recipient === "string" && isAddress(body.recipient)
        ? (body.recipient as Address)
        : null,
    routerAddress:
      typeof body.routerAddress === "string" && isAddress(body.routerAddress)
        ? (body.routerAddress as Address)
        : undefined,
    slippageBps:
      typeof body.slippageBps === "number" && Number.isFinite(body.slippageBps)
        ? body.slippageBps
        : undefined,
    deadlineMinutes:
      typeof body.deadlineMinutes === "number" &&
      Number.isFinite(body.deadlineMinutes)
        ? body.deadlineMinutes
        : undefined,
    routeId: typeof body.routeId === "string" ? body.routeId : undefined,
    includeDebug: body.includeDebug === true,
  };
}

function displaySafeErrorMessage(error: unknown): string {
  return displaySafeDiagnosticMessage(error);
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function remainingQuoteTimeMs(startedAtMs: number): number {
  return Math.max(
    0,
    QUOTE_REQUEST_TIMEOUT_MS -
      (Date.now() - startedAtMs) -
      QUOTE_RESPONSE_CUSHION_MS,
  );
}

function optimizerBudgetsForQuoteRequest(
  startedAtMs: number,
): FameSwapQuoteRequest["optimizerBudgets"] {
  return {
    timeoutMs: Math.min(
      DEFAULT_FAME_OPTIMIZER_BUDGETS.timeoutMs,
      remainingQuoteTimeMs(startedAtMs),
    ),
  };
}
function localQuoteDebugAllowed(request: NextRequest): boolean {
  if (process.env.NODE_ENV === "production") return false;
  const hostname = request.nextUrl.hostname.toLowerCase();
  return (
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
  );
}

export async function handleFameSwapQuotePost(
  request: NextRequest,
  deps: FameSwapQuotePostDependencies = {},
): Promise<Response> {
  const requestStartedAtMs = Date.now();
  if (bodyTooLarge(request)) {
    return json({ error: "Quote request body is too large." }, { status: 413 });
  }
  if (rateLimited(request)) {
    return json({ error: "Too many FAME quote requests." }, { status: 429 });
  }

  let bodyJson: unknown;
  try {
    bodyJson = await request.json();
  } catch {
    return json({ error: "Expected a JSON quote request." }, { status: 400 });
  }

  const parsedBody = parseQuoteBody(bodyJson);
  if (typeof parsedBody === "string") {
    return json({ error: parsedBody }, { status: 400 });
  }

  const tokenIn = tokenForAddress(parsedBody.tokenIn);
  const tokenOut = tokenForAddress(parsedBody.tokenOut);
  if (!tokenIn || !tokenOut) {
    return json({ error: "Unsupported FAME swap token." }, { status: 400 });
  }

  const recipient = parsedBody.recipient;
  const configuredRouterAddress = getFameSwapConfig().routerAddress;
  if (
    parsedBody.routerAddress &&
    parsedBody.routerAddress.toLowerCase() !==
      configuredRouterAddress?.toLowerCase()
  ) {
    return json(
      { error: "routerAddress overrides are not supported." },
      { status: 400 },
    );
  }
  const routerAddress = configuredRouterAddress;
  const config = {
    ...getFameSwapConfig(),
    routerAddress,
    defaultSlippageBps: normalizeSlippageBps(
      parsedBody.slippageBps ?? getFameSwapConfig().defaultSlippageBps,
    ),
  };
  const quoteRequest: Omit<FameSwapQuoteRequest, "readiness"> = {
    tokenIn,
    tokenOut,
    amountIn: parsedBody.amountIn,
    recipient,
    config,
    deadlineSeconds:
      typeof parsedBody.deadlineMinutes === "number"
        ? deadlineMinutesToSeconds(parsedBody.deadlineMinutes)
        : undefined,
    requestedRouteId: parsedBody.routeId,
  };

  let quoteApiDebugOutput: ReturnType<
    ReturnType<
      typeof createProductionFameQuoteDependencies
    >["quoteApiDebugForResult"]
  >;
  const productionDependencies = createProductionFameQuoteDependencies({
    readinessForQuote: deps.readinessForQuote,
    quoteForRequest: deps.quoteForRequest,
    quoteAdapterForRequest: deps.quoteAdapterForRequest,
    quoteApiClient: deps.quoteApiClient,
    startedAtMs: requestStartedAtMs,
    requestTimeoutMs: QUOTE_REQUEST_TIMEOUT_MS,
    responseCushionMs: QUOTE_RESPONSE_CUSHION_MS,
  });
  const quote = await withTimeout(
    (async (): Promise<FameSwapQuote> => {
      return await quoteFameExactInput(
        {
          ...quoteRequest,
          optimizerBudgets: optimizerBudgetsForQuoteRequest(requestStartedAtMs),
        },
        productionDependencies,
      ).then((quote) => {
        // Debug remains an HTTP-only concern.  The public service never
        // returns helper diagnostics or server configuration.
        quoteApiDebugOutput =
          productionDependencies.quoteApiDebugForResult(quote);
        return quote;
      });
    })(),
    QUOTE_REQUEST_TIMEOUT_MS,
    `FAME quote request timed out after ${QUOTE_REQUEST_TIMEOUT_MS}ms`,
  ).catch((error): FameSwapQuote => {
    const message = displaySafeErrorMessage(error);
    return {
      status: "quote_adapter_failure",
      tokenIn,
      tokenOut,
      requestedAmountIn: parsedBody.amountIn,
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
  });

  const includeLocalDebug =
    parsedBody.includeDebug && localQuoteDebugAllowed(request);

  return json({
    ...serializeFameSwapQuoteResponse(quote, {
      includeDebug: includeLocalDebug,
      debug:
        includeLocalDebug && quoteApiDebugOutput
          ? {
              quoteApi: quoteApiDebugOutput,
            }
          : undefined,
    }),
    ...(parsedBody.includeDebug && !includeLocalDebug
      ? { debugUnavailable: { reason: "local_dev_only" } }
      : {}),
  });
}
