import type { Address } from "viem";
import { FAME, NATIVE_ETH, USDC, WETH } from "../../tokens";
import { buildFamePoolGraph, type FamePoolGraph } from "../graph/buildGraph";
import { routeCandidatesForPair } from "../graph/candidates";
import type { FameRouteCandidate } from "../graph/routePlan";
import { famePoolEdges, type FamePoolEdge } from "../poolUniverse";
import type {
  FameOptimizerEligibilitySummary,
  FameOptimizerRouteTemplate,
} from "./types";

const MAX_COORDINATE_DESCENT_BRANCHES = 3;

export interface FameOptimizerTemplateSet {
  templates: FameOptimizerRouteTemplate[];
  eligibility: FameOptimizerEligibilitySummary[];
}

function normalizedAddress(address: Address): string {
  return address.toLowerCase();
}

function sameAddress(left: Address, right: Address): boolean {
  return normalizedAddress(left) === normalizedAddress(right);
}

function supportedFamePair(tokenIn: Address, tokenOut: Address): boolean {
  const supportedAssets = [USDC, WETH, NATIVE_ETH];
  return (
    (sameAddress(tokenIn, FAME) &&
      supportedAssets.some((asset) => sameAddress(tokenOut, asset))) ||
    (sameAddress(tokenOut, FAME) &&
      supportedAssets.some((asset) => sameAddress(tokenIn, asset)))
  );
}

function templateKindRank(template: FameOptimizerRouteTemplate): number {
  switch (template.kind) {
    case "terminal_split":
      return 0;
    case "direct_split":
      return 1;
    case "split_merge":
      return 2;
    case "single_path":
      return 3;
  }
}

function directEdges(
  graph: FamePoolGraph,
  tokenIn: Address,
  tokenOut: Address,
): FamePoolEdge[] {
  return graph
    .edgesFrom(tokenIn)
    .filter((edge) => sameAddress(edge.tokenOut, tokenOut));
}

function poolIds(edges: readonly FamePoolEdge[]): string[] {
  return edges.map((edge) => edge.poolId);
}

function cappedNWayEdges(edges: readonly FamePoolEdge[]): FamePoolEdge[] {
  return [...edges]
    .sort((left, right) => left.poolId.localeCompare(right.poolId))
    .slice(0, MAX_COORDINATE_DESCENT_BRANCHES);
}

function nWayBranches(edges: readonly FamePoolEdge[]) {
  return cappedNWayEdges(edges).map((edge, index) => ({
    edge,
    label: `branch-${(index + 1).toString()}`,
  }));
}

function recordNWayEligibility(options: {
  eligibility: FameOptimizerEligibilitySummary[];
  templateId: string;
  executable: readonly FamePoolEdge[];
}) {
  if (options.executable.length <= MAX_COORDINATE_DESCENT_BRANCHES) return;
  options.eligibility.push({
    templateId: `${options.templateId}-branch-cap`,
    status: "pruned",
    reason: `Coordinate descent is capped at ${MAX_COORDINATE_DESCENT_BRANCHES.toString()} branches for this milestone.`,
    poolIds: poolIds(options.executable.slice(MAX_COORDINATE_DESCENT_BRANCHES)),
  });
}

function singlePathTemplates(
  tokenIn: Address,
  tokenOut: Address,
): FameOptimizerRouteTemplate[] {
  return routeCandidatesForPair(tokenIn, tokenOut)
    .candidates.filter((candidate) => candidate.kind === "single_path")
    .map((candidate) => ({
      id: `single-${candidate.id}`,
      kind: "single_path" as const,
      tokenIn,
      tokenOut,
      branches: [],
      suffix: [],
      baselineCandidate: candidate,
      summary: candidate.summary,
    }));
}

function directSplitTemplates(
  graph: FamePoolGraph,
  tokenIn: Address,
  tokenOut: Address,
  eligibility: FameOptimizerEligibilitySummary[],
): FameOptimizerRouteTemplate[] {
  const allDirect = directEdges(graph, tokenIn, tokenOut);
  const executable = allDirect.filter((edge) => edge.manifestReady);

  for (const edge of allDirect) {
    if (!edge.manifestReady) {
      eligibility.push({
        templateId: `ineligible-${edge.poolId}`,
        status: "ineligible",
        reason:
          "Pool is reviewed but not enabled in the current router manifest.",
        poolIds: [edge.poolId],
      });
    }
  }

  if (executable.length >= 3) {
    eligibility.push({
      templateId: `nway-direct-${normalizedAddress(tokenIn)}-${normalizedAddress(tokenOut)}`,
      status: "ineligible",
      reason:
        "Three or more same-pair pools are eligible; coordinate descent will evaluate a capped N-way template.",
      poolIds: poolIds(executable),
    });
    recordNWayEligibility({
      eligibility,
      templateId: `nway-direct-${normalizedAddress(tokenIn)}-${normalizedAddress(tokenOut)}`,
      executable,
    });
  }

  const templates: FameOptimizerRouteTemplate[] = [];
  if (executable.length >= 3) {
    const branches = nWayBranches(executable);
    templates.push({
      id: `nway-direct-${normalizedAddress(tokenIn)}-${normalizedAddress(tokenOut)}`,
      kind: "direct_split",
      tokenIn,
      tokenOut,
      branches,
      suffix: [],
      summary: branches.map((branch) => branch.edge.poolId).join(" + "),
    });
  }

  for (let leftIndex = 0; leftIndex < executable.length; leftIndex += 1) {
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < executable.length;
      rightIndex += 1
    ) {
      const left = executable[leftIndex];
      const right = executable[rightIndex];
      templates.push({
        id: `direct-split-${left.poolId}--${right.poolId}`,
        kind: "direct_split",
        tokenIn,
        tokenOut,
        branches: [
          { edge: left, label: "left" },
          { edge: right, label: "right" },
        ],
        suffix: [],
        summary: `${left.poolId} + ${right.poolId}`,
      });
    }
  }

  return templates;
}

function terminalSplitTemplates(
  graph: FamePoolGraph,
  tokenIn: Address,
  tokenOut: Address,
  eligibility: FameOptimizerEligibilitySummary[],
): FameOptimizerRouteTemplate[] {
  const finalHopGroups = new Map<string, FamePoolEdge[]>();
  for (const edge of graph.edges) {
    if (!sameAddress(edge.tokenOut, tokenOut)) continue;
    if (sameAddress(edge.tokenIn, tokenIn)) continue;

    const key = normalizedAddress(edge.tokenIn);
    finalHopGroups.set(key, [...(finalHopGroups.get(key) ?? []), edge]);
  }

  const templates: FameOptimizerRouteTemplate[] = [];
  for (const [intermediate, edges] of finalHopGroups.entries()) {
    const executableFinalHops = edges.filter((edge) => edge.manifestReady);
    const disabledFinalHops = edges.filter((edge) => !edge.manifestReady);
    if (disabledFinalHops.length > 0) {
      eligibility.push({
        templateId: `ineligible-final-hop-${intermediate}`,
        status: "ineligible",
        reason:
          "One or more same-intermediate final-hop pools are reviewed but not enabled.",
        poolIds: poolIds(disabledFinalHops),
      });
    }
    if (executableFinalHops.length >= 3) {
      eligibility.push({
        templateId: `nway-terminal-split-${intermediate}`,
        status: "ineligible",
        reason:
          "Three or more same-output final-hop pools are eligible; coordinate descent will evaluate a capped N-way template.",
        poolIds: poolIds(executableFinalHops),
      });
      recordNWayEligibility({
        eligibility,
        templateId: `nway-terminal-split-${intermediate}`,
        executable: executableFinalHops,
      });
    }
    if (executableFinalHops.length < 2) continue;

    const prefixes = directEdges(
      graph,
      tokenIn,
      executableFinalHops[0].tokenIn,
    ).filter((edge) => edge.manifestReady);
    if (prefixes.length === 0) continue;

    for (const prefix of prefixes) {
      if (executableFinalHops.length >= 3) {
        const branches = nWayBranches(executableFinalHops);
        templates.push({
          id: `nway-terminal-split-${prefix.poolId}-${intermediate}`,
          kind: "terminal_split",
          tokenIn,
          tokenOut,
          prefix: [prefix],
          branches,
          suffix: [],
          summary: `${prefix.poolId} -> ${branches
            .map((branch) => branch.edge.poolId)
            .join(" + ")}`,
        });
      }
      for (
        let leftIndex = 0;
        leftIndex < executableFinalHops.length;
        leftIndex += 1
      ) {
        for (
          let rightIndex = leftIndex + 1;
          rightIndex < executableFinalHops.length;
          rightIndex += 1
        ) {
          const left = executableFinalHops[leftIndex];
          const right = executableFinalHops[rightIndex];
          templates.push({
            id: `terminal-split-${prefix.poolId}--${left.poolId}--${right.poolId}`,
            kind: "terminal_split",
            tokenIn,
            tokenOut,
            prefix: [prefix],
            branches: [
              { edge: left, label: "left" },
              { edge: right, label: "right" },
            ],
            suffix: [],
            summary: `${prefix.poolId} -> ${left.poolId} + ${right.poolId}`,
          });
        }
      }
    }
  }

  return templates;
}

function splitMergeTemplates(
  graph: FamePoolGraph,
  tokenIn: Address,
  tokenOut: Address,
  eligibility: FameOptimizerEligibilitySummary[],
): FameOptimizerRouteTemplate[] {
  const firstHopGroups = new Map<string, FamePoolEdge[]>();
  for (const edge of graph.edgesFrom(tokenIn)) {
    if (
      sameAddress(edge.tokenOut, tokenOut) ||
      sameAddress(edge.tokenOut, tokenIn)
    ) {
      continue;
    }
    const key = normalizedAddress(edge.tokenOut);
    firstHopGroups.set(key, [...(firstHopGroups.get(key) ?? []), edge]);
  }

  const templates: FameOptimizerRouteTemplate[] = [];
  for (const [intermediate, edges] of firstHopGroups.entries()) {
    const executableFirstHops = edges.filter((edge) => edge.manifestReady);
    const disabled = edges.filter((edge) => !edge.manifestReady);
    if (disabled.length > 0) {
      eligibility.push({
        templateId: `ineligible-first-hop-${intermediate}`,
        status: "ineligible",
        reason:
          "One or more same-intermediate first-hop pools are reviewed but not enabled.",
        poolIds: poolIds(disabled),
      });
    }
    if (executableFirstHops.length >= 3) {
      eligibility.push({
        templateId: `nway-split-merge-${intermediate}`,
        status: "ineligible",
        reason:
          "Three or more same-intermediate branches are eligible; coordinate descent will evaluate a capped N-way template.",
        poolIds: poolIds(executableFirstHops),
      });
      recordNWayEligibility({
        eligibility,
        templateId: `nway-split-merge-${intermediate}`,
        executable: executableFirstHops,
      });
    }
    if (executableFirstHops.length < 2) continue;

    const mergeEdges = directEdges(
      graph,
      executableFirstHops[0].tokenOut,
      tokenOut,
    ).filter((edge) => edge.manifestReady);
    if (mergeEdges.length === 0) continue;

    if (executableFirstHops.length >= 3) {
      const branches = nWayBranches(executableFirstHops);
      for (const mergeEdge of mergeEdges) {
        templates.push({
          id: `nway-split-merge-${intermediate}-${mergeEdge.poolId}`,
          kind: "split_merge",
          tokenIn,
          tokenOut,
          branches,
          suffix: [mergeEdge],
          summary: `${branches
            .map((branch) => branch.edge.poolId)
            .join(" + ")} -> ${mergeEdge.poolId}`,
        });
      }
    }

    for (
      let leftIndex = 0;
      leftIndex < executableFirstHops.length;
      leftIndex += 1
    ) {
      for (
        let rightIndex = leftIndex + 1;
        rightIndex < executableFirstHops.length;
        rightIndex += 1
      ) {
        for (const mergeEdge of mergeEdges) {
          const left = executableFirstHops[leftIndex];
          const right = executableFirstHops[rightIndex];
          templates.push({
            id: `split-merge-${left.poolId}--${right.poolId}--${mergeEdge.poolId}`,
            kind: "split_merge",
            tokenIn,
            tokenOut,
            branches: [
              { edge: left, label: "left" },
              { edge: right, label: "right" },
            ],
            suffix: [mergeEdge],
            summary: `${left.poolId} + ${right.poolId} -> ${mergeEdge.poolId}`,
          });
        }
      }
    }
  }

  return templates;
}

export function routeOptimizerTemplatesForPair(
  tokenIn: Address,
  tokenOut: Address,
  graph: FamePoolGraph = buildFamePoolGraph(famePoolEdges(), {
    includeManifestDisabled: true,
  }),
): FameOptimizerTemplateSet {
  if (!supportedFamePair(tokenIn, tokenOut)) {
    return {
      templates: [],
      eligibility: [
        {
          templateId: "unsupported-pair",
          status: "ineligible",
          reason:
            "Only FAME paired with USDC, WETH, or native ETH is supported.",
          poolIds: [],
        },
      ],
    };
  }

  const eligibility: FameOptimizerEligibilitySummary[] = [];
  const templates = [
    ...singlePathTemplates(tokenIn, tokenOut),
    ...directSplitTemplates(graph, tokenIn, tokenOut, eligibility),
    ...terminalSplitTemplates(graph, tokenIn, tokenOut, eligibility),
    ...splitMergeTemplates(graph, tokenIn, tokenOut, eligibility),
  ];

  const deduped = new Map<string, FameOptimizerRouteTemplate>();
  for (const template of templates.sort((left, right) => {
    const leftRank = templateKindRank(left);
    const rightRank = templateKindRank(right);
    if (leftRank !== rightRank) return leftRank - rightRank;
    return left.id.localeCompare(right.id);
  })) {
    if (!deduped.has(template.id)) deduped.set(template.id, template);
  }

  return {
    templates: [...deduped.values()],
    eligibility,
  };
}

export function templatePoolIds(
  template: FameOptimizerRouteTemplate,
): string[] {
  if (template.baselineCandidate) {
    return template.baselineCandidate.legs.map((leg) => leg.edge.poolId);
  }
  return [
    ...(template.prefix ?? []).map((edge) => edge.poolId),
    ...template.branches.map((branch) => branch.edge.poolId),
    ...template.suffix.map((edge) => edge.poolId),
  ];
}

export function templateFromCandidate(
  candidate: FameRouteCandidate,
): FameOptimizerRouteTemplate {
  return {
    id: `single-${candidate.id}`,
    kind: "single_path",
    tokenIn: candidate.tokenIn,
    tokenOut: candidate.tokenOut,
    branches: [],
    suffix: [],
    baselineCandidate: candidate,
    summary: candidate.summary,
  };
}
