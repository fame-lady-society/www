import type { Address } from "viem";
import { FAME, NATIVE_ETH, USDC, WETH } from "../../tokens";
import type {
  FameEdgeQuoteRequest,
  FameEdgeQuoteResult,
  FameQuoteAdapter,
} from "./adapters";
import type { FameQuoteContext } from "./quoteContext";

const BASEDFLICK =
  "0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926" as const satisfies Address;
const FRXUSD =
  "0xe5020a6d073a794b6e7f05678707de47986fb0b6" as const satisfies Address;
const ZORA =
  "0x1111111111166b7fe7bd91427724b487980afc69" as const satisfies Address;

export interface DeterministicQuoteProfile {
  poolId: string;
  tokenIn: Address;
  tokenOut: Address;
  rateNumerator: bigint;
  rateDenominator: bigint;
  capacityIn: bigint;
  evidence: string;
}

function key(poolId: string, tokenIn: Address, tokenOut: Address): string {
  return `${poolId}:${tokenIn.toLowerCase()}:${tokenOut.toLowerCase()}`;
}

function profile(
  poolId: string,
  tokenIn: Address,
  tokenOut: Address,
  rateNumerator: bigint,
  rateDenominator: bigint,
  capacityIn: bigint,
): DeterministicQuoteProfile {
  return {
    poolId,
    tokenIn,
    tokenOut,
    rateNumerator,
    rateDenominator,
    capacityIn,
    evidence: "pinned deterministic pool-capacity profile",
  };
}

const DEFAULT_PROFILES: readonly DeterministicQuoteProfile[] = [
  profile("scale-equalizer-weth-fame", WETH, FAME, 50n, 1n, 500_000_000_000_000n),
  profile("scale-equalizer-weth-fame", FAME, WETH, 1n, 50n, 25_000_000_000_000_000n),
  profile("uniswap-v2-fame-direct", WETH, FAME, 45n, 1n, 500_000_000_000_000n),
  profile("uniswap-v2-fame-direct", FAME, WETH, 1n, 45n, 22_500_000_000_000_000n),

  profile("scale-equalizer-usdc-frxusd", USDC, FRXUSD, 1_000_000_000_000n, 1n, 500_000n),
  profile("scale-equalizer-usdc-frxusd", FRXUSD, USDC, 1n, 1_000_000_000_000n, 500_000_000_000_000_000n),
  profile("slipstream-usdc-frxusd", USDC, FRXUSD, 1_000_000_000_000n, 1n, 500_000n),
  profile("slipstream-usdc-frxusd", FRXUSD, USDC, 1n, 1_000_000_000_000n, 500_000_000_000_000_000n),
  profile("scale-equalizer-frxusd-fame", FRXUSD, FAME, 50n, 1n, 1_000_000_000_000_000_000n),
  profile("scale-equalizer-frxusd-fame", FAME, FRXUSD, 1n, 50n, 50_000_000_000_000_000_000n),

  profile("slipstream-basedflick-fame", FAME, BASEDFLICK, 980_100_000_232_613_992n, 31_597_600_141_347_829n, 31_597_600_141_347_829n),
  profile("slipstream-basedflick-fame", BASEDFLICK, FAME, 31_597_600_141_347_829n, 1_000_000_000_000_000_000n, 1_000_000_000_000_000_000_000n),
  profile("uniswap-v4-basedflick-zora", BASEDFLICK, ZORA, 1n, 1n, 1_000_000_000_000_000_000_000n),
  profile("uniswap-v4-basedflick-zora", ZORA, BASEDFLICK, 1n, 1n, 1_000_000_000_000_000_000_000n),
  profile("uniswap-v3-zora-usdc", USDC, ZORA, 73_837_797_098_392_273_783n, 1_000_000n, 1_000_000n),
  profile("uniswap-v3-zora-usdc", ZORA, USDC, 1_000_000n, 73_837_797_098_392_273_783n, 73_837_797_098_392_273_783n),
  profile("uniswap-v3-zora-weth", ZORA, WETH, 1n, 100_000n, 100_000_000_000_000_000_000n),
  profile("uniswap-v4-zora-eth", NATIVE_ETH, ZORA, 170_174_733_551_265_108_370n, 1_000_000_000_000_000n, 1_000_000_000_000_000n),
  profile("uniswap-v4-zora-eth", ZORA, NATIVE_ETH, 1_000_000_000_000_000n, 170_174_733_551_265_108_370n, 170_174_733_551_265_108_370n),
] as const;

export function deterministicQuoteProfiles(): readonly DeterministicQuoteProfile[] {
  return DEFAULT_PROFILES;
}

export function createDeterministicQuoteAdapter(
  profiles: readonly DeterministicQuoteProfile[] = DEFAULT_PROFILES,
): FameQuoteAdapter {
  const profileByKey = new Map(
    profiles.map((entry) => [key(entry.poolId, entry.tokenIn, entry.tokenOut), entry]),
  );

  const quoteContext: FameQuoteContext = {
    source: "deterministic_test",
    profileId: "pinned-capacity-profile",
  };

  return {
    quoteContext,
    quoteEdge(request: FameEdgeQuoteRequest): FameEdgeQuoteResult {
      const entry = profileByKey.get(
        key(request.edge.poolId, request.edge.tokenIn, request.edge.tokenOut),
      );
      if (!entry) {
        return {
          status: "failed",
          reason: "no_quote_evidence",
          message: `No deterministic quote evidence for ${request.edge.poolId}.`,
        };
      }

      if (request.amountIn > entry.capacityIn) {
        return {
          status: "failed",
          reason: "amount_exceeds_capacity",
          message: `${request.edge.poolId} capacity ${entry.capacityIn.toString()} is below requested leg input ${request.amountIn.toString()}.`,
        };
      }

      const amountOut =
        (request.amountIn * entry.rateNumerator) / entry.rateDenominator;
      if (amountOut <= 0n) {
        return {
          status: "failed",
          reason: "zero_output",
          message: `${request.edge.poolId} quoted zero output for this amount.`,
        };
      }

      return {
        status: "quoted",
        amountIn: request.amountIn,
        amountOut,
        capacityIn: entry.capacityIn,
        fee: request.edge.fee,
        evidence: entry.evidence,
        context: request.context ?? quoteContext,
      };
    },
  };
}
