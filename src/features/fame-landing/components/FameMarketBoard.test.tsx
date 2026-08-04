import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { FameMarketBoard } from "./FameMarketBoard";

describe("FAME market board", () => {
  it("defaults to FAME with exactly three local currency radios", () => {
    const markup = renderToStaticMarkup(
      <FameMarketBoard
        currencies={{
          FAME: {
            buy: { value: "11 FAME", note: "Cached" },
            sell: { value: "10 FAME", note: "Cached" },
          },
          USDC: {
            buy: { value: "11 USDC", note: "Cached" },
            sell: { value: "10 USDC", note: "Cached" },
          },
          ETH: {
            buy: { value: "0.01 ETH", note: "Cached" },
            sell: { value: "0.009 ETH", note: "Cached" },
          },
        }}
      />,
    );
    assert.equal((markup.match(/type="radio"/g) ?? []).length, 3);
    assert.match(markup, /11 FAME/);
    assert.doesNotMatch(markup, /11 USDC/);
  });
});
