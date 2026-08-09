import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FameRotatorIndexPage } from "./FameRotatorIndexPage";

function render(page: React.ReactNode) {
  return renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      {page}
    </QueryClientProvider>,
  );
}

describe("FameRotatorIndexPage", () => {
  it("preserves FIFO order and routes each visual target to its exact flow", () => {
    const markup = render(
      <FameRotatorIndexPage
        status="ready"
        blockNumber="123"
        targets={[{ tokenId: 30 }, { tokenId: 10 }, { tokenId: 20 }]}
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
    const empty = render(<FameRotatorIndexPage status="empty" />);
    const error = render(<FameRotatorIndexPage status="error" />);
    assert.match(empty, /No waiting targets right now/);
    assert.doesNotMatch(empty, /Could not load waiting targets/);
    assert.match(error, /Could not load waiting targets/);
    assert.match(error, /does not mean it is empty/);
    assert.match(error, /href="\/fame\/rotate"/);
  });
});
