import assert from "node:assert/strict";
import { describe, it } from "node:test";
import fixture from "@/features/fame-chart/fixtures/sampled-usdc.json";
import {
  boundedJson,
  parseHistoryQuery,
  readHistory,
} from "@/features/fame-chart/server/historyClient";
import { historyResponse } from "./handler";

const bounds = {
  from: fixture.from,
  to: fixture.to,
  currency: "USDC" as const,
  series: "market",
};
const config = {
  baseUrl: "https://api.fame.support",
  token: "server-test-token",
};
const request = (query = `from=${bounds.from}&to=${bounds.to}&currency=USDC`) =>
  new Request(`http://localhost/api/fame/history?${query}`, {
    headers: { Authorization: "Bearer incoming-must-not-be-forwarded" },
  });
const fetcher =
  (body: unknown, status = 200): typeof fetch =>
  async () =>
    Response.json(body, { status });

describe("FAME history proxy", () => {
  it("forwards only server credentials to the fixed upstream and caches reviewed public data briefly", async () => {
    const response = await historyResponse(request(), {
      ...config,
      fetcher: async (url, init) => {
        assert.equal(new URL(String(url)).origin, "https://api.fame.support");
        assert.equal(new URL(String(url)).searchParams.get("view"), "chart");
        assert.equal(
          new Headers(init?.headers).get("authorization"),
          "Bearer server-test-token",
        );
        assert.equal(new URL(String(url)).searchParams.get("currency"), "USDC");
        assert.equal(init?.redirect, "error");
        assert.equal(init?.cache, "no-store");
        return Response.json({ ...fixture, internal: "must-not-leak" });
      },
    });
    assert.equal(response.status, 200);
    assert.equal(
      response.headers.get("cache-control"),
      "public, max-age=0, s-maxage=30",
    );
    const text = await response.text();
    assert(!text.includes(config.token));
    assert(!text.includes("must-not-leak"));
  });
  it("rejects invalid bounds, duplicate/unknown fields, and future windows before fetching", async () => {
    for (const query of [
      "",
      `from=${bounds.from}&to=${bounds.to}&currency=USD`,
      `from=${bounds.from}&to=${bounds.to}&currency=ETH&currency=USDC`,
      `from=${bounds.from}&to=${bounds.to}`,

      `from=${bounds.from}&to=${bounds.to}&url=https://example.com`,
      `from=${bounds.from}&from=${bounds.from}&to=${bounds.to}&currency=USDC`,
      `from=${bounds.from + 1}&to=${bounds.to}&currency=USDC`,
      `from=${bounds.from}&to=${bounds.to + 300}`,
      `from=${bounds.to}&to=${bounds.from}`,
      "from=NaN&to=Infinity",
    ]) {
      const response = await historyResponse(request(query), {
        ...config,
        fetcher: async () => {
          throw new Error("must not fetch");
        },
      });
      assert.equal(response.status, 400, query);
      assert.equal(response.headers.get("cache-control"), "no-store");
    }
    assert.throws(() =>
      parseHistoryQuery(
        new URLSearchParams(
          `from=${bounds.from}&to=${bounds.to}&currency=USDC`,
        ),
        bounds.from * 1000,
      ),
    );
  });
  it("rejects unsafe configuration without sending credentials", async () => {
    for (const baseUrl of [
      undefined,
      "http://api.fame.support",
      "https://evil.example",
      "https://api.fame.support.evil.example",
      "https://user:pass@api.fame.support",
      "https://api.fame.support/fame/pool-quotes",
    ]) {
      await assert.rejects(
        readHistory(bounds, {
          ...config,
          baseUrl,
          fetcher: async () => {
            throw new Error("must not fetch");
          },
        }),
        /history-unavailable/,
      );
    }
  });
  it("preserves recognized 503 states; hides upstream auth and raw error bodies", async () => {
    for (const code of [
      "sampled-history-not-ready",
      "history-read-budget-exceeded",
    ]) {
      const response = await historyResponse(request(), {
        ...config,
        fetcher: fetcher({ error: code }, 503),
      });
      assert.equal(response.status, 503);
      assert.deepEqual(await response.json(), { error: code });
      assert.equal(response.headers.get("cache-control"), "no-store");
    }
    for (const status of [401, 403, 500]) {
      const response = await historyResponse(request(), {
        ...config,
        fetcher: fetcher({ error: "private upstream information" }, status),
      });
      assert.deepEqual(await response.json(), { error: "history-unavailable" });
    }
  });
  it("aborts timed-out requests and propagates cancellation", async () => {
    const hanging: typeof fetch = async (_, init) =>
      new Promise<Response>((_, reject) => {
        init!.signal!.addEventListener(
          "abort",
          () => reject(new Error("aborted")),
          { once: true },
        );
      });
    const response = await historyResponse(request(), {
      ...config,
      fetcher: hanging,
      timeoutMs: 5,
    });
    assert.equal(response.status, 504);
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(
      readHistory(bounds, {
        ...config,
        signal: controller.signal,
        fetcher: async (_, init) => {
          assert.equal(init?.signal?.aborted, true);
          throw new Error("aborted");
        },
      }),
    );
  });
  it("bounds response bodies even without Content-Length and rejects bad contracts", async () => {
    await assert.rejects(boundedJson(new Response("123456"), 5), /too large/);
    await assert.rejects(
      boundedJson(
        new Response("{}", { headers: { "content-length": "1000" } }),
        5,
      ),
      /too large/,
    );
    const response = await historyResponse(request(), {
      ...config,
      fetcher: fetcher({ ...fixture, version: "wrong" }),
    });
    assert.equal(response.status, 502);
    assert.equal(response.headers.get("cache-control"), "no-store");
  });
});

it("forwards cursor reset as no-store and revalidates snapshots without parsing an empty body", async () => {
  const reset = await historyResponse(
    request(
      `from=${bounds.from}&to=${bounds.to}&currency=USDC&series=market&cursor=old`,
    ),
    { ...config, fetcher: fetcher({ error: "cursor-reset-required" }, 409) },
  );
  assert.equal(reset.status, 409);
  assert.equal(reset.headers.get("cache-control"), "no-store");
  const req = request();
  req.headers.set("if-none-match", 'W/"test"');
  const cached = await historyResponse(req, {
    ...config,
    fetcher: async (_url, init) => {
      assert.equal(new Headers(init?.headers).get("if-none-match"), 'W/"test"');
      return new Response(null, { status: 304 });
    },
  });
  assert.equal(cached.status, 304);
  assert.equal(await cached.text(), "");
});
