import { ratio, spreadBps, type Rational } from "./marketStats";

export const LIQUIDITY_DETERIORATION_BPS = 200n;
export const BUY_DEPTH_LADDER_USDC = [100n, 250n, 500n, 1_000n, 2_500n, 5_000n, 10_000n].map((value) => value * 1_000_000n);
export const SELL_DEPTH_LADDER_FAME = [1n, 2n, 5n, 10n, 25n, 50n, 100n].map((value) => value * 10n ** 18n);

export type DepthCandidate = Readonly<{ input: bigint; output: bigint }>;
export type DepthResult = Readonly<{ amount: bigint; atLeast: boolean }> | null;

/** Bounded worker pool used for fixed quote ladders; preserves candidate order. */
export async function mapBounded<T, R>(
  values: readonly T[],
  concurrency: number,
  mapper: (value: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (!Number.isInteger(concurrency) || concurrency < 1) throw new Error("Ladder concurrency must be positive.");
  const result = new Array<R>(values.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, async () => {
    for (;;) {
      const index = next++;
      if (index >= values.length) return;
      result[index] = await mapper(values[index]!, index);
    }
  }));
  return result;
}

/** Accepts a single pinned-context quote sequence. No raw-reserve fallback. */
export function executableDepth(
  reference: DepthCandidate | null,
  candidates: readonly DepthCandidate[],
  inputDecimals: number,
  outputDecimals: number,
): DepthResult {
  if (!reference || reference.input <= 0n || reference.output <= 0n) return null;
  const referencePrice = ratio(reference.output, outputDecimals, reference.input, inputDecimals);
  if (referencePrice === null) return null;
  let accepted: DepthCandidate | null = null;
  for (const candidate of candidates) {
    if (candidate.input <= 0n || candidate.output <= 0n) return null;
    const candidatePrice = ratio(candidate.output, outputDecimals, candidate.input, inputDecimals);
    if (candidatePrice === null) return null;
    const deterioration = quoteDeteriorationBps(referencePrice, candidatePrice);
    if (deterioration === null || deterioration > LIQUIDITY_DETERIORATION_BPS) break;
    accepted = candidate;
  }
  return accepted
    ? { amount: accepted.output, atLeast: candidates.at(-1) === accepted }
    : null;
}

function quoteDeteriorationBps(reference: Rational, candidate: Rational): bigint | null {
  if (candidate.numerator <= 0n || reference.numerator <= 0n) return null;
  // A better execution is zero deterioration; otherwise compare reference - candidate to reference.
  const refScaled = reference.numerator * candidate.denominator;
  const candidateScaled = candidate.numerator * reference.denominator;
  if (candidateScaled >= refScaled) return 0n;
  return ((refScaled - candidateScaled) * 10_000n) / refScaled;
}

export { spreadBps };
