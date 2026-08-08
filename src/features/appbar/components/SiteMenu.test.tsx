import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it } from "node:test";
import { SiteMenu } from "./SiteMenu";

function menuItem(html: string, href: string) {
  const hrefIndex = html.indexOf(`href="${href}"`);
  assert.notEqual(hrefIndex, -1, `Expected menu item for ${href}`);
  const itemStart = html.lastIndexOf("<", hrefIndex);
  const itemEnd = html.indexOf("</a>", hrefIndex);
  assert.notEqual(itemStart, -1);
  assert.notEqual(itemEnd, -1);
  return html.slice(itemStart, itemEnd);
}

describe("FAME site menu", () => {
  it("disables only the active FAME destination", () => {
    const html = renderToStaticMarkup(
      createElement(SiteMenu, { activeFamePage: "marketplace" }),
    );

    assert.match(menuItem(html, "/fame/market"), /aria-disabled="true"/);
    for (const href of ["/fame", "/fame/gallery", "/fame/rotate"]) {
      assert.doesNotMatch(menuItem(html, href), /aria-disabled="true"/);
    }
  });

  it("supports the gallery and rotator active destinations", () => {
    for (const [page, href] of [
      ["gallery", "/fame/gallery"],
      ["rotator", "/fame/rotate"],
    ] as const) {
      const html = renderToStaticMarkup(
        createElement(SiteMenu, { activeFamePage: page }),
      );

      assert.match(menuItem(html, href), /aria-disabled="true"/);
      assert.doesNotMatch(
        menuItem(html, "/fame/market"),
        /aria-disabled="true"/,
      );
    }
  });
});
