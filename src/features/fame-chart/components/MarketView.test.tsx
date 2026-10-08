import assert from "node:assert/strict";
import { it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import fixture from "../fixtures/sampled-usdc.json";
import { parseChart, mergeChart, combineCharts } from "../history";
import { HistoryFetchError } from "../useHistory";
import { MarketView } from "./MarketView";
const render = (props: Partial<Parameters<typeof MarketView>[0]> = {}) =>
  renderToStaticMarkup(
    <MarketView
      selection={["market"]}
      onSelectionChange={() => {}}
      currency="USDC"
      onCurrencyChange={() => {}}
      error={null}
      fetching={false}
      onRefresh={() => {}}
      {...props}
    />,
  );
it("has spot candles, pool controls and explicit conversion labels", () => {
  const html = render({
    history: combineCharts([mergeChart(undefined, parseChart(fixture))])!,
  });
  assert.match(html, /aria-label="Chart series"/);
  assert.match(html, /aria-pressed="true"[^>]*>USDC/);
  assert.match(html, /Five-minute sampled history/);
  assert.match(html, /Volume \(USDC\)/);
  assert.doesNotMatch(html, /VWAP|Gold bars/);
  assert.match(html, /5m spot candles/);
  assert.match(html, /intrabucket movement of conversion pools/);
  assert.match(html, /Blended/);
  assert.match(html, /select at least one/);
  assert.doesNotMatch(html, /Market pool legend|<select/);
  assert.match(
    html,
    /type="checkbox"[^>]*disabled=""[^>]*checked=""[^>]*value="market"/,
  );
  assert.match(html, /market volume/);
});
it("distinguishes not-ready, loading, refresh errors and currency changes", () => {
  assert.match(render(), /Loading market history/);
  assert.match(
    render({ error: new HistoryFetchError("sampled-history-not-ready", 503) }),
    /Sampled market history is not available yet/,
  );
  assert.match(
    render({
      history: combineCharts([mergeChart(undefined, parseChart(fixture))])!,
      error: new Error("offline"),
    }),
    /Refresh failed/,
  );
  assert.match(
    render({
      history: combineCharts([mergeChart(undefined, parseChart(fixture))])!,
      currency: "ETH",
    }),
    /Loading market history/,
  );
  assert.doesNotMatch(
    render({
      history: combineCharts([mergeChart(undefined, parseChart(fixture))])!,
      currency: "ETH",
    }),
    /Five-minute sampled history/,
  );
});

it("never removes the last selected series", async () => {
  const { toggleSeries, MARKET } = await import("../presentation");
  assert.deepEqual(toggleSeries([MARKET], MARKET), [MARKET]);
  const pair = toggleSeries([MARKET], "pool-a");
  assert.deepEqual(pair, [MARKET, "pool-a"]);
  assert.deepEqual(toggleSeries(pair, MARKET), ["pool-a"]);
});
