import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { FameMarketCapCalculator } from "./FameMarketCapCalculator";

const data = {
  currentMarketCapUsdc: "242000000000",
  currentMarketCapInput: { value: "242", unit: "K" as const },
  conversion: {
    buy: { usdc: "250000000", eth: "420000000000000000" },
    sell: { usdc: "240000000", eth: "410000000000000000" },
  },
};

describe("FAME market-cap calculator component", () => {
  it("renders the editable sentence, placeholder, units, and calculated values", () => {
    const markup = renderToStaticMarkup(
      <FameMarketCapCalculator data={data} />,
    );

    assert.match(markup, /Market cap calculator/);
    assert.match(markup, />Editable</);
    assert.match(markup, /id="fame-market-cap-input"/);
    assert.match(markup, /placeholder="242"/);
    assert.match(markup, /Market cap amount, editable/);
    assert.match(
      markup,
      /Market cap unit: K thousands, M millions, B billions/,
    );
    assert.equal((markup.match(/<option /g) ?? []).length, 3);
    assert.match(markup, /At a marketcap of/);
    assert.match(markup, /\$272\.52/);
    assert.match(markup, /0\.462 Ξ/);
    assert.match(markup, /each \$FAME is/);
    assert.match(markup, /\$0\.000273/);
    assert.doesNotMatch(markup, /captured DeFi buy and sell conversion/);
  });

  it("keeps the calculated dollar values when Ξ conversion is unavailable", () => {
    const markup = renderToStaticMarkup(
      <FameMarketCapCalculator data={{ ...data, conversion: null }} />,
    );

    assert.match(markup, /\$272\.52/);
    assert.match(markup, /each \$FAME is/);
    assert.match(markup, /\$0\.000273/);
    assert.match(markup, /unavailable Ξ/);
    assert.doesNotMatch(
      markup,
      /captured DeFi Ξ conversion is currently unavailable/,
    );
  });
});
