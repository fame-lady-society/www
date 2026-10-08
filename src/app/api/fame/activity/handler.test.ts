import { it } from "node:test";
import assert from "node:assert/strict";
import { activityResponse } from "./handler";
const from = 1700000100,
  to = from + 300;
const request = (extra = "") =>
  new Request(
    `http://localhost/api/fame/activity?currency=ETH&from=${from}&to=${to}${extra}`,
  );
const page = {
  version: "fame-activity-v1",
  currency: "ETH",
  from,
  to,
  rows: [],
  nextCursor: null,
  coverage: {
    unavailableBuckets: [],
    partialBuckets: [],
    outsidePublishedWindow: false,
    notYetPublished: false,
  },
};
const options = {
  baseUrl: "https://api.fame.support",
  token: "private-test-token",
};
it("proxies activity with server-only authorization and strips unlisted fields", async () => {
  const response = await activityResponse(request("&cursor=abc"), {
    ...options,
    fetcher: async (url, init) => {
      assert.equal(new URL(String(url)).searchParams.get("view"), "activity");
      assert.equal(new URL(String(url)).searchParams.get("cursor"), "abc");
      assert.equal(
        new Headers(init?.headers).get("Authorization"),
        "Bearer private-test-token",
      );
      assert.equal(init?.redirect, "error");
      return Response.json({ ...page, internal: "secret" });
    },
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), page);
});
it("rejects unsupported input and mismatched responses", async () => {
  assert.equal(
    (await activityResponse(request("&url=evil"), options)).status,
    400,
  );
  assert.equal(
    (
      await activityResponse(request(), {
        ...options,
        baseUrl: "https://evil.example",
      })
    ).status,
    503,
  );
  assert.equal(
    (
      await activityResponse(request(), {
        ...options,
        fetcher: async () => Response.json({ ...page, currency: "USDC" }),
      })
    ).status,
    502,
  );
});
it("preserves cursor reset and sanitizes upstream errors", async () => {
  const fetcher = async () =>
    Response.json({ error: "cursor-reset-required" }, { status: 409 });
  assert.equal(
    (await activityResponse(request(), { ...options, fetcher })).status,
    409,
  );
  const denied = await activityResponse(request(), {
    ...options,
    fetcher: async () => new Response("secret", { status: 403 }),
  });
  assert.deepEqual(await denied.json(), { error: "history-unavailable" });
});
