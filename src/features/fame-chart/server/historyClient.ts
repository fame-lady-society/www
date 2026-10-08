import { DAY, INTERVAL, parseChart, type HistoryRequest } from "../history";

export class HistoryError extends Error {
  constructor(
    public code:
      | "invalid-query"
      | "sampled-history-not-ready"
      | "history-read-budget-exceeded"
      | "history-unavailable"
      | "cursor-reset-required",
    public status: number,
    public diagnostic: string = code,
  ) {
    super(code);
  }
}

export function parseHistoryQuery(
  params: URLSearchParams,
  now = Date.now(),
): HistoryRequest {
  for (const key of params.keys()) {
    if (
      !["from", "to", "currency", "series", "cursor"].includes(key) ||
      params.getAll(key).length !== 1
    )
      throw new HistoryError("invalid-query", 400);
  }
  const values = ["from", "to"].map((key) => {
    const raw = params.get(key) ?? "";
    const n = Number(raw);
    if (!/^(0|[1-9]\d*)$/.test(raw) || !Number.isSafeInteger(n) || n % INTERVAL)
      throw new HistoryError("invalid-query", 400);
    return n;
  });
  const [from, to] = values;
  if (
    to <= from ||
    to - from > DAY ||
    to > Math.floor(now / 300_000) * INTERVAL
  )
    throw new HistoryError("invalid-query", 400);
  const currency = params.get("currency");
  if (currency !== "ETH" && currency !== "USDC")
    throw new HistoryError("invalid-query", 400);
  const series = params.get("series") ?? "market",
    cursor = params.get("cursor") ?? undefined;
  if (
    !/^[a-z0-9-]{1,100}$/.test(series) ||
    (cursor !== undefined &&
      (cursor.length > 1024 || !/^[A-Za-z0-9_-]+$/.test(cursor)))
  )
    throw new HistoryError("invalid-query", 400);
  return { from, to, currency, series, ...(cursor ? { cursor } : {}) };
}

export async function boundedJson(
  response: Response,
  limit = 2 * 1024 * 1024,
): Promise<unknown> {
  if (Number(response.headers.get("content-length")) > limit) {
    await response.body?.cancel();
    throw new Error("History response too large.");
  }
  if (!response.body) throw new Error("Empty history response.");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > limit) {
        await reader.cancel();
        throw new Error("History response too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.length;
  }
  return JSON.parse(new TextDecoder().decode(body));
}

export async function readHistory(
  bounds: HistoryRequest,
  options: {
    baseUrl: string | undefined;
    token: string | undefined;
    signal?: AbortSignal;
    fetcher?: typeof fetch;
    timeoutMs?: number;
    ifNoneMatch?: string;
  },
) {
  let url: URL;
  try {
    url = new URL(options.baseUrl ?? "");
    if (
      url.origin !== "https://api.fame.support" ||
      !["", "/"].includes(url.pathname) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      !options.token
    )
      throw new Error("Invalid configuration");
  } catch {
    throw new HistoryError("history-unavailable", 503, "configuration");
  }
  url.pathname = "/fame/history";
  url.search = new URLSearchParams({
    view: "chart",
    series: bounds.series,
    ...(bounds.cursor ? { cursor: bounds.cursor } : {}),
    currency: bounds.currency,
    resolution: "300",
    from: String(bounds.from),
    to: String(bounds.to),
  }).toString();
  const controller = new AbortController();
  const abort = () => controller.abort();
  options.signal?.addEventListener("abort", abort, { once: true });
  if (options.signal?.aborted) abort();
  const timer = setTimeout(abort, options.timeoutMs ?? 10_000);
  try {
    const response = await (options.fetcher ?? fetch)(url, {
      headers: {
        Authorization: `Bearer ${options.token}`,
        Accept: "application/json",
        ...(!bounds.cursor && options.ifNoneMatch
          ? { "If-None-Match": options.ifNoneMatch }
          : {}),
      },
      signal: controller.signal,
      redirect: "error",
      cache: "no-store",
    });
    if (response.status === 401 || response.status === 403) {
      await response.body?.cancel();
      throw new HistoryError("history-unavailable", 503, "upstream-auth");
    }
    if (response.status === 304 && options.ifNoneMatch && !bounds.cursor)
      return null;
    const body = await boundedJson(response, 150 * 1024);
    if (
      response.status === 409 &&
      body &&
      typeof body === "object" &&
      "error" in body &&
      body.error === "cursor-reset-required"
    )
      throw new HistoryError("cursor-reset-required", 409);
    if (!response.ok) {
      const code =
        body && typeof body === "object" && "error" in body ? body.error : null;
      if (
        response.status === 503 &&
        (code === "sampled-history-not-ready" ||
          code === "history-read-budget-exceeded")
      )
        throw new HistoryError(code, 503);
      throw new HistoryError("history-unavailable", 502, "upstream-error");
    }
    return parseChart(body, bounds);
  } catch (error) {
    if (error instanceof HistoryError) throw error;
    throw new HistoryError(
      "history-unavailable",
      controller.signal.aborted ? 504 : 502,
      controller.signal.aborted ? "timeout-or-cancelled" : "invalid-response",
    );
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", abort);
  }
}
