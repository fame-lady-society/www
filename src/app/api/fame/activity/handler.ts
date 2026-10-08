import { activitySchema } from "@/features/fame-chart/activity";
import {
  boundedJson,
  HistoryError,
  parseHistoryQuery,
} from "@/features/fame-chart/server/historyClient";

export async function activityResponse(
  request: Request,
  options: {
    baseUrl?: string;
    token?: string;
    fetcher?: typeof fetch;
  },
) {
  try {
    const params = new URL(request.url).searchParams;
    for (const key of params.keys()) {
      if (
        !["currency", "from", "to", "cursor"].includes(key) ||
        params.getAll(key).length !== 1
      )
        throw new HistoryError("invalid-query", 400);
    }
    const cursor = params.get("cursor");
    if (cursor !== null && !/^[A-Za-z0-9_-]{1,1500}$/.test(cursor))
      throw new HistoryError("invalid-query", 400);
    params.delete("cursor");
    const bounds = parseHistoryQuery(params);
    if (
      options.baseUrl !== "https://api.fame.support" &&
      options.baseUrl !== "https://api.fame.support/"
    )
      throw new HistoryError("history-unavailable", 503);
    if (!options.token) throw new HistoryError("history-unavailable", 503);
    const url = new URL("/fame/history", options.baseUrl);
    url.search = new URLSearchParams({
      view: "activity",
      currency: bounds.currency,
      from: String(bounds.from),
      to: String(bounds.to),
      resolution: "300",
      limit: "50",
      ...(cursor ? { cursor } : {}),
    }).toString();
    const response = await (options.fetcher ?? fetch)(url, {
      headers: {
        Authorization: `Bearer ${options.token}`,
        Accept: "application/json",
      },
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(10_000)]),
      redirect: "error",
      cache: "no-store",
    });
    if (!response.ok) {
      const body = await boundedJson(response, 256 * 1024);
      if (
        response.status === 409 &&
        (body as { error?: string })?.error === "cursor-reset-required"
      )
        throw new HistoryError("cursor-reset-required", 409);
      throw new HistoryError("history-unavailable", 502);
    }
    const page = activitySchema.parse(await boundedJson(response, 256 * 1024));
    if (
      page.currency !== bounds.currency ||
      page.from !== bounds.from ||
      page.to !== bounds.to
    )
      throw new Error("Activity response mismatch");
    return Response.json(page, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const failure =
      error instanceof HistoryError
        ? error
        : new HistoryError("history-unavailable", 502);
    return Response.json(
      { error: failure.code },
      { status: failure.status, headers: { "Cache-Control": "no-store" } },
    );
  }
}
