const PUBLIC_BASE_RPC_URL = "https://mainnet.base.org";

export function baseRpcUrls() {
  const urls = [
    process.env.NEXT_PUBLIC_BASE_RPC_URL_1,
    process.env.NEXT_PUBLIC_BASE_RPC_URL_2,
    PUBLIC_BASE_RPC_URL,
  ].filter((url): url is string => Boolean(url));

  return [...new Set(urls)];
}
