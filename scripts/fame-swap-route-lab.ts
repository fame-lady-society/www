import {
  createPublicClient,
  decodeFunctionResult,
  encodeFunctionData,
  http,
  isAddress,
  type Address,
} from "viem";
import { simulateCalls } from "viem/actions";
import { base } from "viem/chains";
import { fameRouterAbi } from "../src/features/fame-swap/router/abi";
import { hashFameRoute } from "../src/features/fame-swap/router/encodeRoute";
import { erc20ApprovalAbi } from "../src/features/fame-swap/router/erc20Abi";
import {
  quoteFameSwapAsync,
  quoteWithReadyReadiness,
} from "../src/features/fame-swap/solver/quote";
import {
  routeCandidatesForPair,
  type FameRouteCandidateBudgets,
} from "../src/features/fame-swap/solver/graph/candidates";
import type {
  FameRouteCandidateRejected,
  FameRouteCandidateSet,
} from "../src/features/fame-swap/solver/graph/routePlan";
import {
  buildFameRouteEdgeMatrix,
  buildFameRouteProtocolCoverage,
  type FameRouteEdgeMatrixRow,
  type FameRouteProtocolCoverageRow,
} from "../src/features/fame-swap/solver/graph/edgeMatrix";
import { fameSwapTransactionRequests } from "../src/features/fame-swap/transactions";
import { getFameSwapConfig } from "../src/features/fame-swap/config";
import {
  createLiveLiquidityQuoteAdapter,
  unavailableLiveAsyncQuoteAdapter,
} from "../src/features/fame-swap/solver/quotes/liveAdapters";
import { createDeterministicQuoteAdapter } from "../src/features/fame-swap/solver/quotes/deterministicAdapter";
import { createSnapshotQuoteAdapter } from "../src/features/fame-swap/solver/quotes/snapshotAdapter";
import {
  corpusTokenLabel,
  FAME_ROUTE_CORPUS,
  type FameRouteCorpusCase,
} from "../src/features/fame-swap/solver/routeCorpus";
import type {
  FameSwapExecutableQuote,
  FameSwapQuote,
} from "../src/features/fame-swap/solver/types";
import {
  applySlippageToAmount,
  DEFAULT_FAME_SWAP_SLIPPAGE_BPS,
} from "../src/features/fame-swap/solver/slippage";
import { tokenForAddress } from "../src/features/fame-swap/tokens";

const ROUTER_ADDRESS =
  "0x0000000000000000000000000000000000000009" as const satisfies Address;
const RECIPIENT =
  "0x0000000000000000000000000000000000000abc" as const satisfies Address;

export interface FameRouteLabRow {
  mode: "deterministic" | "recorded" | "live";
  id: string;
  pair: string;
  amountIn: string;
  expectedStatus: string;
  status: string;
  message: string;
  selectedPools: string[];
  quoteContext: string | null;
  feeBreakdown: {
    routerFeeAmount: string | null;
    routerFeePpm: string | null;
    venueFeesIncluded: boolean | null;
    maxLegMarketImpactBps: number | null;
    computablePriceImpactLegs: number | null;
  };
  rejectedCandidates: Array<{
    candidateId: string;
    reason: string;
    message: string;
  }>;
  candidateGenerationDiagnostics: Array<{
    reason: string;
    detail: string;
  }>;
  edgeMatrix: FameRouteEdgeMatrixRow[];
  protocolCoverage: FameRouteProtocolCoverageRow[];
  simulation: FameRouteLabSimulation;
  suggestedContractTodo: string | null;
}

export type FameRouteLabSimulation =
  | {
      status: "not_requested" | "skipped";
      message: string;
    }
  | {
      status: "passed";
      account: string;
      output: string;
      protectedMinimum: string;
    }
  | {
      status: "failed";
      account: string;
      message: string;
    };

interface RouteLabClient {
  simulateContract: (request: unknown) => Promise<{ result: unknown }>;
  request: (request: unknown) => Promise<unknown>;
}

interface RouteLabOptions {
  candidateBudgets?: Partial<FameRouteCandidateBudgets>;
}

export function runSnapshotRouteLab(
  corpus: readonly FameRouteCorpusCase[] = FAME_ROUTE_CORPUS,
  options: RouteLabOptions = {},
): FameRouteLabRow[] {
  const adapter = createSnapshotQuoteAdapter();
  return corpus.map((entry) => {
    const candidateSet = routeCandidatesForPair(
      entry.tokenIn,
      entry.tokenOut,
      undefined,
      {
        budgets: options.candidateBudgets,
      },
    );
    const quote = quoteWithReadyReadiness({
      tokenIn: token(entry.tokenIn),
      tokenOut: token(entry.tokenOut),
      amountIn: entry.amountIn,
      recipient: RECIPIENT,
      routerAddress: ROUTER_ADDRESS,
      now: new Date("2026-05-13T00:00:00Z"),
      adapter,
    });
    const edgeMatrix = routeEdgeMatrix(candidateSet, quote);
    const simulation: FameRouteLabSimulation = {
      status: "not_requested",
      message: "Recorded quote replay does not run live route simulation.",
    };

    return {
      mode: "recorded",
      id: entry.id,
      pair: pairLabel(entry),
      amountIn: entry.amountIn.toString(),
      expectedStatus: expectedStatusFor(entry, "recorded"),
      status: quote.status,
      message: displaySafeDiagnosticMessage(quote.message),
      selectedPools: quote.status === "ready" ? quote.poolIds : [],
      quoteContext: quoteContextLabel(quote),
      feeBreakdown:
        quote.status === "ready"
          ? {
              routerFeeAmount: quote.routerFeeAmount.toString(),
              routerFeePpm: quote.feeBreakdown.routerFeePpm.toString(),
              venueFeesIncluded: quote.feeBreakdown.venueFeesIncluded,
              maxLegMarketImpactBps:
                quote.feeBreakdown.marketImpact.maxLegMarketImpactBps,
              computablePriceImpactLegs:
                quote.feeBreakdown.marketImpact.computableLegs,
            }
          : {
              routerFeeAmount: null,
              routerFeePpm: null,
              venueFeesIncluded: null,
              maxLegMarketImpactBps: null,
              computablePriceImpactLegs: null,
            },
      rejectedCandidates:
        "rejectedCandidates" in quote
          ? quote.rejectedCandidates.map((candidate) => ({
              candidateId: candidate.candidateId,
              reason: candidate.reason,
              message: displaySafeDiagnosticMessage(candidate.message),
            }))
          : [],
      candidateGenerationDiagnostics: candidateGenerationDiagnostics(
        candidateSet.rejected,
      ),
      edgeMatrix,
      protocolCoverage: routeProtocolCoverage(edgeMatrix, quote, simulation),
      simulation,
      suggestedContractTodo: suggestedTodo(entry, quote),
    };
  });
}

function quoteContextLabel(quote: FameSwapQuote): string | null {
  if (quote.status !== "ready" || !quote.quoteContext) return null;
  switch (quote.quoteContext.source) {
    case "live":
    case "fork":
      return `${quote.quoteContext.source}:${quote.quoteContext.chainId}:${quote.quoteContext.blockNumber.toString()}`;
    case "snapshot":
      return `recorded:${quote.quoteContext.snapshotId}:${quote.quoteContext.pinnedBaseBlock}`;
    case "deterministic_test":
      return `deterministic-test:${quote.quoteContext.profileId}`;
  }
}

function routeEdgeMatrix(
  candidateSet: FameRouteCandidateSet,
  quote: FameSwapQuote,
): FameRouteEdgeMatrixRow[] {
  return buildFameRouteEdgeMatrix({
    candidateSet,
    selectedCandidateId:
      quote.status === "ready" ? quote.routeArtifactId : null,
    rejectedCandidates:
      "rejectedCandidates" in quote ? quote.rejectedCandidates : [],
  });
}

function routeProtocolCoverage(
  edgeMatrix: readonly FameRouteEdgeMatrixRow[],
  quote: FameSwapQuote,
  simulation: FameRouteLabSimulation,
): FameRouteProtocolCoverageRow[] {
  return buildFameRouteProtocolCoverage({
    edgeMatrix,
    selectedLegQuotes:
      quote.status === "ready" ? quote.feeBreakdown.legs : undefined,
    rejectedCandidates:
      "rejectedCandidates" in quote ? quote.rejectedCandidates : [],
    simulation,
  });
}

function candidateGenerationDiagnostics(
  rejected: readonly FameRouteCandidateRejected[],
) {
  return rejected.map((diagnostic) => ({
    reason: diagnostic.reason,
    detail: displaySafeDiagnosticMessage(diagnostic.detail),
  }));
}

function token(address: Address) {
  const result = tokenForAddress(address);
  if (!result) throw new Error(`Unsupported corpus token ${address}.`);
  return result;
}

function pairLabel(entry: FameRouteCorpusCase): string {
  return `${corpusTokenLabel(entry.tokenIn)}->${corpusTokenLabel(entry.tokenOut)}`;
}

function redactSensitiveDiagnosticText(value: string): string {
  return value
    .replace(/(?:https?|wss?):\/\/\S+/g, "[redacted-url]")
    .replace(/\b(?:bearer|token)\s+[a-z0-9._~+/=-]+/gi, "[redacted-secret]")
    .replace(/0x[a-fA-F0-9]{64,}/g, "[redacted-hex]");
}

function displaySafeAccountLabel(address: Address): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function displaySafeDiagnosticMessage(
  value: unknown,
  fallback = "Route diagnostic unavailable.",
): string {
  const raw = value instanceof Error ? value.message : String(value);
  return redactSensitiveDiagnosticText(
    raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(
        (line) =>
          line.length > 0 &&
          !/\b(request body|calldata|approval|swap request|private key|signer|authorization|api[-_ ]?key)\b|(?:^|\s)secret(?:[-_ ]?(?:key|token))?\s*[:=]/i.test(
            line,
          ),
      ) ?? fallback,
  );
}

function displaySafeErrorMessage(error: unknown): string {
  return displaySafeDiagnosticMessage(error, "Route simulation failed.");
}

function simulationAccount(): Address | null {
  const raw =
    process.env.FAME_SWAP_SIMULATION_ACCOUNT ??
    process.env.NEXT_PUBLIC_FAME_SWAP_SIMULATION_ACCOUNT;
  return raw && isAddress(raw) ? raw : null;
}

async function simulateQuote(
  quote: FameSwapQuote,
  client: RouteLabClient | null,
  account: Address | null,
): Promise<FameRouteLabSimulation> {
  if (quote.status !== "ready") {
    return {
      status: "skipped",
      message: `Quote status ${quote.status} is not executable.`,
    };
  }
  if (!client) {
    return {
      status: "not_requested",
      message: "Live route simulation was not requested.",
    };
  }
  if (!account) {
    return {
      status: "not_requested",
      message:
        "Live route simulation requires FAME_SWAP_SIMULATION_ACCOUNT or NEXT_PUBLIC_FAME_SWAP_SIMULATION_ACCOUNT.",
    };
  }

  try {
    const readyQuote = quote as FameSwapExecutableQuote;
    const simulationClient = client;
    const simulationAccountAddress = account;

    async function simulateRoute(
      route: FameSwapExecutableQuote["route"],
      materializedRouteHash: FameSwapExecutableQuote["materializedRouteHash"],
    ): Promise<bigint> {
      const requests = fameSwapTransactionRequests(readyQuote, {
        route,
        materializedRouteHash,
      });
      if (!requests.swap) {
        throw new Error("Ready quote did not produce a swap request.");
      }

      if (requests.approval) {
        const result = await simulateCalls(
          simulationClient as unknown as Parameters<typeof simulateCalls>[0],
          {
            account: simulationAccountAddress,
            calls: [
              {
                to: requests.approval.contract.address,
                data: encodeFunctionData({
                  abi: erc20ApprovalAbi,
                  functionName: "approve",
                  args: requests.approval.contract.args,
                }),
              },
              {
                to: requests.swap.contract.address,
                data: encodeFunctionData({
                  abi: fameRouterAbi,
                  functionName: "executeRoute",
                  args: requests.swap.contract.args,
                }),
                value: requests.swap.contract.value,
              },
            ],
          },
        );
        const swapResult = result.results[1];
        if (!swapResult || swapResult.status !== "success") {
          throw new Error("Bundled approve-then-swap simulation failed.");
        }
        const decoded = decodeFunctionResult({
          abi: fameRouterAbi,
          functionName: "executeRoute",
          data: swapResult.data,
        });
        if (typeof decoded !== "bigint") {
          throw new Error("Route simulation returned no output amount.");
        }
        return decoded;
      }

      const result = await simulationClient.simulateContract({
        account: simulationAccountAddress,
        address: requests.swap.contract.address,
        abi: fameRouterAbi,
        functionName: "executeRoute",
        args: requests.swap.contract.args,
        value: requests.swap.contract.value,
      });
      if (typeof result.result !== "bigint") {
        throw new Error("Route simulation returned no output amount.");
      }
      return result.result;
    }

    const probeOutput = await simulateRoute(
      readyQuote.route,
      readyQuote.materializedRouteHash,
    );
    const protectedMinimum = applySlippageToAmount(
      probeOutput,
      readyQuote.slippageBps,
    );
    const protectedRoute = {
      ...readyQuote.route,
      minAmountOutAfterFee: protectedMinimum,
    };
    const protectedOutput = await simulateRoute(
      protectedRoute,
      hashFameRoute(protectedRoute),
    );

    return {
      status: "passed",
      account: displaySafeAccountLabel(simulationAccountAddress),
      output: protectedOutput.toString(),
      protectedMinimum: protectedMinimum.toString(),
    };
  } catch (error) {
    return {
      status: "failed",
      account: account ? displaySafeAccountLabel(account) : "unavailable",
      message: displaySafeErrorMessage(error),
    };
  }
}

function expectedStatusFor(
  entry: FameRouteCorpusCase,
  mode: FameRouteLabRow["mode"],
): string {
  if (mode === "deterministic") {
    return entry.expectedDeterministicStatus ?? entry.expectedStatus;
  }
  if (mode === "recorded") {
    return entry.expectedSnapshotStatus ?? entry.expectedStatus;
  }
  return entry.expectedLiveStatus ?? entry.expectedStatus;
}

function suggestedTodo(
  entry: FameRouteCorpusCase,
  quote: FameSwapQuote,
): string | null {
  if (quote.status === "ready") {
    return [
      `# Prove ${pairLabel(entry)} Route For ${entry.amountIn.toString()}`,
      "",
      "## Evidence",
      `- www route-lab case: ${entry.id}`,
      `- Pair: ${pairLabel(entry)}`,
      `- Amount in: ${entry.amountIn.toString()}`,
      `- Selected pools: ${quote.poolIds.join(", ")}`,
      `- Quote context: ${quoteContextLabel(quote) ?? "unavailable"}`,
      `- Router fee amount: ${quote.routerFeeAmount.toString()}`,
      "",
      "## Acceptance Criteria",
      "- [ ] Add or update contract-repo fork evidence for this exact amount and pool set.",
      "- [ ] Capture selected-pool capacity or route artifact metadata if the route should become launch evidence.",
    ].join("\n");
  }

  if ("rejectedCandidates" in quote && quote.rejectedCandidates.length > 0) {
    return [
      `# Add ${pairLabel(entry)} Failure Regression For ${entry.amountIn.toString()}`,
      "",
      "## Evidence",
      `- www route-lab case: ${entry.id}`,
      `- Pair: ${pairLabel(entry)}`,
      `- Amount in: ${entry.amountIn.toString()}`,
      `- Solver status: ${quote.status}`,
      `- First rejection: ${quote.rejectedCandidates[0]?.reason} - ${displaySafeDiagnosticMessage(quote.rejectedCandidates[0]?.message)}`,
      "",
      "## Acceptance Criteria",
      "- [ ] Add a contract-repo amount sweep or regression fixture for this exact failing amount.",
      "- [ ] Confirm whether the failure is expected capacity behavior or a missing route artifact opportunity.",
    ].join("\n");
  }

  return null;
}

export function runRouteLab(
  corpus: readonly FameRouteCorpusCase[] = FAME_ROUTE_CORPUS,
  options: RouteLabOptions = {},
): FameRouteLabRow[] {
  const adapter = createDeterministicQuoteAdapter();
  return corpus.map((entry) => {
    const candidateSet = routeCandidatesForPair(
      entry.tokenIn,
      entry.tokenOut,
      undefined,
      {
        budgets: options.candidateBudgets,
      },
    );
    const quote = quoteWithReadyReadiness({
      tokenIn: token(entry.tokenIn),
      tokenOut: token(entry.tokenOut),
      amountIn: entry.amountIn,
      recipient: RECIPIENT,
      routerAddress: ROUTER_ADDRESS,
      now: new Date("2026-05-13T00:00:00Z"),
      adapter,
    });
    const edgeMatrix = routeEdgeMatrix(candidateSet, quote);
    const simulation: FameRouteLabSimulation = {
      status: "not_requested",
      message: "Deterministic route lab does not run live route simulation.",
    };

    return {
      mode: "deterministic",
      id: entry.id,
      pair: pairLabel(entry),
      amountIn: entry.amountIn.toString(),
      expectedStatus: expectedStatusFor(entry, "deterministic"),
      status: quote.status,
      message: displaySafeDiagnosticMessage(quote.message),
      selectedPools: quote.status === "ready" ? quote.poolIds : [],
      quoteContext: quoteContextLabel(quote),
      feeBreakdown:
        quote.status === "ready"
          ? {
              routerFeeAmount: quote.routerFeeAmount.toString(),
              routerFeePpm: quote.feeBreakdown.routerFeePpm.toString(),
              venueFeesIncluded: quote.feeBreakdown.venueFeesIncluded,
              maxLegMarketImpactBps:
                quote.feeBreakdown.marketImpact.maxLegMarketImpactBps,
              computablePriceImpactLegs:
                quote.feeBreakdown.marketImpact.computableLegs,
            }
          : {
              routerFeeAmount: null,
              routerFeePpm: null,
              venueFeesIncluded: null,
              maxLegMarketImpactBps: null,
              computablePriceImpactLegs: null,
            },
      rejectedCandidates:
        "rejectedCandidates" in quote
          ? quote.rejectedCandidates.map((candidate) => ({
              candidateId: candidate.candidateId,
              reason: candidate.reason,
              message: displaySafeDiagnosticMessage(candidate.message),
            }))
          : [],
      candidateGenerationDiagnostics: candidateGenerationDiagnostics(
        candidateSet.rejected,
      ),
      edgeMatrix,
      protocolCoverage: routeProtocolCoverage(edgeMatrix, quote, simulation),
      simulation,
      suggestedContractTodo: suggestedTodo(entry, quote),
    };
  });
}

export async function runLiveRouteLab(
  corpus: readonly FameRouteCorpusCase[] = FAME_ROUTE_CORPUS,
  options: RouteLabOptions & { simulate?: boolean } = {},
): Promise<FameRouteLabRow[]> {
  const config = getFameSwapConfig();
  const rpcUrl =
    process.env.BASE_RPC_URL ?? process.env.NEXT_PUBLIC_BASE_RPC_URL_1;
  const client = rpcUrl
    ? createPublicClient({
        chain: base,
        transport: http(rpcUrl),
      })
    : null;
  const adapter = client
    ? await createLiveLiquidityQuoteAdapter({
        client: {
          getBlockNumber: () => client.getBlockNumber(),
          readContract: (request) =>
            client.readContract(
              request as Parameters<typeof client.readContract>[0],
            ) as Promise<unknown>,
        },
        chainId: base.id,
      })
    : unavailableLiveAsyncQuoteAdapter(
        "Base RPC is not configured for live route-lab quotes.",
      );

  const routerAddress = config.routerAddress ?? ROUTER_ADDRESS;
  const account = options.simulate ? simulationAccount() : null;
  const rows: FameRouteLabRow[] = [];

  for (const entry of corpus) {
    const candidateSet = routeCandidatesForPair(
      entry.tokenIn,
      entry.tokenOut,
      undefined,
      {
        budgets: options.candidateBudgets,
      },
    );
    const quote = await quoteFameSwapAsync({
      tokenIn: token(entry.tokenIn),
      tokenOut: token(entry.tokenOut),
      amountIn: entry.amountIn,
      recipient: RECIPIENT,
      config: {
        ...config,
        routerAddress,
        defaultSlippageBps:
          config.defaultSlippageBps ?? DEFAULT_FAME_SWAP_SLIPPAGE_BPS,
      },
      readiness: {
        status: "ready",
        routerAddress,
        feePpm: 2_222n,
      },
      now: new Date("2026-05-13T00:00:00Z"),
      adapter,
    });
    const edgeMatrix = routeEdgeMatrix(candidateSet, quote);
    const simulation = await simulateQuote(
      quote,
      options.simulate ? (client as unknown as RouteLabClient | null) : null,
      account,
    );

    rows.push({
      mode: "live",
      id: entry.id,
      pair: pairLabel(entry),
      amountIn: entry.amountIn.toString(),
      expectedStatus: expectedStatusFor(entry, "live"),
      status: quote.status,
      message: displaySafeDiagnosticMessage(quote.message),
      selectedPools: quote.status === "ready" ? quote.poolIds : [],
      quoteContext: quoteContextLabel(quote),
      feeBreakdown:
        quote.status === "ready"
          ? {
              routerFeeAmount: quote.routerFeeAmount.toString(),
              routerFeePpm: quote.feeBreakdown.routerFeePpm.toString(),
              venueFeesIncluded: quote.feeBreakdown.venueFeesIncluded,
              maxLegMarketImpactBps:
                quote.feeBreakdown.marketImpact.maxLegMarketImpactBps,
              computablePriceImpactLegs:
                quote.feeBreakdown.marketImpact.computableLegs,
            }
          : {
              routerFeeAmount: null,
              routerFeePpm: null,
              venueFeesIncluded: null,
              maxLegMarketImpactBps: null,
              computablePriceImpactLegs: null,
            },
      rejectedCandidates:
        "rejectedCandidates" in quote
          ? quote.rejectedCandidates.map((candidate) => ({
              candidateId: candidate.candidateId,
              reason: candidate.reason,
              message: displaySafeDiagnosticMessage(candidate.message),
            }))
          : [],
      candidateGenerationDiagnostics: candidateGenerationDiagnostics(
        candidateSet.rejected,
      ),
      edgeMatrix,
      protocolCoverage: routeProtocolCoverage(edgeMatrix, quote, simulation),
      simulation,
      suggestedContractTodo: suggestedTodo(entry, quote),
    });
  }

  return rows;
}

export function formatRouteLabMarkdown(
  rows: readonly FameRouteLabRow[],
): string {
  return [
    "# FAME Swap Route Lab",
    "",
    ...rows.flatMap((row) => [
      `## ${row.id}`,
      "",
      `- Mode: ${row.mode}`,
      `- Pair: ${row.pair}`,
      `- Amount in: ${row.amountIn}`,
      `- Status: ${row.status}`,
      `- Expected: ${row.expectedStatus}`,
      `- Selected pools: ${row.selectedPools.join(", ") || "none"}`,
      `- Quote context: ${row.quoteContext ?? "n/a"}`,
      `- Router fee amount: ${row.feeBreakdown.routerFeeAmount ?? "n/a"}`,
      `- Venue fees included in quotes: ${String(
        row.feeBreakdown.venueFeesIncluded ?? "n/a",
      )}`,
      `- Computable price-impact legs: ${
        row.feeBreakdown.computablePriceImpactLegs ?? "n/a"
      }`,
      `- Max leg market impact bps: ${
        row.feeBreakdown.maxLegMarketImpactBps ?? "n/a"
      }`,
      `- Rejections: ${row.rejectedCandidates.length}`,
      `- Candidate generation diagnostics: ${row.candidateGenerationDiagnostics.length}`,
      `- Edge matrix: ${edgeMatrixSummary(row.edgeMatrix)}`,
      `- Protocol coverage: ${protocolCoverageSummary(row.protocolCoverage)}`,
      `- Simulation: ${
        row.simulation.status === "passed"
          ? `passed, output ${row.simulation.output}, protected minimum ${row.simulation.protectedMinimum}`
          : row.simulation.status === "failed"
            ? `failed, ${displaySafeDiagnosticMessage(row.simulation.message)}`
            : displaySafeDiagnosticMessage(row.simulation.message)
      }`,
      "",
      ...formatCandidateGenerationDiagnosticsMarkdown(
        row.candidateGenerationDiagnostics,
      ),
      ...formatEdgeMatrixMarkdown(row.edgeMatrix),
      ...formatProtocolCoverageMarkdown(row.protocolCoverage),
      row.suggestedContractTodo
        ? [
            "### Suggested Contract Todo",
            "",
            redactSensitiveDiagnosticText(row.suggestedContractTodo),
            "",
          ].join("\n")
        : "",
    ]),
  ].join("\n");
}

function formatCandidateGenerationDiagnosticsMarkdown(
  diagnostics: FameRouteLabRow["candidateGenerationDiagnostics"],
): string[] {
  if (diagnostics.length === 0) return [];

  return [
    "### Candidate Generation Diagnostics",
    "",
    ...diagnostics.map(
      (diagnostic) =>
        `- ${diagnostic.reason}: ${displaySafeDiagnosticMessage(diagnostic.detail)}`,
    ),
    "",
  ];
}

function edgeMatrixSummary(rows: readonly FameRouteEdgeMatrixRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
  }

  return ["selected", "considered", "rejected", "disabled", "missing"]
    .map((status) => `${status} ${counts.get(status) ?? 0}`)
    .join(", ");
}

function protocolCoverageSummary(
  rows: readonly FameRouteProtocolCoverageRow[],
): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.edgeStatus, (counts.get(row.edgeStatus) ?? 0) + 1);
  }

  return ["selected", "considered", "rejected", "disabled", "missing"]
    .map((status) => `${status} ${counts.get(status) ?? 0}`)
    .join(", ");
}

function fieldLabel(field: FameRouteProtocolCoverageRow["quote"]): string {
  if (field.status === "available") {
    return field.value
      ? `available ${displaySafeDiagnosticMessage(field.value)}`
      : "available";
  }

  return field.reason
    ? `${field.status} (${displaySafeDiagnosticMessage(field.reason)})`
    : field.status;
}

function markdownCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function formatEdgeMatrixMarkdown(
  rows: readonly FameRouteEdgeMatrixRow[],
): string[] {
  if (rows.length === 0) return [];

  return [
    "### Edge Matrix",
    "",
    "| Status | Edge | Venue | Pool | Reason |",
    "| --- | --- | --- | --- | --- |",
    ...rows.map((row) => {
      const line = [
        row.status,
        `${row.tokenInSymbol}->${row.tokenOutSymbol}`,
        row.venue,
        row.poolId ?? "missing",
        displaySafeDiagnosticMessage(row.reason),
      ]
        .map(markdownCell)
        .join(" | ");
      return `| ${line} |`;
    }),
    "",
  ];
}

function formatProtocolCoverageMarkdown(
  rows: readonly FameRouteProtocolCoverageRow[],
): string[] {
  if (rows.length === 0) return [];

  return [
    "### Protocol Coverage",
    "",
    "| Edge | Status | Quote | Pre | Post | Impact | Active Liquidity | Simulation |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    ...rows.map((row) => {
      const line = [
        `${row.tokenInSymbol}->${row.tokenOutSymbol} ${row.poolId ?? "missing"}`,
        `${row.edgeStatus}/${row.attribution}`,
        fieldLabel(row.quote),
        fieldLabel(row.prePrice),
        fieldLabel(row.postPrice),
        fieldLabel(row.marketImpact),
        fieldLabel(row.activeLiquidity),
        fieldLabel(row.routeSimulation),
      ]
        .map(markdownCell)
        .join(" | ");
      return `| ${line} |`;
    }),
    "",
  ];
}

function shouldRunCli(): boolean {
  return process.argv[1]?.endsWith("fame-swap-route-lab.ts") ?? false;
}

if (shouldRunCli()) {
  const run = async () => {
    const rows = process.argv.includes("--live")
      ? await runLiveRouteLab(undefined, {
          simulate: process.argv.includes("--simulate"),
        })
      : process.argv.includes("--deterministic")
        ? runRouteLab()
        : runSnapshotRouteLab();
    if (process.argv.includes("--markdown")) {
      console.log(formatRouteLabMarkdown(rows));
    } else {
      console.log(JSON.stringify(rows, null, 2));
    }
  };
  run().catch((error) => {
    console.error(
      `FAME route lab failed: ${displaySafeDiagnosticMessage(error, "Unknown route-lab error.")}`,
    );
    process.exit(1);
  });
}
