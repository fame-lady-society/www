import { FAME, NATIVE_ETH, USDC, WETH, tokenForAddress, type FameSwapToken } from "../tokens";

export type FameSwapTradeMode = "buy" | "sell";

export interface FameSwapTradeModel {
  mode: FameSwapTradeMode;
  asset: FameSwapToken;
}

export interface FameSwapTradePair {
  tokenIn: FameSwapToken;
  tokenOut: FameSwapToken;
  inputToken: FameSwapToken;
  outputToken: FameSwapToken;
  inputLabel: string;
  outputLabel: string;
}

export const FAME_SWAP_OPPOSITE_ASSETS = [USDC, WETH, NATIVE_ETH]
  .map((address) => tokenForAddress(address))
  .filter((token): token is FameSwapToken => Boolean(token));

export function defaultFameSwapTrade(): FameSwapTradeModel {
  const usdc = tokenForAddress(USDC);
  if (!usdc) throw new Error("USDC token config is missing.");
  return {
    mode: "buy",
    asset: usdc,
  };
}

export function fameToken(): FameSwapToken {
  const fame = tokenForAddress(FAME);
  if (!fame) throw new Error("FAME token config is missing.");
  return fame;
}

export function deriveFameSwapPair(trade: FameSwapTradeModel): FameSwapTradePair {
  const fame = fameToken();

  if (trade.mode === "buy") {
    return {
      tokenIn: trade.asset,
      tokenOut: fame,
      inputToken: trade.asset,
      outputToken: fame,
      inputLabel: `Pay ${trade.asset.symbol}`,
      outputLabel: "Receive FAME",
    };
  }

  return {
    tokenIn: fame,
    tokenOut: trade.asset,
    inputToken: fame,
    outputToken: trade.asset,
    inputLabel: "Sell FAME",
    outputLabel: `Receive ${trade.asset.symbol}`,
  };
}

export function flipFameSwapMode(trade: FameSwapTradeModel): FameSwapTradeModel {
  return {
    ...trade,
    mode: trade.mode === "buy" ? "sell" : "buy",
  };
}

export function isFameAnchoredPair(
  tokenIn: FameSwapToken,
  tokenOut: FameSwapToken,
): boolean {
  const fameAddress = FAME.toLowerCase();
  const inIsFame = tokenIn.address.toLowerCase() === fameAddress;
  const outIsFame = tokenOut.address.toLowerCase() === fameAddress;
  return inIsFame !== outIsFame;
}

export function tradeModeForPair(
  tokenIn: FameSwapToken,
  tokenOut: FameSwapToken,
): FameSwapTradeModel | null {
  if (!isFameAnchoredPair(tokenIn, tokenOut)) return null;

  if (tokenOut.address.toLowerCase() === FAME.toLowerCase()) {
    return {
      mode: "buy",
      asset: tokenIn,
    };
  }

  return {
    mode: "sell",
    asset: tokenOut,
  };
}
