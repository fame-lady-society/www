import { base } from "viem/chains";

export function fameForkModeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_FAME_FORK_MODE === "1";
}

function requireLoopbackRpcUrl(
  name: string,
  value: string | undefined,
): string {
  if (!value) throw new Error(`${name} is required in FAME fork mode.`);
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(
      `${name} must be a valid loopback RPC URL in FAME fork mode.`,
    );
  }
  if (
    !["localhost", "127.0.0.1", "::1", "[::1]"].includes(
      url.hostname.toLowerCase(),
    ) ||
    !["http:", "https:"].includes(url.protocol)
  ) {
    throw new Error(
      `${name} must be a loopback HTTP RPC URL in FAME fork mode.`,
    );
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error(
      `${name} must not include credentials, query parameters or fragments in FAME fork mode.`,
    );
  }
  return value;
}

// Public browser configuration has one deliberate exception: a validated local
// Anvil endpoint in the explicit fork harness. Paid RPC URLs are never accepted.
export function baseRpcUrls(): readonly string[] {
  return fameForkModeEnabled()
    ? [
        requireLoopbackRpcUrl(
          "NEXT_PUBLIC_FAME_FORK_RPC_URL",
          process.env.NEXT_PUBLIC_FAME_FORK_RPC_URL,
        ),
      ]
    : base.rpcUrls.default.http;
}

export function baseServerRpcUrl(): string | undefined {
  if (!fameForkModeEnabled())
    return process.env.BASE_RPC_URL?.trim() || undefined;
  const server = requireLoopbackRpcUrl(
    "BASE_RPC_URL",
    process.env.BASE_RPC_URL,
  );
  const browser = baseRpcUrls()[0];
  if (new URL(server).href !== new URL(browser).href) {
    throw new Error(
      "BASE_RPC_URL and NEXT_PUBLIC_FAME_FORK_RPC_URL must match in FAME fork mode.",
    );
  }
  return server;
}
