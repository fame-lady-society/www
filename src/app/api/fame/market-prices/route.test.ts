import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import fixture from "@/features/fame-landing/fixtures/fame-landing-defi-snapshot-v1.json";
import { createFameLandingSnapshotReader } from "@/features/fame-landing/snapshot";
import { fameMarketPricesResponse, revalidate } from "./route";

const originalNow = Date.now;

afterEach(() => {
  Date.now = originalNow;
});

describe("FAME market presentation API", () => {
  it("executes dynamically while preserving the snapshot fetch cache", () => {
    assert.equal(revalidate, 0);
  });

  it("serves one snapshot presentation with the established cache policy", async () => {
    const now = Date.parse("2026-08-09T12:01:00.000Z");
    Date.now = () => now;
    let requests = 0;
    const readSnapshot = createFameLandingSnapshotReader({
      clock: () => now,
      fetcher: async () => {
        requests += 1;
        return new Response(JSON.stringify(fixture), { status: 200 });
      },
    });

    const response = await fameMarketPricesResponse(readSnapshot);
    const body = (await response.json()) as Record<string, unknown>;

    assert.equal(requests, 1);
    assert.equal(response.status, 200);
    assert.equal(
      response.headers.get("cache-control"),
      "public, max-age=60, s-maxage=60, stale-while-revalidate=120",
    );
    assert.equal(
      response.headers.get("x-fame-snapshot-id"),
      fixture.provenance.snapshotId,
    );
    assert.deepEqual((body.liquidity as Record<string, unknown>).fame, {
      value: "25M FAME",
    });
  });

  it("keeps a valid unavailable leaf cacheable without merging another response", async () => {
    const now = Date.parse("2026-08-09T12:01:00.000Z");
    Date.now = () => now;
    const snapshot = structuredClone(fixture) as unknown as {
      fields: { quotes: Record<string, unknown> };
    };
    snapshot.fields.quotes.defiBuyUsdc = {
      status: "unavailable",
      reason: "no-safe-route",
    };
    const readSnapshot = createFameLandingSnapshotReader({
      clock: () => now,
      fetcher: async () =>
        new Response(JSON.stringify(snapshot), { status: 200 }),
    });

    const response = await fameMarketPricesResponse(readSnapshot);
    const body = (await response.json()) as {
      prices: {
        defiBuy: { USDC: { value: string | null }; ETH: { value: string } };
      };
      liquidity: { fame: { value: string } };
    };

    assert.equal(response.status, 200);
    assert.equal(body.prices.defiBuy.USDC.value, null);
    assert.equal(body.prices.defiBuy.ETH.value, "0.42 ETH");
    assert.equal(body.liquidity.fame.value, "25M FAME");
  });

  it("limits fresh and stale cache time to the snapshot's remaining lifetime", async () => {
    const now = Date.parse("2026-08-09T12:03:20.000Z");
    Date.now = () => now;
    const readSnapshot = createFameLandingSnapshotReader({
      clock: () => now,
      fetcher: async () =>
        new Response(JSON.stringify(fixture), { status: 200 }),
    });

    const response = await fameMarketPricesResponse(readSnapshot);

    assert.equal(response.status, 200);
    assert.equal(
      response.headers.get("cache-control"),
      "public, max-age=60, s-maxage=60, stale-while-revalidate=40",
    );
  });

  it("does not cache a snapshot when less than one second remains", async () => {
    const now = Date.parse("2026-08-09T12:04:59.500Z");
    Date.now = () => now;
    const readSnapshot = createFameLandingSnapshotReader({
      clock: () => now,
      fetcher: async () =>
        new Response(JSON.stringify(fixture), { status: 200 }),
    });

    const response = await fameMarketPricesResponse(readSnapshot);

    assert.equal(response.status, 200);
    assert.equal(
      response.headers.get("cache-control"),
      "public, max-age=0, s-maxage=0, stale-while-revalidate=0",
    );
  });

  it("fails closed if the snapshot expires before response construction", async () => {
    const validatedAt = Date.parse("2026-08-09T12:04:59.999Z");
    Date.now = () => Date.parse("2026-08-09T12:05:00.000Z");
    const readSnapshot = createFameLandingSnapshotReader({
      clock: () => validatedAt,
      fetcher: async () =>
        new Response(JSON.stringify(fixture), { status: 200 }),
    });

    const response = await fameMarketPricesResponse(readSnapshot);

    assert.equal(response.status, 503);
    assert.equal(response.headers.get("cache-control"), "no-store");
  });

  it("returns the whole unavailable presentation with no-store on failure", async () => {
    const readSnapshot = createFameLandingSnapshotReader({
      fetcher: async () =>
        new Response('{"error":"snapshot-unavailable"}', { status: 503 }),
    });

    const response = await fameMarketPricesResponse(readSnapshot);
    const body = (await response.json()) as {
      prices: { nftBuy: { fame: string | null } };
      marketCap: { USDC: { value: string | null } };
      liquidity: { fame: { value: string | null } };
    };

    assert.equal(response.status, 503);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(body.prices.nftBuy.fame, null);
    assert.equal(body.marketCap.USDC.value, null);
    assert.equal(body.liquidity.fame.value, null);
  });
});
