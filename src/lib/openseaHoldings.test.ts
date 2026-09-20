import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { fetchHoldingsPage } from "./openseaHoldings.server";
import { holdingsChains, holdingsCsv } from "./openseaHoldings";

const address = `0x${"1".repeat(40)}`;
const originalFetch = globalThis.fetch;
const originalKey = process.env.OPENSEA_API_KEY;
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.OPENSEA_API_KEY;
  else process.env.OPENSEA_API_KEY = originalKey;
});
function mock(body: unknown, status = 200) {
  process.env.OPENSEA_API_KEY = "test-key";
  globalThis.fetch = (async () =>
    Response.json(body, { status })) as typeof fetch;
}
test("validates address and chain before requesting OpenSea", async () => {
  globalThis.fetch = (() => {
    throw new Error("must not fetch");
  }) as typeof fetch;
  await assert.rejects(
    fetchHoldingsPage("invalid", new URLSearchParams()),
    /valid.*address/,
  );
  await assert.rejects(
    fetchHoldingsPage(address, new URLSearchParams("chain=evil")),
    /Invalid chain/,
  );
});
test("empty chain advances, final chain completes", async () => {
  mock({ nfts: [] });
  const first = await fetchHoldingsPage(address, new URLSearchParams());
  assert.equal(first.complete, false);
  assert.match(first.next!, /chain=base/);
  const last = await fetchHoldingsPage(
    address,
    new URLSearchParams({ chain: holdingsChains.at(-1)! }),
  );
  assert.equal(last.complete, true);
  assert.equal(last.next, null);
});
test("preserves raw fields and follows escaped cursor on same chain", async () => {
  mock({
    nfts: [
      {
        contract: address,
        identifier: "900719925474099312345",
        custom: { value: 1 },
      },
    ],
    next: "a+b/=",
  });
  const result = await fetchHoldingsPage(address, new URLSearchParams());
  assert.deepEqual(result.nfts[0].custom, { value: 1 });
  assert.equal(result.nfts[0].chain, "ethereum");
  assert.equal(
    new URL(result.next!, "https://example.com").searchParams.get("next"),
    "a+b/=",
  );
});
test("fails visibly for rate limits, malformed responses and repeated cursors", async () => {
  mock({}, 429);
  await assert.rejects(
    fetchHoldingsPage(address, new URLSearchParams()),
    /429/,
  );
  mock({ nfts: [{}] });
  await assert.rejects(
    fetchHoldingsPage(address, new URLSearchParams()),
    /invalid holdings/,
  );
  mock({ nfts: [], next: "same" });
  await assert.rejects(
    fetchHoldingsPage(address, new URLSearchParams("next=same")),
    /repeated/,
  );
});
test("missing key fails without an upstream call", async () => {
  delete process.env.OPENSEA_API_KEY;
  await assert.rejects(
    fetchHoldingsPage(address, new URLSearchParams()),
    /not configured/,
  );
});
test("CSV escapes formulas, quotes and newlines", () => {
  const csv = holdingsCsv([
    {
      chain: "base",
      contract: address,
      identifier: "123",
      collection: 'a,"b',
      name: "=HYPERLINK(1)\nline",
      token_standard: "erc721",
    },
  ]);
  assert.match(csv, /'=HYPERLINK/);
  assert.match(csv, /"a,""b"/);
});

test("export route exposes pagination and rejects unsupported formats", async () => {
  const { GET } = await import(
    "../app/opensea/address/[walletAddress]/export/route"
  );
  mock({ nfts: [] });
  const context = { params: Promise.resolve({ walletAddress: address }) };
  const response = await GET(
    new Request(
      `https://example.com/opensea/address/${address}/export?format=csv`,
    ),
    context,
  );
  assert.equal(response.status, 200);
  assert.match(response.headers.get("Link")!, /chain=base&format=csv/);
  assert.equal(response.headers.get("X-Export-Complete"), "false");
  assert.match(await response.text(), /chain,contract,identifier/);
  const invalid = await GET(
    new Request(
      `https://example.com/opensea/address/${address}/export?format=xml`,
    ),
    context,
  );
  assert.equal(invalid.status, 400);
});
