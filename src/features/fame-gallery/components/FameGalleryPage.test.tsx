import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { FameGalleryPage } from "./FameGalleryPage";

describe("FameGalleryPage status presentation", () => {
  it("makes retained status explicitly stale", () => {
    const markup = renderToStaticMarkup(
      <FameGalleryPage
        tokenIds={[1]}
        statuses={{ "1": "owned" }}
        freshness="stale"
        observedAt={0}
      />,
    );
    assert.match(markup, /Status data is stale/);
    assert.match(markup, /Owned/);
  });

  it("uses unknown badges when status is unavailable", () => {
    const markup = renderToStaticMarkup(
      <FameGalleryPage tokenIds={[1]} statuses={{}} freshness="unavailable" />,
    );
    assert.match(markup, /Status data is unavailable/);
    assert.match(markup, /Status unavailable/);
  });
});
