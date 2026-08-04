export const LIQUIDITY_DETERIORATION_BPS = 200n;
export const BUY_DEPTH_LADDER_USDC = [
  100n,
  250n,
  500n,
  1_000n,
  2_500n,
  5_000n,
  10_000n,
].map((value) => value * 10n ** 6n);
export const SELL_DEPTH_LADDER_FAME = [1n, 2n, 5n, 10n, 25n, 50n, 100n].map(
  (value) => value * 1_000_000n * 10n ** 18n,
);

export type DepthCandidate = Readonly<{ input: bigint; output: bigint }>;
export type DepthResult = Readonly<{
  input: bigint;
  output: bigint;
  atLeast: boolean;
}> | null;

export async function mapBounded<T, R>(
  values: readonly T[],
  concurrency: number,
  mapper: (value: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new Error("Depth concurrency must be positive.");
  }
  const result = new Array<R>(values.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, async () => {
      for (;;) {
        const index = next++;
        if (index >= values.length) return;
        result[index] = await mapper(values[index]!, index);
      }
    }),
  );
  return result;
}

export function executableDepth(
  reference: DepthCandidate | null,
  candidates: readonly DepthCandidate[],
  inputDecimals: number,
  outputDecimals: number,
): DepthResult {
  const referencePrice = price(reference, inputDecimals, outputDecimals);
  if (!referencePrice) return null;

  let accepted: DepthCandidate | null = null;
  for (const candidate of candidates) {
    const candidatePrice = price(candidate, inputDecimals, outputDecimals);
    if (!candidatePrice) return null;
    const referenceScaled =
      referencePrice.numerator * candidatePrice.denominator;
    const candidateScaled =
      candidatePrice.numerator * referencePrice.denominator;
    const deterioration =
      candidateScaled >= referenceScaled
        ? 0n
        : ((referenceScaled - candidateScaled) * 10_000n) / referenceScaled;
    if (deterioration > LIQUIDITY_DETERIORATION_BPS) break;
    accepted = candidate;
  }

  return accepted
    ? {
        input: accepted.input,
        output: accepted.output,
        atLeast: candidates.at(-1) === accepted,
      }
    : null;
}

function price(
  quote: DepthCandidate | null,
  inputDecimals: number,
  outputDecimals: number,
) {
  if (!quote || quote.input <= 0n || quote.output <= 0n) return null;
  return {
    numerator: quote.output * 10n ** BigInt(inputDecimals),
    denominator: quote.input * 10n ** BigInt(outputDecimals),
  };
}
