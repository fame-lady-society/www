export const DEFAULT_FAME_SWAP_DEADLINE_MINUTES = 20;
export const MIN_FAME_SWAP_DEADLINE_MINUTES = 5;
export const MAX_FAME_SWAP_DEADLINE_MINUTES = 60;

export function normalizeDeadlineMinutes(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_FAME_SWAP_DEADLINE_MINUTES;

  const integer = Math.trunc(value);
  if (integer < MIN_FAME_SWAP_DEADLINE_MINUTES) {
    return MIN_FAME_SWAP_DEADLINE_MINUTES;
  }
  if (integer > MAX_FAME_SWAP_DEADLINE_MINUTES) {
    return MAX_FAME_SWAP_DEADLINE_MINUTES;
  }
  return integer;
}

export function deadlineMinutesToSeconds(value: number): bigint {
  return BigInt(normalizeDeadlineMinutes(value) * 60);
}
