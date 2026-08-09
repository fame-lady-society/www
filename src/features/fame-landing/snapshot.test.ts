import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import fixture from "./fixtures/fame-landing-defi-snapshot-v1.json";
import {
  FAME_LANDING_CONSUMER_REVALIDATE_SECONDS,
  parseFameLandingSnapshot,
  readFameLandingSnapshot,
} from "./snapshot";

function copyFixture(): Record<string, unknown> {
  return structuredClone(fixture) as Record<string, unknown>;
}

describe("Society Bots FAME landing snapshot consumer", () => {
  it("strictly parses the producer fixture before the five-minute boundary", () => {
    const snapshot = parseFameLandingSnapshot(
      copyFixture(),
      Date.parse("2026-08-09T12:04:59.999Z"),
    );

    assert.equal(snapshot.provenance.safeBlockNumber, 45_884_844);
    assert.equal(snapshot.fields.marketplace.status, "available");
    assert.equal(snapshot.fields.liquidity.status, "available");
    assert.equal(snapshot.fields.liquidity.value.counterAssets.length, 4);
  });

  it("accepts an allowlisted unavailable leaf without discarding its snapshot", () => {
    const input = copyFixture();
    const fields = input.fields as Record<string, unknown>;
    const quotes = fields.quotes as Record<string, unknown>;
    quotes.defiBuyUsdc = { status: "unavailable", reason: "no-safe-route" };

    const snapshot = parseFameLandingSnapshot(
      input,
      Date.parse("2026-08-09T12:01:00.000Z"),
    );

    assert.deepEqual(snapshot.fields.quotes.defiBuyUsdc, {
      status: "unavailable",
      reason: "no-safe-route",
    });
    assert.equal(snapshot.fields.quotes.defiBuyEth.status, "available");
  });

  it("rejects stale, malformed, and authority-mismatched documents", () => {
    assert.throws(() =>
      parseFameLandingSnapshot(
        copyFixture(),
        Date.parse("2026-08-09T12:05:00.000Z"),
      ),
    );

    const extraKey = copyFixture();
    extraKey.extra = true;
    assert.throws(() =>
      parseFameLandingSnapshot(
        extraKey,
        Date.parse("2026-08-09T12:01:00.000Z"),
      ),
    );

    const wrongAuthority = copyFixture();
    (wrongAuthority.provenance as Record<string, unknown>).sourceRegistryId =
      "wrong-registry";
    assert.throws(() =>
      parseFameLandingSnapshot(
        wrongAuthority,
        Date.parse("2026-08-09T12:01:00.000Z"),
      ),
    );

    const malformedAmount = copyFixture();
    const malformedFields = malformedAmount.fields as Record<string, unknown>;
    const marketplace = malformedFields.marketplace as Record<string, unknown>;
    (marketplace.value as Record<string, unknown>).unit = "01";
    assert.throws(() =>
      parseFameLandingSnapshot(
        malformedAmount,
        Date.parse("2026-08-09T12:01:00.000Z"),
      ),
    );
  });

  it("accepts snapshots exactly at the 30-second future tolerance and rejects the next millisecond", () => {
    assert.doesNotThrow(() =>
      parseFameLandingSnapshot(
        copyFixture(),
        Date.parse("2026-08-09T11:59:30.000Z"),
      ),
    );
    assert.throws(() =>
      parseFameLandingSnapshot(
        copyFixture(),
        Date.parse("2026-08-09T11:59:29.999Z"),
      ),
    );
  });

  it("rejects route mutation, duplicate liquidity assets, and impossible leaf states", () => {
    const wrongRoute = copyFixture();
    const routeFields = wrongRoute.fields as Record<string, unknown>;
    const routeQuotes = routeFields.quotes as Record<string, unknown>;
    const defiBuyEth = routeQuotes.defiBuyEth as Record<string, unknown>;
    (defiBuyEth.value as Record<string, unknown>).routeId = "invented-route";
    assert.throws(() =>
      parseFameLandingSnapshot(
        wrongRoute,
        Date.parse("2026-08-09T12:01:00.000Z"),
      ),
    );

    const duplicateAsset = copyFixture();
    const liquidityFields = duplicateAsset.fields as Record<string, unknown>;
    const liquidity = liquidityFields.liquidity as Record<string, unknown>;
    const liquidityValue = liquidity.value as Record<string, unknown>;
    const assets = liquidityValue.counterAssets as unknown[];
    assets[1] = structuredClone(assets[0]);
    assert.throws(() =>
      parseFameLandingSnapshot(
        duplicateAsset,
        Date.parse("2026-08-09T12:01:00.000Z"),
      ),
    );

    const impossibleLeaf = copyFixture();
    const impossibleFields = impossibleLeaf.fields as Record<string, unknown>;
    const impossibleQuotes = impossibleFields.quotes as Record<string, unknown>;
    impossibleQuotes.defiBuyUsdc = {
      status: "unavailable",
      reason: "captured-state-missing",
    };
    assert.throws(() =>
      parseFameLandingSnapshot(
        impossibleLeaf,
        Date.parse("2026-08-09T12:01:00.000Z"),
      ),
    );
  });

  it("uses only the anonymous fixed endpoint with 30-second revalidation", async () => {
    const requests: Array<{
      url: string;
      init: RequestInit & { next?: unknown };
    }> = [];
    const result = await readFameLandingSnapshot({
      baseUrl: "https://society.example/prod/",
      now: Date.parse("2026-08-09T12:01:00.000Z"),
      fetcher: async (url, init) => {
        requests.push({ url, init });
        return new Response(JSON.stringify(fixture), { status: 200 });
      },
    });

    assert.equal(result.status, "available");
    assert.equal(FAME_LANDING_CONSUMER_REVALIDATE_SECONDS, 30);
    assert.equal(requests.length, 1);
    assert.equal(
      requests[0].url,
      "https://society.example/prod/fame/landing-defi-snapshot",
    );
    assert.equal(requests[0].init.method, "GET");
    assert.deepEqual(requests[0].init.next, { revalidate: 30 });
    assert.equal(requests[0].init.headers, undefined);
    assert.ok(requests[0].init.signal instanceof AbortSignal);
  });

  it("fails the whole read closed on transport and parsing failures", async () => {
    let requests = 0;
    const unavailable = await readFameLandingSnapshot({
      baseUrl: "https://society.example",
      fetcher: async () => {
        requests += 1;
        return new Response('{"error":"snapshot-unavailable"}', {
          status: 503,
          headers: { "Cache-Control": "no-store" },
        });
      },
    });
    assert.deepEqual(unavailable, { status: "unavailable" });
    assert.equal(requests, 1);

    const malformed = await readFameLandingSnapshot({
      baseUrl: "https://society.example",
      fetcher: async () => new Response("{}", { status: 200 }),
    });
    assert.deepEqual(malformed, { status: "unavailable" });
  });

  it("fails the whole read closed when the bounded request aborts", async () => {
    const originalTimeout = Object.getOwnPropertyDescriptor(
      AbortSignal,
      "timeout",
    );
    assert.ok(originalTimeout);
    const controller = new AbortController();
    let signalWasPassed = false;
    let abortWasObserved = false;
    Object.defineProperty(AbortSignal, "timeout", {
      configurable: true,
      value: () => {
        queueMicrotask(() => controller.abort(new Error("request timed out")));
        return controller.signal;
      },
    });

    try {
      const result = await readFameLandingSnapshot({
        baseUrl: "https://society.example",
        fetcher: async (_url, init) => {
          if (init.signal !== controller.signal) {
            throw new Error("expected the bounded abort signal");
          }
          signalWasPassed = true;
          await new Promise<never>((_resolve, reject) => {
            init.signal?.addEventListener(
              "abort",
              () => {
                abortWasObserved = true;
                reject(init.signal?.reason);
              },
              { once: true },
            );
          });
          throw new Error("unreachable");
        },
      });

      assert.deepEqual(result, { status: "unavailable" });
      assert.equal(signalWasPassed, true);
      assert.equal(abortWasObserved, true);
    } finally {
      Object.defineProperty(AbortSignal, "timeout", {
        ...originalTimeout,
      });
    }
  });

  it("rejects unsafe base URL boundaries before calling the fetcher", async () => {
    const baseUrls = [
      "https://user:password@society.example",
      "https://society.example?preview=true",
      "https://society.example#preview",
      "https://society.example/fame/pool-state",
      "https://society.example/fame/pool-quotes/",
      "https://society.example/fame/landing-defi-snapshot",
    ];

    for (const baseUrl of baseUrls) {
      let requests = 0;
      const result = await readFameLandingSnapshot({
        baseUrl,
        fetcher: async () => {
          requests += 1;
          return new Response();
        },
      });
      assert.deepEqual(result, { status: "unavailable" }, baseUrl);
      assert.equal(requests, 0, baseUrl);
    }

    let requests = 0;
    const result = await readFameLandingSnapshot({
      baseUrl: "http://society.example",
      fetcher: async () => {
        requests += 1;
        return new Response();
      },
    });
    assert.deepEqual(result, { status: "unavailable" });
    assert.equal(requests, 0);
  });

  it("contains no homepage RPC, marketplace-read, or live-quote fallback imports", () => {
    const sources = [
      "src/features/fame-landing/snapshot.ts",
      "src/features/fame-landing/pricePresentation.ts",
      "src/app/fame/page.tsx",
      "src/app/api/fame/market-prices/route.ts",
    ].map((path) => readFileSync(path, "utf8").toLowerCase());

    for (const source of sources) {
      assert.doesNotMatch(source, /base-client|fame-market\/reads/);
      assert.doesNotMatch(
        source,
        /createproductionfamequotedependencies|quotefameexact|readfameliquidity/,
      );
    }
  });
});
