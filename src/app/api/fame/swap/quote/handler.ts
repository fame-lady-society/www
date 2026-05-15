import { NextRequest } from "next/server";
import { createPublicClient, http, isAddress, type Address } from "viem";
import { base } from "viem/chains";
import { FAME_SWAP_ARTIFACT_MANIFEST } from "@/features/fame-swap/artifacts/manifest";
import { getFameSwapConfig } from "@/features/fame-swap/config";
import { fameRouterAbi } from "@/features/fame-swap/router/abi";
import {
  quoteFameSwap,
  quoteFameSwapAsync,
} from "@/features/fame-swap/solver/quote";
import { DEFAULT_FAME_OPTIMIZER_BUDGETS } from "@/features/fame-swap/solver/optimizer/runContext";
import { serializeFameSwapQuoteResponse } from "@/features/fame-swap/solver/quoteWire";
import {
  createLiveLiquidityQuoteAdapter,
  unavailableLiveAsyncQuoteAdapter,
} from "@/features/fame-swap/solver/quotes/liveAdapters";
import {
  liveReadiness,
  routerPolicyTargetKey,
  staticReadiness,
  type RouterPolicyReader,
  type RouterPolicySnapshot,
} from "@/features/fame-swap/solver/readiness";
import { normalizeSlippageBps } from "@/features/fame-swap/solver/slippage";
import { deadlineMinutesToSeconds } from "@/features/fame-swap/solver/deadline";
import { tokenForAddress } from "@/features/fame-swap/tokens";
import type {
  FameSwapQuote,
  FameSwapQuoteRequest,
  FameSwapReadiness,
} from "@/features/fame-swap/solver/types";

const MAX_JSON_BODY_BYTES = 4_096;
const MAX_UINT256 = (1n << 256n) - 1n;
const QUOTE_RPC_TIMEOUT_MS = 8_000;
const QUOTE_REQUEST_TIMEOUT_MS = 15_000;
const QUOTE_RESPONSE_CUSHION_MS = 1_500;
const READINESS_CACHE_TTL_MS = 5_000;
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
}

interface FameSwapQuotePostDependencies {
  readinessForQuote?: (
    routerAddress: Address | null,
  ) => FameSwapReadiness | Promise<FameSwapReadiness>;
  quoteForRequest?: (
    request: FameSwapQuoteRequest & { readiness: FameSwapReadiness },
  ) => FameSwapQuote | Promise<FameSwapQuote>;
}

const readinessCache = new Map<
  string,
  { expiresAt: number; value: Promise<FameSwapReadiness> | FameSwapReadiness }
>();
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
  };
}

function displaySafeErrorMessage(error: unknown): string {
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

function baseRpcUrl(): string | undefined {
  return process.env.BASE_RPC_URL ?? process.env.NEXT_PUBLIC_BASE_RPC_URL_1;
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
    QUOTE_REQUEST_TIMEOUT_MS - (Date.now() - startedAtMs) -
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

function readTimeoutForQuoteRequest(startedAtMs: number): number {
  return Math.max(
    250,
    Math.min(QUOTE_RPC_TIMEOUT_MS, remainingQuoteTimeMs(startedAtMs)),
  );
}

async function readinessForQuote(routerAddress: Address | null) {
  const config = {
    ...getFameSwapConfig(),
    routerAddress,
  };
  const staticResult = staticReadiness(config);
  const rpcUrl = baseRpcUrl();

  if (staticResult.status === "not_live_ready" || !rpcUrl) {
    return staticResult;
  }

  const cacheKey = `${routerAddress}:${config.expectedPinnedBaseBlock}:${config.expectedSolverRoutesHash}:${config.expectedPoolsHash}`;
  const cached = readinessCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const client = createPublicClient({
    chain: base,
    transport: http(rpcUrl, {
      batch: true,
      retryCount: 0,
      timeout: QUOTE_RPC_TIMEOUT_MS,
    }),
    batch: {
      multicall: true,
    },
  });
  const reader: RouterPolicyReader = {
    read: async (address): Promise<RouterPolicySnapshot> => {
      const feePpmPromise = client.readContract({
        address,
        abi: fameRouterAbi,
        functionName: "feePpm",
      });
      const requiredFamilyOrdinals = [
        ...new Set(
          FAME_SWAP_ARTIFACT_MANIFEST.requiredVenueTargets.map(
            (target) => target.familyOrdinal,
          ),
        ),
      ];

      const familyResultPromises = requiredFamilyOrdinals.map(
        async (familyOrdinal) => {
          const enabled = await client.readContract({
            address,
            abi: fameRouterAbi,
            functionName: "venueFamilyEnabled",
            args: [familyOrdinal],
          });
          return [familyOrdinal, enabled] as const;
        },
      );

      const targetResultPromises =
        FAME_SWAP_ARTIFACT_MANIFEST.requiredVenueTargets.map(
          async (target) => {
            const enabled = await client.readContract({
              address,
              abi: fameRouterAbi,
              functionName: "venueTargetEnabled",
              args: [target.familyOrdinal, target.target],
            });
            return [
              routerPolicyTargetKey(target.familyOrdinal, target.target),
              enabled,
            ] as const;
          },
        );

      const hookDataResultPromises =
        FAME_SWAP_ARTIFACT_MANIFEST.requiredV4HookDataKeys.map(async (key) => {
          const enabled = await client.readContract({
            address,
            abi: fameRouterAbi,
            functionName: "v4HookDataHashEnabled",
            args: [key],
          });
          return [key.toLowerCase(), enabled] as const;
        });

      const [feePpm, familyResults, targetResults, hookDataResults] =
        await Promise.all([
          feePpmPromise,
          Promise.all(familyResultPromises),
          Promise.all(targetResultPromises),
          Promise.all(hookDataResultPromises),
        ]);

      const venueFamilies = new Map<number, boolean>();
      for (const [familyOrdinal, enabled] of familyResults) {
        if (!venueFamilies.has(familyOrdinal)) {
          venueFamilies.set(familyOrdinal, Boolean(enabled));
        }
      }

      const venueTargets = new Map<string, boolean>(
        targetResults.map(([key, enabled]) => [key, Boolean(enabled)]),
      );
      const v4HookDataKeys = new Map<string, boolean>(
        hookDataResults.map(([key, enabled]) => [key, Boolean(enabled)]),
      );

      return {
        feePpm: typeof feePpm === "bigint" ? feePpm : BigInt(feePpm),
        venueFamilies,
        venueTargets,
        v4HookDataKeys,
      };
    },
  };

  const value = liveReadiness(config, reader);
  readinessCache.set(cacheKey, {
    expiresAt: Date.now() + READINESS_CACHE_TTL_MS,
    value,
  });
  const readiness = await value;
  readinessCache.set(cacheKey, {
    expiresAt: Date.now() + READINESS_CACHE_TTL_MS,
    value: readiness,
  });
  return readiness;
}

function publicClientForQuote() {
  const rpcUrl = baseRpcUrl();
  if (!rpcUrl) return null;

  return createPublicClient({
    chain: base,
    transport: http(rpcUrl, {
      batch: true,
      retryCount: 0,
      timeout: QUOTE_RPC_TIMEOUT_MS,
    }),
    batch: {
      multicall: true,
    },
  });
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
  };

  const quote = await withTimeout(
    (async (): Promise<FameSwapQuote> => {
      const resolveReadiness = deps.readinessForQuote ?? readinessForQuote;
      const readinessPromise = Promise.resolve(resolveReadiness(routerAddress));
      const quoteClient = deps.quoteForRequest ? null : publicClientForQuote();
      const adapterPromise = quoteClient
        ? createLiveLiquidityQuoteAdapter({
            client: {
              getBlockNumber: () => quoteClient.getBlockNumber(),
              readContract: (quoteRequest) =>
                quoteClient.readContract(
                  quoteRequest as Parameters<
                    typeof quoteClient.readContract
                  >[0],
                ) as Promise<unknown>,
            },
            chainId: base.id,
            readTimeoutMs: readTimeoutForQuoteRequest(requestStartedAtMs),
          }).catch((error) =>
            unavailableLiveAsyncQuoteAdapter(
              `Live quote adapter setup failed: ${displaySafeErrorMessage(
                error,
              )}`,
            ),
          )
        : Promise.resolve(
            unavailableLiveAsyncQuoteAdapter(
              "Base RPC is not configured for live liquidity quotes.",
            ),
          );
      const readiness = await readinessPromise;
      if (deps.quoteForRequest) {
        return await deps.quoteForRequest({
          ...quoteRequest,
          optimizerBudgets: optimizerBudgetsForQuoteRequest(
            requestStartedAtMs,
          ),
          readiness,
        });
      }

      return readiness.status === "ready"
        ? quoteFameSwapAsync({
            ...quoteRequest,
            optimizerBudgets: optimizerBudgetsForQuoteRequest(
              requestStartedAtMs,
            ),
            readiness,
            adapter: await adapterPromise,
          })
        : quoteFameSwap({
            ...quoteRequest,
            optimizerBudgets: optimizerBudgetsForQuoteRequest(
              requestStartedAtMs,
            ),
            readiness,
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

  return json(serializeFameSwapQuoteResponse(quote));
}
