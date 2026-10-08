import { createHash } from "node:crypto";
import {
  HistoryError,
  parseHistoryQuery,
  readHistory,
} from "@/features/fame-chart/server/historyClient";

export async function historyResponse(
  request: Request,
  options: Parameters<typeof readHistory>[1],
) {
  try {
    const bounds = parseHistoryQuery(new URL(request.url).searchParams);
    const history = await readHistory(bounds, {
      ...options,
      signal: request.signal,
      ifNoneMatch: request.headers.get("if-none-match") ?? undefined,
    });
    if (history === null)
      return new Response(null, {
        status: 304,
        headers: {
          "Cache-Control": "public, max-age=0, s-maxage=30",
          ETag: request.headers.get("if-none-match")!,
        },
      });
    const etag =
      history.mode === "snapshot"
        ? `W/"${createHash("sha256")
            .update(
              JSON.stringify([
                history.publicationId,
                history.currency,
                history.series,
                history.from,
                history.to,
              ]),
            )
            .digest("hex")}"`
        : undefined;
    return Response.json(history, {
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=30",
        ...(etag ? { ETag: etag } : {}),
      },
    });
  } catch (error) {
    const failure =
      error instanceof HistoryError
        ? error
        : new HistoryError("history-unavailable", 502);
    if (failure.status >= 500) console.warn("fame-history", failure.diagnostic);
    return Response.json(
      { error: failure.code },
      { status: failure.status, headers: { "Cache-Control": "no-store" } },
    );
  }
}
