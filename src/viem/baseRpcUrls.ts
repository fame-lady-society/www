import { base } from "viem/chains";

const PUBLIC_BASE_RPC_URL = base.rpcUrls.default.http[0];

export function fameForkModeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_FAME_FORK_MODE === "1";
}

function requireLoopbackRpcUrl(
  name: "BASE_RPC_URL" | "NEXT_PUBLIC_BASE_RPC_URL_1",
  value: string | undefined,
): string {
  if (!value) {
    throw new Error(`${name} is required in FAME fork mode.`);
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(
      `${name} must be a valid loopback RPC URL in FAME fork mode.`,
    );
  }

  const hostname = url.hostname.toLowerCase();
  const loopback =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]";
  if (!loopback || (url.protocol !== "http:" && url.protocol !== "https:")) {
    throw new Error(
      `${name} must be a loopback HTTP RPC URL in FAME fork mode.`,
    );
  }
  if (url.username || url.password) {
    throw new Error(`${name} must not include credentials in FAME fork mode.`);
  }

  return value;
}

export function baseRpcUrls() {
  if (fameForkModeEnabled()) {
    if (process.env.NEXT_PUBLIC_BASE_RPC_URL_2) {
      throw new Error(
        "NEXT_PUBLIC_BASE_RPC_URL_2 must be unset in FAME fork mode.",
      );
    }
    return [
      requireLoopbackRpcUrl(
        "NEXT_PUBLIC_BASE_RPC_URL_1",
        process.env.NEXT_PUBLIC_BASE_RPC_URL_1,
      ),
    ];
  }

  const urls = [
    process.env.NEXT_PUBLIC_BASE_RPC_URL_1,
    process.env.NEXT_PUBLIC_BASE_RPC_URL_2,
    PUBLIC_BASE_RPC_URL,
  ].filter((url): url is string => Boolean(url));

  return [...new Set(urls)];
}

export function baseServerRpcUrl(): string | undefined {
  if (fameForkModeEnabled()) {
    const serverUrl = requireLoopbackRpcUrl(
      "BASE_RPC_URL",
      process.env.BASE_RPC_URL,
    );
    const browserUrl = requireLoopbackRpcUrl(
      "NEXT_PUBLIC_BASE_RPC_URL_1",
      process.env.NEXT_PUBLIC_BASE_RPC_URL_1,
    );
    if (new URL(serverUrl).href !== new URL(browserUrl).href) {
      throw new Error(
        "BASE_RPC_URL and NEXT_PUBLIC_BASE_RPC_URL_1 must match in FAME fork mode.",
      );
    }
    return serverUrl;
  }
  return process.env.BASE_RPC_URL ?? process.env.NEXT_PUBLIC_BASE_RPC_URL_1;
}
