export const MARKET_CAP_UNITS = ["K", "M", "B"] as const;

export type MarketCapUnit = (typeof MARKET_CAP_UNITS)[number];

export type MarketCapInputPlaceholder = Readonly<{
  value: string;
  unit: MarketCapUnit;
}>;

export type DefiEthUsdcConversion = Readonly<{
  buy: Readonly<{
    usdc: string;
    eth: string;
  }>;
  sell: Readonly<{
    usdc: string;
    eth: string;
  }>;
}>;

export type MarketCapCalculatorData = Readonly<{
  // USDC base units, kept as a string so this remains serializable across RSC.
  currentMarketCapUsdc: string | null;
  currentMarketCapInput: MarketCapInputPlaceholder | null;
  conversion: DefiEthUsdcConversion | null;
}>;

export type MarketCapCalculation =
  | {
      status: "available";
      marketCapUsdc: bigint;
      societyEthWei: bigint | null;
    }
  | {
      status: "empty" | "invalid";
      message: string;
    };

const USDC_BASE_UNITS = 10n ** 6n;
const ETH_BASE_UNITS = 10n ** 18n;
const SOCIETY_DIVISOR = 888n;
const FAME_DIVISOR = 888_000_000n;
const MARKET_CAP_MULTIPLIERS: Record<MarketCapUnit, bigint> = {
  K: 1_000n,
  M: 1_000_000n,
  B: 1_000_000_000n,
};

function roundDivide(numerator: bigint, denominator: bigint): bigint {
  return (numerator + denominator / 2n) / denominator;
}

function grouped(value: bigint): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatRational(
  numerator: bigint,
  denominator: bigint,
  maximumFractionDigits: number,
): string {
  const scale = 10n ** BigInt(maximumFractionDigits);
  const rounded = roundDivide(numerator * scale, denominator);
  const whole = rounded / scale;
  const fraction = (rounded % scale)
    .toString()
    .padStart(maximumFractionDigits, "0")
    .replace(/0+$/u, "");

  return `${grouped(whole)}${fraction ? `.${fraction}` : ""}`;
}

function formatRationalCurrency(
  numerator: bigint,
  denominator: bigint,
  maximumFractionDigits: number,
): string {
  const scale = 10n ** BigInt(maximumFractionDigits);
  const rounded = roundDivide(numerator * scale, denominator);
  if (rounded === 0n && numerator > 0n) {
    return `<$0.${"0".repeat(Math.max(0, maximumFractionDigits - 1))}1`;
  }

  return `$${formatRational(numerator, denominator, maximumFractionDigits)}`;
}

function parseMarketCapInput(
  input: string,
  unit: MarketCapUnit,
): bigint | null {
  const match = /^(\d*)(?:\.(\d*))?$/u.exec(input.trim());
  if (!match || (match[1] === "" && match[2] === "")) return null;

  const whole = match[1] || "0";
  const fraction = match[2] || "";
  const digits = BigInt(`${whole}${fraction}` || "0");
  const decimalScale = 10n ** BigInt(fraction.length);
  const numerator = digits * MARKET_CAP_MULTIPLIERS[unit] * USDC_BASE_UNITS;
  const marketCapUsdc = roundDivide(numerator, decimalScale);

  return marketCapUsdc > 0n ? marketCapUsdc : null;
}

export function consumeMarketCapUnitSuffix(
  input: string,
): MarketCapInputPlaceholder | null {
  const match = /^\s*((?:\d+(?:\.\d*)?|\.\d+))\s*([KMB])\s*$/iu.exec(
    input,
  );
  if (!match) return null;

  return {
    value: match[1],
    unit: match[2].toUpperCase() as MarketCapUnit,
  };
}

function midpointEthPerUsdc(
  conversion: DefiEthUsdcConversion,
): { numerator: bigint; denominator: bigint } | null {
  const buyUsdc = BigInt(conversion.buy.usdc);
  const buyEth = BigInt(conversion.buy.eth);
  const sellUsdc = BigInt(conversion.sell.usdc);
  const sellEth = BigInt(conversion.sell.eth);

  if (buyUsdc <= 0n || buyEth <= 0n || sellUsdc <= 0n || sellEth <= 0n) {
    return null;
  }

  return {
    numerator: buyEth * sellUsdc + sellEth * buyUsdc,
    denominator: 2n * buyUsdc * sellUsdc,
  };
}

export function calculateMarketCap(
  input: string,
  unit: MarketCapUnit,
  data: MarketCapCalculatorData,
): MarketCapCalculation {
  const marketCapUsdc =
    input.trim() === ""
      ? data.currentMarketCapUsdc === null
        ? null
        : BigInt(data.currentMarketCapUsdc)
      : parseMarketCapInput(input, unit);

  if (marketCapUsdc === null) {
    return input.trim() === ""
      ? { status: "empty", message: "Enter a market cap to calculate." }
      : {
          status: "invalid",
          message: "Enter a positive market cap using numbers only.",
        };
  }

  if (marketCapUsdc <= 0n) {
    return {
      status: "invalid",
      message: "Enter a positive market cap using numbers only.",
    };
  }

  const ratio = data.conversion ? midpointEthPerUsdc(data.conversion) : null;
  const societyEthWei = ratio
    ? roundDivide(
        marketCapUsdc * ratio.numerator,
        SOCIETY_DIVISOR * ratio.denominator,
      )
    : null;

  return {
    status: "available",
    marketCapUsdc,
    societyEthWei,
  };
}

export function formatSocietyUsdc(marketCapUsdc: bigint): string {
  return formatRationalCurrency(
    marketCapUsdc,
    SOCIETY_DIVISOR * USDC_BASE_UNITS,
    2,
  );
}

export function formatSocietyEth(wei: bigint): string {
  return `${formatRational(wei, ETH_BASE_UNITS, 3)} Ξ`;
}

export function formatFameUsdc(marketCapUsdc: bigint): string {
  return formatRationalCurrency(
    marketCapUsdc,
    FAME_DIVISOR * USDC_BASE_UNITS,
    6,
  );
}

export function marketCapInputPlaceholder(
  marketCapUsdc: bigint,
): MarketCapInputPlaceholder {
  const candidates: ReadonlyArray<readonly [MarketCapUnit, bigint]> = [
    ["B", MARKET_CAP_MULTIPLIERS.B * USDC_BASE_UNITS],
    ["M", MARKET_CAP_MULTIPLIERS.M * USDC_BASE_UNITS],
    ["K", MARKET_CAP_MULTIPLIERS.K * USDC_BASE_UNITS],
  ];
  const [unit, divisor] =
    candidates.find(
      ([, candidateDivisor]) => marketCapUsdc >= candidateDivisor,
    ) ?? candidates[candidates.length - 1];

  return {
    value: formatRational(marketCapUsdc, divisor, 1),
    unit,
  };
}
