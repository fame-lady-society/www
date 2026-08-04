import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { FAME_METADATA_FALLBACK_IMAGE } from "@/service/fameMetadata";
import { FameRotatorIndexPage } from "./FameRotatorIndexPage";

describe("FameRotatorIndexPage", () => {
  it("preserves FIFO order and routes each visual target to its exact flow", () => {
    const markup = renderToStaticMarkup(
      <FameRotatorIndexPage
        status="ready"
        targets={[
          { tokenId: 30, image: "https://images.example/30.png" },
          { tokenId: 10, image: FAME_METADATA_FALLBACK_IMAGE },
          { tokenId: 20, image: "https://images.example/20.png" },
        ]}
      />,
    );
    assert.ok(
      markup.indexOf("/fame/rotate/30") < markup.indexOf("/fame/rotate/10"),
    );
    assert.ok(
      markup.indexOf("/fame/rotate/10") < markup.indexOf("/fame/rotate/20"),
    );
    assert.match(markup, /Choose Society #10 for rotation/);
    assert.match(markup, /%2Fimages%2Ffame%2Fgold-leaf-square\.png/);
    assert.doesNotMatch(markup, /input[^>]+(?:token|number)|search/i);
  });

  it("distinguishes an empty waiting pool from a failed pool read", () => {
    const empty = renderToStaticMarkup(<FameRotatorIndexPage status="empty" />);
    const error = renderToStaticMarkup(<FameRotatorIndexPage status="error" />);
    assert.match(empty, /No waiting targets right now/);
    assert.doesNotMatch(empty, /Could not load waiting targets/);
    assert.match(error, /Could not load waiting targets/);
    assert.match(error, /does not mean it is empty/);
    assert.match(error, /href="\/fame\/rotate"/);
  });
});
