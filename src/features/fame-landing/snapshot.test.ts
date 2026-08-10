import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import fixture from "./fixtures/fame-landing-defi-snapshot-v1.json";
import {
  createFameLandingSnapshotReader,
  FAME_LANDING_CONSUMER_REVALIDATE_SECONDS,
  FAME_LANDING_SNAPSHOT_BASE_URL,
  parseFameLandingSnapshot,
} from "./snapshot";

function copyFixture(): Record<string, unknown> {
  return structuredClone(fixture) as Record<string, unknown>;
}

function fixtureAt(capturedAt: string, safeBlockNumber: number) {
  const value = copyFixture();
  const provenance = value.provenance as Record<string, unknown>;
  provenance.safeBlockNumber = safeBlockNumber;
  provenance.capturedAt = capturedAt;
  provenance.snapshotId = `${provenance.schemaVersion ?? value.schemaVersion}:${safeBlockNumber.toString()}:${String(provenance.safeBlockHash)}:${capturedAt}`;
  return value;
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
    let currentTime = Date.parse("2026-08-09T12:01:00.000Z");
    const requests: Array<{
      url: string;
      init: RequestInit & { next?: unknown };
    }> = [];
    const readSnapshot = createFameLandingSnapshotReader({
      clock: () => currentTime,
      fetcher: async (url, init) => {
        requests.push({ url, init });
        return new Response(JSON.stringify(fixture), { status: 200 });
      },
    });
    const first = await readSnapshot();
    const cached = await readSnapshot();
    currentTime += FAME_LANDING_CONSUMER_REVALIDATE_SECONDS * 1_000;
    const revalidated = await readSnapshot();

    assert.equal(first.status, "available");
    assert.equal(cached.status, "available");
    assert.equal(revalidated.status, "available");
    assert.equal(FAME_LANDING_CONSUMER_REVALIDATE_SECONDS, 30);
    assert.equal(FAME_LANDING_SNAPSHOT_BASE_URL, "https://fame.support");
    assert.equal(requests.length, 2);
    assert.equal(
      requests[0].url,
      "https://fame.support/fame/landing-defi-snapshot",
    );
    assert.equal(requests[0].init.method, "GET");
    assert.deepEqual(requests[0].init.next, { revalidate: 0 });
    assert.equal(requests[0].init.headers, undefined);
    assert.ok(requests[0].init.signal instanceof AbortSignal);
  });

  it("foreground-refreshes an expired snapshot instead of returning it once", async () => {
    let currentTime = Date.parse("2026-08-09T12:01:00.000Z");
    let requests = 0;
    const refreshedFixture = fixtureAt("2026-08-09T12:06:00.000Z", 45_885_000);
    const readSnapshot = createFameLandingSnapshotReader({
      clock: () => currentTime,
      fetcher: async () => {
        requests += 1;
        return Response.json(requests === 1 ? fixture : refreshedFixture);
      },
    });

    const initial = await readSnapshot();
    currentTime = Date.parse("2026-08-09T12:06:00.000Z");
    const afterExpiry = await readSnapshot();

    assert.equal(initial.status, "available");
    assert.equal(afterExpiry.status, "available");
    assert.equal(requests, 2);
    if (afterExpiry.status === "available") {
      assert.equal(afterExpiry.snapshot.provenance.safeBlockNumber, 45_885_000);
      assert.equal(
        afterExpiry.snapshot.provenance.capturedAt,
        "2026-08-09T12:06:00.000Z",
      );
    }
  });

  it("fails the whole read closed on transport and parsing failures", async () => {
    let requests = 0;
    const readUnavailable = createFameLandingSnapshotReader({
      baseUrl: "https://society.example",
      fetcher: async () => {
        requests += 1;
        return new Response('{"error":"snapshot-unavailable"}', {
          status: 503,
          headers: { "Cache-Control": "no-store" },
        });
      },
    });
    const unavailable = await readUnavailable();
    assert.deepEqual(unavailable, { status: "unavailable" });
    assert.equal(requests, 1);

    const readMalformed = createFameLandingSnapshotReader({
      baseUrl: "https://society.example",
      fetcher: async () => new Response("{}", { status: 200 }),
    });
    const malformed = await readMalformed();
    assert.deepEqual(malformed, { status: "unavailable" });
  });

  it("does not cache an unavailable response", async () => {
    let requests = 0;
    const readSnapshot = createFameLandingSnapshotReader({
      clock: () => Date.parse("2026-08-09T12:01:00.000Z"),
      fetcher: async () => {
        requests += 1;
        return requests === 1
          ? new Response('{"error":"snapshot-unavailable"}', { status: 503 })
          : Response.json(fixture);
      },
    });

    assert.deepEqual(await readSnapshot(), { status: "unavailable" });
    assert.equal((await readSnapshot()).status, "available");
    assert.equal(requests, 2);
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
      const readSnapshot = createFameLandingSnapshotReader({
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
      const result = await readSnapshot();

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
      const readSnapshot = createFameLandingSnapshotReader({
        baseUrl,
        fetcher: async () => {
          requests += 1;
          return new Response();
        },
      });
      const result = await readSnapshot();
      assert.deepEqual(result, { status: "unavailable" }, baseUrl);
      assert.equal(requests, 0, baseUrl);
    }

    let requests = 0;
    const readSnapshot = createFameLandingSnapshotReader({
      baseUrl: "http://society.example",
      fetcher: async () => {
        requests += 1;
        return new Response();
      },
    });
    const result = await readSnapshot();
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
