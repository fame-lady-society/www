import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { FameSwapAccordion } from "./FameSwapAccordion";

describe("FAME landing swap accordion", () => {
  it("is closed and does not server-render the lazy swap widget", () => {
    const markup = renderToStaticMarkup(<FameSwapAccordion />);
    assert.match(markup, /Swap now/);
    assert.match(markup, /aria-expanded="false"/);
    assert.doesNotMatch(markup, /FAME swap/);
  });
});
