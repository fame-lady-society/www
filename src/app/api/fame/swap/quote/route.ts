import { NextRequest } from "next/server";
import {
  createPublicClient,
  http,
  isAddress,
  type Address,
  type Hex,
} from "viem";
import { base } from "viem/chains";
import { FAME_SWAP_ARTIFACT_MANIFEST } from "@/features/fame-swap/artifacts/manifest";
import { getFameSwapConfig } from "@/features/fame-swap/config";
import { fameRouterAbi } from "@/features/fame-swap/router/abi";
import { fameSwapTransactionRequests } from "@/features/fame-swap/transactions";
import {
  quoteFameSwap,
  quoteFameSwapAsync,
} from "@/features/fame-swap/solver/quote";
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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface QuoteBody {
  tokenIn?: string;
  tokenOut?: string;
  amountIn?: string;
  recipient?: string;
  routerAddress?: string;
  slippageBps?: number;
  deadlineMinutes?: number;
}

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


async function readinessForQuote(routerAddress: Address | null) {
  const config = {
    ...getFameSwapConfig(),
    routerAddress,
  };
  const staticResult = staticReadiness(config);
  const rpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL_1!;

  if (staticResult.status === "not_live_ready" || !rpcUrl) {
    return staticResult;
  }

  const client = createPublicClient({
    chain: base,
    transport: http(rpcUrl),
  });
  const reader: RouterPolicyReader = {
    read: async (address): Promise<RouterPolicySnapshot> => {
      const feePpm = await client.readContract({
        address,
        abi: fameRouterAbi,
        functionName: "feePpm",
      });

      const familyResults = await Promise.all(
        FAME_SWAP_ARTIFACT_MANIFEST.requiredVenueTargets.map(async (target) => {
          const enabled = await client.readContract({
            address,
            abi: fameRouterAbi,
            functionName: "venueFamilyEnabled",
            args: [target.familyOrdinal],
          });
          return [target.familyOrdinal, enabled] as const;
        }),
      );

      const targetResults = await Promise.all(
        FAME_SWAP_ARTIFACT_MANIFEST.requiredVenueTargets.map(async (target) => {
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
        }),
      );

      const hookDataResults = await Promise.all(
        FAME_SWAP_ARTIFACT_MANIFEST.requiredV4HookDataKeys.map(async (key) => {
          const enabled = await client.readContract({
            address,
            abi: fameRouterAbi,
            functionName: "v4HookDataHashEnabled",
            args: [key],
          });
          return [key.toLowerCase(), enabled] as const;
        }),
      );

      return {
        feePpm: typeof feePpm === "bigint" ? feePpm : BigInt(feePpm),
        venueFamilies: new Map(familyResults),
        venueTargets: new Map(targetResults),
        v4HookDataKeys: new Map(hookDataResults),
      };
    },
  };

  return liveReadiness(config, reader);
}

function publicClientForQuote() {
  const rpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL_1;
  if (!rpcUrl) return null;

  return createPublicClient({
    chain: base,
    transport: http(rpcUrl),
  });
}

export async function POST(request: NextRequest): Promise<Response> {
  let body: QuoteBody;
  try {
    body = (await request.json()) as QuoteBody;
  } catch {
    return json({ error: "Expected a JSON quote request." }, { status: 400 });
  }

  if (!body.tokenIn || !isAddress(body.tokenIn)) {
    return json({ error: "tokenIn must be an address." }, { status: 400 });
  }
  if (!body.tokenOut || !isAddress(body.tokenOut)) {
    return json({ error: "tokenOut must be an address." }, { status: 400 });
  }
  if (
    !body.amountIn ||
    !/^[0-9]+$/.test(body.amountIn) ||
    body.amountIn.length > 78
  ) {
    return json(
      { error: "amountIn must be a raw integer string." },
      { status: 400 },
    );
  }

  const tokenIn = tokenForAddress(body.tokenIn as Address);
  const tokenOut = tokenForAddress(body.tokenOut as Address);
  if (!tokenIn || !tokenOut) {
    return json({ error: "Unsupported FAME swap token." }, { status: 400 });
  }

  const recipient =
    body.recipient && isAddress(body.recipient)
      ? (body.recipient as Address)
      : null;
  const configuredRouterAddress = getFameSwapConfig().routerAddress;
  if (
    body.routerAddress &&
    (!isAddress(body.routerAddress) ||
      body.routerAddress.toLowerCase() !== configuredRouterAddress?.toLowerCase())
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
      body.slippageBps ?? getFameSwapConfig().defaultSlippageBps,
    ),
  };
  const readiness = await readinessForQuote(routerAddress);
  const quoteRequest = {
    tokenIn,
    tokenOut,
    amountIn: BigInt(body.amountIn),
    recipient,
    config,
    readiness,
    deadlineSeconds:
      typeof body.deadlineMinutes === "number"
        ? deadlineMinutesToSeconds(body.deadlineMinutes)
        : undefined,
  };

  const quoteClient = readiness.status === "ready" ? publicClientForQuote() : null;
  const quote =
    readiness.status === "ready"
      ? await quoteFameSwapAsync({
          ...quoteRequest,
          adapter: quoteClient
            ? await createLiveLiquidityQuoteAdapter({
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
              })
            : unavailableLiveAsyncQuoteAdapter(
                "Base RPC is not configured for live liquidity quotes.",
              ),
        })
      : quoteFameSwap(quoteRequest);
  const requests = fameSwapTransactionRequests(quote);

  if (quote.status !== "ready") {
    return json({
      status: quote.status,
      message: quote.message,
      diagnosticsVisibleByDefault: quote.diagnosticsVisibleByDefault,
      readiness: "readiness" in quote ? quote.readiness : undefined,
      rejectedCandidates:
        "rejectedCandidates" in quote ? quote.rejectedCandidates : undefined,
    });
  }

  return json({
    status: quote.status,
    message: quote.message,
    routeArtifactId: quote.routeArtifactId,
    routeSource: quote.routeSource,
    routerAddress: quote.routerAddress,
    requestedAmountIn: quote.requestedAmountIn,
    grossEstimatedOutput: quote.grossEstimatedOutput,
    estimatedOutput: quote.estimatedOutput,
    routerFeeAmount: quote.routerFeeAmount,
    minAmountOutAfterFee: quote.minAmountOutAfterFee,
    feeBreakdown: quote.feeBreakdown,
    quoteContext: quote.quoteContext,
    feePpm: quote.feePpm,
    capabilities: quote.capabilities,
    callValue: quote.callValue,
    slippageBps: quote.slippageBps,
    expiresAt: quote.expiresAt.toISOString(),
    routeHash: quote.materializedRouteHash as Hex,
    poolIds: quote.poolIds,
    warnings: quote.warnings,
    rejectedCandidates: quote.rejectedCandidates,
    approval: requests.approval,
    swap: requests.swap,
    route: quote.route,
    routeDisplay: quote.routeDisplay,
  });
}
