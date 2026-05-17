export type RpcUrls = [string, ...string[]];

function isRpcUrls(value: unknown): value is RpcUrls {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (rpc): rpc is string => typeof rpc === "string" && rpc.trim().length > 0,
    )
  );
}

export function parseRpcUrls(
  value: string | undefined,
  envName: string,
): RpcUrls {
  if (!value?.trim()) {
    throw new Error(`${envName} must be set to a JSON array of RPC URLs.`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch (error) {
    throw new Error(`${envName} must be valid JSON.`, { cause: error });
  }

  if (!isRpcUrls(parsed)) {
    throw new Error(`${envName} must be a non-empty JSON array of RPC URLs.`);
  }

  return parsed;
}
