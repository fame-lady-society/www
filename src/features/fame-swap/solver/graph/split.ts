export const FAME_ROUTE_SPLIT_ALLOCATION_BPS = [
  1_000,
  2_500,
  5_000,
  7_500,
  9_000,
] as const;

export function remainingSplitBps(firstBranchBps: number): number {
  return 10_000 - firstBranchBps;
}
