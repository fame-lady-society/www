import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { fetchSiwe } from "./siweFetch";

const originalFetch = globalThis.fetch;
const originalWindow = globalThis.window;

afterEach(() => {
  globalThis.fetch = originalFetch;
  Object.assign(globalThis, { window: originalWindow });
});

describe("fetchSiwe", () => {
  it("aborts a request that exceeds its deadline", async () => {
    Object.assign(globalThis, { window: globalThis });
    globalThis.fetch = ((_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () =>
          reject(new DOMException("Aborted", "AbortError")),
        );
      })) as typeof fetch;

    await assert.rejects(
      fetchSiwe("/siwe", {}, 5),
      /SIWE request timed out.*try again/i,
    );
  });

  it("returns successful responses before the deadline", async () => {
    Object.assign(globalThis, { window: globalThis });
    globalThis.fetch = (async () =>
      new Response(null, { status: 204 })) as typeof fetch;

    const response = await fetchSiwe("/siwe", {}, 50);

    assert.equal(response.status, 204);
  });
});
