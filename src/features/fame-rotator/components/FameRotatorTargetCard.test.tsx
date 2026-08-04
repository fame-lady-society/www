import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { FAME_METADATA_FALLBACK_IMAGE } from "@/service/fameMetadata";
import { FameRotatorTargetCard } from "./FameRotatorTargetCard";

describe("FameRotatorTargetCard", () => {
  it("links to the exact target and preserves its accessible identity with fallback artwork", () => {
    const markup = renderToStaticMarkup(
      <FameRotatorTargetCard
        tokenId={12}
        image={FAME_METADATA_FALLBACK_IMAGE}
        position={2}
      />,
    );
    assert.match(markup, /href="\/fame\/rotate\/12"/);
    assert.match(markup, /Choose Society #12 for rotation/);
    assert.match(markup, /Society #12/);
    assert.match(markup, /%2Fimages%2Ffame%2Fgold-leaf-square\.png/);
  });
});
