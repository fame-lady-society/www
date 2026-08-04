/** Integer-only values used by the FAME landing. Cached payloads use strings. */
export type Rational = Readonly<{ numerator: bigint; denominator: bigint }>;

export type Freshness = "fresh" | "stale" | "unavailable";

export function normalize(amount: bigint, decimals: number): Rational | null {
  if (amount < 0n || !Number.isInteger(decimals) || decimals < 0 || decimals > 255)
    return null;
  return { numerator: amount, denominator: 10n ** BigInt(decimals) };
}

export function ratio(
  output: bigint,
  outputDecimals: number,
  input: bigint,
  inputDecimals: number,
): Rational | null {
  if (output < 0n || input <= 0n) return null;
  const numerator = output * 10n ** BigInt(inputDecimals);
  const denominator = input * 10n ** BigInt(outputDecimals);
  return reduce({ numerator, denominator });
}

export function reduce(value: Rational): Rational {
  if (value.denominator <= 0n) throw new Error("A rational denominator must be positive.");
  const divisor = gcd(value.numerator < 0n ? -value.numerator : value.numerator, value.denominator);
  return { numerator: value.numerator / divisor, denominator: value.denominator / divisor };
}

function gcd(a: bigint, b: bigint): bigint {
  while (b !== 0n) [a, b] = [b, a % b];
  return a || 1n;
}

export function midpoint(a: Rational | null, b: Rational | null): Rational | null {
  if (!a || !b) return null;
  return reduce({ numerator: a.numerator * b.denominator + b.numerator * a.denominator, denominator: 2n * a.denominator * b.denominator });
}

export function multiply(a: Rational | null, b: Rational | null): Rational | null {
  return a && b ? reduce({ numerator: a.numerator * b.numerator, denominator: a.denominator * b.denominator }) : null;
}

export type UsdcMidpointInput = Readonly<{
  buyInput: bigint;
  buyFame: bigint;
  sellOutput: bigint;
  sellFame: bigint;
  fameDecimals: number;
  buyCapturedAt: string;
  sellCapturedAt: string;
  buyBlockNumber?: bigint;
  sellBlockNumber?: bigint;
}>;

/** R27's coherent USDC/FAME reference price. */
export function validatedUsdcMidpoint(input: UsdcMidpointInput): Rational | null {
  const buy = ratio(input.buyInput, 6, input.buyFame, input.fameDecimals);
  const sell = ratio(input.sellOutput, 6, input.sellFame, input.fameDecimals);
  const buyAt = Date.parse(input.buyCapturedAt);
  const sellAt = Date.parse(input.sellCapturedAt);
  if (
    !buy || !sell ||
    !Number.isFinite(buyAt) || !Number.isFinite(sellAt) ||
    Math.abs(buyAt - sellAt) > 300_000 ||
    input.buyBlockNumber === undefined || input.sellBlockNumber === undefined ||
    (input.buyBlockNumber > input.sellBlockNumber
      ? input.buyBlockNumber - input.sellBlockNumber
      : input.sellBlockNumber - input.buyBlockNumber) > 120n ||
    (spreadBps(buy, sell) ?? 201n) > 200n
  ) return null;
  return midpoint(buy, sell);
}

/** Absolute spread, in basis points, without float conversion. */
export function spreadBps(a: Rational | null, b: Rational | null): bigint | null {
  if (!a || !b || a.numerator <= 0n || b.numerator <= 0n) return null;
  const left = a.numerator * b.denominator;
  const right = b.numerator * a.denominator;
  const difference = left > right ? left - right : right - left;
  const midpointNumerator = left + right;
  return (difference * 20_000n) / midpointNumerator;
}

export function marketFreshness(capturedAt: string, now = Date.now()): Freshness {
  const capturedMs = Date.parse(capturedAt);
  if (!Number.isFinite(capturedMs) || capturedMs > now) return "unavailable";
  const ageMs = now - capturedMs;
  if (ageMs < 300_000) return "fresh";
  if (ageMs <= 1_800_000) return "stale";
  return "unavailable";
}

export function toJsonRational(value: Rational | null) {
  return value
    ? { numerator: value.numerator.toString(), denominator: value.denominator.toString() }
    : null;
}
