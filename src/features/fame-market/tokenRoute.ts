export function fameMarketTokenPath(tokenId: number | bigint) {
  return `/fame/market/${tokenId.toString()}`;
}

export function fameMarketTokenFallbackName() {
  return "FAME Society";
}
