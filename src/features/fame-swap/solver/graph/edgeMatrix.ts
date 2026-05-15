import type { Address } from "viem";
import { base } from "viem/chains";
import { USDC, WETH, tokenForAddress } from "../../tokens";
import type { VenueFamilyName } from "../../router/types";
import { famePoolEdges, type FamePoolEdge } from "../poolUniverse";
import type {
  FameCandidateRejection,
  FameLegQuote,
  FameProtocolEvidence,
  FameProtocolEvidenceItem,
} from "../quotes/adapters";
import type { FameRouteCandidate, FameRouteCandidateSet } from "./routePlan";

export type FameRouteEdgeMatrixStatus =
  | "selected"
  | "considered"
  | "rejected"
  | "disabled"
  | "missing";

export type FameRouteEdgeMatrixReasonCategory =
  | "selected_edge"
  | "considered_edge"
  | "quote_adapter_failure"
  | "unsafe_output"
  | "disabled_edge"
  | "missing_edge";

export interface FameRouteEdgeMatrixRow {
  chainId: number;
  tokenIn: Address;
  tokenOut: Address;
  tokenInSymbol: string;
  tokenOutSymbol: string;
  venue: VenueFamilyName | "Any";
  protocolVariant: string;
  poolId: string | null;
  target: Address | null;
  status: FameRouteEdgeMatrixStatus;
  reasonCategory: FameRouteEdgeMatrixReasonCategory;
  reason: string;
  candidateIds: string[];
}

export interface FameRouteProtocolCoverageField {
  status: "available" | "unavailable" | "not_applicable" | "disabled";
  source: string;
  value?: string;
  reason?: string;
}

export interface FameRouteProtocolCoverageRow {
  chainId: number;
  tokenIn: Address;
  tokenOut: Address;
  tokenInSymbol: string;
  tokenOutSymbol: string;
  venue: VenueFamilyName | "Any";
  protocolVariant: string;
  poolId: string | null;
  target: Address | null;
  edgeStatus: FameRouteEdgeMatrixStatus;
  reasonCategory: FameRouteEdgeMatrixReasonCategory;
  attribution:
    | "selected_leg"
    | "considered_candidate"
    | "candidate_rejection"
    | "candidate_rejected_elsewhere"
    | "disabled_edge"
    | "missing_edge";
  quote: FameRouteProtocolCoverageField;
  prePrice: FameRouteProtocolCoverageField;
  postPrice: FameRouteProtocolCoverageField;
  marketImpact: FameRouteProtocolCoverageField;
  activeLiquidity: FameRouteProtocolCoverageField;
  routeSimulation: FameRouteProtocolCoverageField;
  reason: string;
  candidateIds: string[];
}

export interface FameRouteProtocolCoverageSimulation {
  status: "not_requested" | "skipped" | "passed" | "failed";
  message?: string;
  output?: string;
  protectedMinimum?: string;
}

interface ConnectorProbe {
  id: string;
  tokenIn: Address;
  tokenOut: Address;
  venue: VenueFamilyName | "Any";
  protocolVariant: string;
  reason: string;
}

interface PendingEdgeMatrixRow extends FameRouteEdgeMatrixRow {
  rank: number;
}

export const FAME_ROUTE_CONNECTOR_PROBES: readonly ConnectorProbe[] = [
  {
    id: "weth-usdc-slipstream",
    tokenIn: WETH,
    tokenOut: USDC,
    venue: "Slipstream",
    protocolVariant: "aerodrome-slipstream",
    reason:
      "No reviewed Aerodrome Slipstream WETH/USDC connector pool is present in the FAME pool universe.",
  },
  {
    id: "usdc-weth-slipstream",
    tokenIn: USDC,
    tokenOut: WETH,
    venue: "Slipstream",
    protocolVariant: "aerodrome-slipstream",
    reason:
      "No reviewed Aerodrome Slipstream USDC/WETH connector pool is present in the FAME pool universe.",
  },
  {
    id: "weth-usdc-aerodrome-v2",
    tokenIn: WETH,
    tokenOut: USDC,
    venue: "AerodromeV2",
    protocolVariant: "aerodrome-v2",
    reason:
      "No reviewed Aerodrome V2 WETH/USDC connector pool is present in the FAME pool universe.",
  },
  {
    id: "usdc-weth-aerodrome-v2",
    tokenIn: USDC,
    tokenOut: WETH,
    venue: "AerodromeV2",
    protocolVariant: "aerodrome-v2",
    reason:
      "No reviewed Aerodrome V2 USDC/WETH connector pool is present in the FAME pool universe.",
  },
  {
    id: "weth-usdc-solidly",
    tokenIn: WETH,
    tokenOut: USDC,
    venue: "Solidly",
    protocolVariant: "solidly",
    reason:
      "No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.",
  },
  {
    id: "usdc-weth-solidly",
    tokenIn: USDC,
    tokenOut: WETH,
    venue: "Solidly",
    protocolVariant: "solidly",
    reason:
      "No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.",
  },
] as const;

function normalizedAddress(address: Address): string {
  return address.toLowerCase();
}

function sameAddress(left: Address, right: Address): boolean {
  return normalizedAddress(left) === normalizedAddress(right);
}

function tokenSymbol(address: Address): string {
  return tokenForAddress(address)?.symbol ?? address;
}

function sanitizeDiagnosticText(value: string): string {
  const safeLine = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(
      (line) =>
        line.length > 0 &&
        !/\b(request body|calldata|approval|swap request|private key|signer|authorization|api[-_ ]?key)\b|(?:^|\s)secret(?:[-_ ]?(?:key|token))?\s*[:=]/i.test(
          line,
        ),
    );

  return (safeLine ?? "Route diagnostic unavailable.")
    .replace(/(?:https?|wss?):\/\/\S+/g, "[redacted-url]")
    .replace(/\b(?:bearer|token)\s+[a-z0-9._~+/=-]+/gi, "[redacted-secret]")
    .replace(/0x[a-fA-F0-9]{64,}/g, "[redacted-hex]");
}

function sanitizeCoverageField(
  field: FameProtocolEvidenceItem | FameRouteProtocolCoverageField,
): FameRouteProtocolCoverageField {
  return {
    status: field.status,
    source: sanitizeDiagnosticText(field.source),
    ...(field.value === undefined
      ? {}
      : { value: sanitizeDiagnosticText(field.value) }),
    ...(field.reason === undefined
      ? {}
      : { reason: sanitizeDiagnosticText(field.reason) }),
  };
}

function coverageField(
  status: FameRouteProtocolCoverageField["status"],
  source: string,
  reason?: string,
  value?: string | bigint | number | null,
): FameRouteProtocolCoverageField {
  return {
    status,
    source: sanitizeDiagnosticText(source),
    ...(value === undefined || value === null
      ? {}
      : { value: sanitizeDiagnosticText(value.toString()) }),
    ...(reason === undefined ? {} : { reason: sanitizeDiagnosticText(reason) }),
  };
}

function coverageUnavailable(
  source: string,
  reason: string,
): FameRouteProtocolCoverageField {
  return coverageField("unavailable", source, reason);
}

function coverageNotApplicable(
  source: string,
  reason: string,
): FameRouteProtocolCoverageField {
  return coverageField("not_applicable", source, reason);
}

function coverageDisabled(
  source: string,
  reason: string,
): FameRouteProtocolCoverageField {
  return coverageField("disabled", source, reason);
}

function protocolVariantForEdge(edge: FamePoolEdge): string {
  return edge.pool.venue;
}

function rowKey(row: {
  chainId: number;
  tokenIn: Address;
  tokenOut: Address;
  venue: VenueFamilyName | "Any";
  protocolVariant: string;
  poolId: string | null;
  target: Address | null;
}): string {
  return [
    row.chainId,
    normalizedAddress(row.tokenIn),
    normalizedAddress(row.tokenOut),
    row.venue,
    row.protocolVariant,
    row.poolId ?? "missing",
    row.target ? normalizedAddress(row.target) : "missing",
  ].join(":");
}

function statusRank(status: FameRouteEdgeMatrixStatus): number {
  switch (status) {
    case "selected":
      return 4;
    case "considered":
      return 3;
    case "rejected":
      return 2;
    case "disabled":
      return 1;
    case "missing":
      return 0;
  }
}

function reasonCategoryForRejection(
  rejection: FameCandidateRejection | undefined,
): FameRouteEdgeMatrixReasonCategory {
  switch (rejection?.reason) {
    case "adapter_failure":
    case "no_quote_evidence":
      return "quote_adapter_failure";
    case "amount_exceeds_capacity":
    case "zero_output":
    case "unsafe_output":
    default:
      return "unsafe_output";
  }
}

function reasonForRejection(
  rejection: FameCandidateRejection | undefined,
): string {
  return sanitizeDiagnosticText(
    rejection?.message ?? "Candidate was rejected by route ranking.",
  );
}

function upsertRow(
  rows: Map<string, PendingEdgeMatrixRow>,
  row: FameRouteEdgeMatrixRow,
) {
  const rank = statusRank(row.status);
  const key = rowKey(row);
  const existing = rows.get(key);
  if (!existing || rank > existing.rank) {
    rows.set(key, {
      ...row,
      reason: sanitizeDiagnosticText(row.reason),
      candidateIds: [...new Set(row.candidateIds)].sort(),
      rank,
    });
    return;
  }

  if (rank === existing.rank) {
    existing.candidateIds = [
      ...new Set([...existing.candidateIds, ...row.candidateIds]),
    ].sort();
  }
}

function rowForEdge(options: {
  edge: FamePoolEdge;
  chainId: number;
  status: FameRouteEdgeMatrixStatus;
  reasonCategory: FameRouteEdgeMatrixReasonCategory;
  reason: string;
  candidateIds: readonly string[];
}): FameRouteEdgeMatrixRow {
  return {
    chainId: options.chainId,
    tokenIn: options.edge.tokenIn,
    tokenOut: options.edge.tokenOut,
    tokenInSymbol: tokenSymbol(options.edge.tokenIn),
    tokenOutSymbol: tokenSymbol(options.edge.tokenOut),
    venue: options.edge.venue,
    protocolVariant: protocolVariantForEdge(options.edge),
    poolId: options.edge.poolId,
    target: options.edge.target,
    status: options.status,
    reasonCategory: options.reasonCategory,
    reason: options.reason,
    candidateIds: [...options.candidateIds],
  };
}

function edgeMatchesProbe(edge: FamePoolEdge, probe: ConnectorProbe): boolean {
  return (
    sameAddress(edge.tokenIn, probe.tokenIn) &&
    sameAddress(edge.tokenOut, probe.tokenOut) &&
    (probe.venue === "Any" || edge.venue === probe.venue)
  );
}

function disabledReasonForEdge(edge: FamePoolEdge): string {
  if (edge.pool.enablement?.status === "blocked") {
    return `${edge.poolId} is disabled: ${edge.pool.enablement.reason}`;
  }

  return `${edge.poolId} is disabled because its venue family or target is not enabled by the current FAME router manifest/readiness policy.`;
}

export function buildFameRouteEdgeMatrix(options: {
  candidateSet: FameRouteCandidateSet;
  selectedCandidateId?: string | null;
  selectedLegQuotes?: readonly FameLegQuote[];
  rejectedCandidates?: readonly FameCandidateRejection[];
  diagnosticEdges?: readonly FamePoolEdge[];
  connectorProbes?: readonly ConnectorProbe[];
  chainId?: number;
}): FameRouteEdgeMatrixRow[] {
  const chainId = options.chainId ?? base.id;
  const diagnosticEdges = options.diagnosticEdges ?? famePoolEdges();
  const connectorProbes =
    options.connectorProbes ?? FAME_ROUTE_CONNECTOR_PROBES;
  const rejectedByCandidateId = new Map(
    (options.rejectedCandidates ?? []).map((candidate) => [
      candidate.candidateId,
      candidate,
    ]),
  );
  const rows = new Map<string, PendingEdgeMatrixRow>();
  const selectedCandidate = options.selectedCandidateId
    ? options.candidateSet.candidates.find(
        (candidate) => candidate.id === options.selectedCandidateId,
      )
    : undefined;

  for (const edge of diagnosticEdges) {
    if (edge.manifestReady) continue;
    upsertRow(
      rows,
      rowForEdge({
        edge,
        chainId,
        status: "disabled",
        reasonCategory: "disabled_edge",
        reason: disabledReasonForEdge(edge),
        candidateIds: [],
      }),
    );
  }

  for (const candidate of options.candidateSet.candidates) {
    const rejection = rejectedByCandidateId.get(candidate.id);
    const status: FameRouteEdgeMatrixStatus =
      selectedCandidate && candidate.id === selectedCandidate.id
        ? "selected"
        : rejection
          ? "rejected"
          : "considered";
    const reasonCategory: FameRouteEdgeMatrixReasonCategory =
      status === "selected"
        ? "selected_edge"
        : status === "considered"
          ? "considered_edge"
          : reasonCategoryForRejection(rejection);
    const reason =
      status === "selected"
        ? "Edge is part of the selected ready route."
        : status === "considered"
          ? "Edge appears in at least one generated executable candidate."
          : reasonForRejection(rejection);

    for (const leg of candidate.legs) {
      upsertRow(
        rows,
        rowForEdge({
          edge: leg.edge,
          chainId,
          status,
          reasonCategory,
          reason,
          candidateIds: [candidate.id],
        }),
      );
    }
  }

  for (const leg of options.selectedLegQuotes ?? []) {
    const edge = diagnosticEdges.find(
      (candidateEdge) =>
        candidateEdge.poolId === leg.poolId &&
        sameAddress(candidateEdge.tokenIn, leg.tokenIn) &&
        sameAddress(candidateEdge.tokenOut, leg.tokenOut),
    );
    if (!edge) continue;
    upsertRow(
      rows,
      rowForEdge({
        edge,
        chainId,
        status: "selected",
        reasonCategory: "selected_edge",
        reason: "Edge is part of the selected ready route.",
        candidateIds: options.selectedCandidateId
          ? [options.selectedCandidateId]
          : [],
      }),
    );
  }

  for (const probe of connectorProbes) {
    if (diagnosticEdges.some((edge) => edgeMatchesProbe(edge, probe))) {
      continue;
    }

    upsertRow(rows, {
      chainId,
      tokenIn: probe.tokenIn,
      tokenOut: probe.tokenOut,
      tokenInSymbol: tokenSymbol(probe.tokenIn),
      tokenOutSymbol: tokenSymbol(probe.tokenOut),
      venue: probe.venue,
      protocolVariant: probe.protocolVariant,
      poolId: null,
      target: null,
      status: "missing",
      reasonCategory: "missing_edge",
      reason: probe.reason,
      candidateIds: [],
    });
  }

  return [...rows.values()]
    .map(({ rank: _rank, ...row }) => row)
    .sort((left, right) => rowKey(left).localeCompare(rowKey(right)));
}

function selectedLegForRow(
  row: FameRouteEdgeMatrixRow,
  legQuotes: readonly FameLegQuote[],
): FameLegQuote | undefined {
  return legQuotes.find(
    (leg) =>
      row.poolId === leg.poolId &&
      sameAddress(row.tokenIn, leg.tokenIn) &&
      sameAddress(row.tokenOut, leg.tokenOut),
  );
}

function protocolEvidenceFromLeg(leg: FameLegQuote): FameProtocolEvidence {
  if (leg.protocolEvidence) return leg.protocolEvidence;

  const source = leg.evidence;
  return {
    quote: coverageField("available", source, undefined, leg.amountOut),
    prePrice: leg.priceImpact
      ? coverageField(
          "available",
          source,
          undefined,
          leg.priceImpact.preSwapPriceX18,
        )
      : coverageUnavailable(source, "Pre-price evidence is unavailable."),
    postPrice: leg.priceImpact
      ? leg.priceImpact.postSwapPriceX18 === null
        ? coverageUnavailable(
            source,
            "Protocol-backed post-price evidence is unavailable.",
          )
        : coverageField(
            "available",
            source,
            undefined,
            leg.priceImpact.postSwapPriceX18,
          )
      : coverageUnavailable(source, "Post-price evidence is unavailable."),
    marketImpact:
      leg.priceImpact?.marketImpactBps === undefined ||
      leg.priceImpact.marketImpactBps === null
        ? coverageUnavailable(source, "Market-impact evidence is unavailable.")
        : coverageField(
            "available",
            source,
            undefined,
            leg.priceImpact.marketImpactBps,
          ),
    activeLiquidity: coverageNotApplicable(
      source,
      "Active liquidity evidence is not applicable for this selected leg.",
    ),
  };
}

function selectedCoverageFields(leg: FameLegQuote) {
  const evidence = protocolEvidenceFromLeg(leg);
  return {
    quote: sanitizeCoverageField(evidence.quote),
    prePrice: sanitizeCoverageField(evidence.prePrice),
    postPrice: sanitizeCoverageField(evidence.postPrice),
    marketImpact: sanitizeCoverageField(evidence.marketImpact),
    activeLiquidity: sanitizeCoverageField(evidence.activeLiquidity),
  };
}

function simulationCoverage(
  row: FameRouteEdgeMatrixRow,
  simulation?: FameRouteProtocolCoverageSimulation,
): FameRouteProtocolCoverageField {
  if (row.status !== "selected") {
    if (row.status === "disabled") {
      return coverageDisabled(
        "route-lab simulation",
        "Disabled edges are not route-simulated.",
      );
    }
    if (row.status === "missing") {
      return coverageUnavailable(
        "route-lab simulation",
        "Missing edges cannot be route-simulated.",
      );
    }
    return coverageNotApplicable(
      "route-lab simulation",
      "Only the selected ready route is route-simulated.",
    );
  }

  if (!simulation) {
    return coverageUnavailable(
      "route-lab simulation",
      "Route simulation status is unavailable.",
    );
  }

  switch (simulation.status) {
    case "passed":
      return coverageField(
        "available",
        "route-lab simulation",
        undefined,
        simulation.protectedMinimum ?? simulation.output,
      );
    case "failed":
      return coverageUnavailable(
        "route-lab simulation",
        simulation.message ?? "Route simulation failed.",
      );
    case "skipped":
      return coverageNotApplicable(
        "route-lab simulation",
        simulation.message ?? "Route simulation was skipped.",
      );
    case "not_requested":
      return coverageUnavailable(
        "route-lab simulation",
        simulation.message ?? "Route simulation was not requested.",
      );
  }
}

function defaultCoverageFields(row: FameRouteEdgeMatrixRow) {
  const source = "edge matrix";
  switch (row.status) {
    case "considered":
      return {
        attribution: "considered_candidate" as const,
        quote: coverageUnavailable(
          source,
          "Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.",
        ),
        prePrice: coverageUnavailable(
          source,
          "Pre-price evidence is not retained for unselected routes.",
        ),
        postPrice: coverageUnavailable(
          source,
          "Post-price evidence is not retained for unselected routes.",
        ),
        marketImpact: coverageUnavailable(
          source,
          "Market-impact evidence is not retained for unselected routes.",
        ),
        activeLiquidity: coverageUnavailable(
          source,
          "Active liquidity evidence is not retained for unselected routes.",
        ),
      };
    case "disabled":
      return {
        attribution: "disabled_edge" as const,
        quote: coverageDisabled(source, row.reason),
        prePrice: coverageDisabled(source, row.reason),
        postPrice: coverageDisabled(source, row.reason),
        marketImpact: coverageDisabled(source, row.reason),
        activeLiquidity: coverageDisabled(source, row.reason),
      };
    case "missing":
      return {
        attribution: "missing_edge" as const,
        quote: coverageUnavailable(source, row.reason),
        prePrice: coverageUnavailable(source, row.reason),
        postPrice: coverageUnavailable(source, row.reason),
        marketImpact: coverageUnavailable(source, row.reason),
        activeLiquidity: coverageUnavailable(source, row.reason),
      };
    case "rejected":
      return {
        attribution: "candidate_rejection" as const,
        quote: coverageUnavailable(source, row.reason),
        prePrice: coverageUnavailable(source, row.reason),
        postPrice: coverageUnavailable(source, row.reason),
        marketImpact: coverageUnavailable(source, row.reason),
        activeLiquidity: coverageUnavailable(source, row.reason),
      };
    case "selected":
      return {
        attribution: "selected_leg" as const,
        quote: coverageUnavailable(
          source,
          "Selected-leg quote evidence was not retained for this edge.",
        ),
        prePrice: coverageUnavailable(
          source,
          "Selected-leg pre-price evidence was not retained for this edge.",
        ),
        postPrice: coverageUnavailable(
          source,
          "Selected-leg post-price evidence was not retained for this edge.",
        ),
        marketImpact: coverageUnavailable(
          source,
          "Selected-leg market-impact evidence was not retained for this edge.",
        ),
        activeLiquidity: coverageUnavailable(
          source,
          "Selected-leg active-liquidity evidence was not retained for this edge.",
        ),
      };
  }
}

function rejectionForRow(
  row: FameRouteEdgeMatrixRow,
  rejectedCandidates: readonly FameCandidateRejection[],
): FameCandidateRejection | undefined {
  if (!row.poolId) return undefined;
  return rejectedCandidates.find(
    (rejection) =>
      rejection.failedPoolId === row.poolId &&
      row.candidateIds.includes(rejection.candidateId),
  );
}

export function buildFameRouteProtocolCoverage(options: {
  edgeMatrix: readonly FameRouteEdgeMatrixRow[];
  selectedLegQuotes?: readonly FameLegQuote[];
  rejectedCandidates?: readonly FameCandidateRejection[];
  simulation?: FameRouteProtocolCoverageSimulation;
}): FameRouteProtocolCoverageRow[] {
  return options.edgeMatrix.map((row) => {
    const selectedLeg =
      row.status === "selected"
        ? selectedLegForRow(row, options.selectedLegQuotes ?? [])
        : undefined;
    const selectedFields = selectedLeg
      ? selectedCoverageFields(selectedLeg)
      : undefined;
    const rejection = rejectionForRow(row, options.rejectedCandidates ?? []);
    const defaults = defaultCoverageFields(row);
    const rejectedElsewhere =
      row.status === "rejected" &&
      !rejection &&
      (options.rejectedCandidates ?? []).some((candidate) =>
        row.candidateIds.includes(candidate.candidateId),
      );
    const attribution = selectedFields
      ? "selected_leg"
      : rejectedElsewhere
        ? "candidate_rejected_elsewhere"
        : rejection
          ? "candidate_rejection"
          : defaults.attribution;
    const reason = rejection
      ? `${row.reason} Failed leg: ${rejection.failedPoolId ?? "unknown"}.`
      : rejectedElsewhere
        ? `${row.reason} Candidate rejection was caused by a different leg.`
        : row.reason;

    return {
      chainId: row.chainId,
      tokenIn: row.tokenIn,
      tokenOut: row.tokenOut,
      tokenInSymbol: row.tokenInSymbol,
      tokenOutSymbol: row.tokenOutSymbol,
      venue: row.venue,
      protocolVariant: row.protocolVariant,
      poolId: row.poolId,
      target: row.target,
      edgeStatus: row.status,
      reasonCategory: row.reasonCategory,
      attribution,
      quote: selectedFields?.quote ?? defaults.quote,
      prePrice: selectedFields?.prePrice ?? defaults.prePrice,
      postPrice: selectedFields?.postPrice ?? defaults.postPrice,
      marketImpact: selectedFields?.marketImpact ?? defaults.marketImpact,
      activeLiquidity:
        selectedFields?.activeLiquidity ?? defaults.activeLiquidity,
      routeSimulation: simulationCoverage(row, options.simulation),
      reason: sanitizeDiagnosticText(reason),
      candidateIds: [...row.candidateIds],
    };
  });
}
