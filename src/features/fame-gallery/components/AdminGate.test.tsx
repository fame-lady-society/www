import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { AdminGate } from "./AdminGate";

describe("AdminGate", () => {
  it("announces checking and read-failure states", () => {
    const checking = renderToStaticMarkup(
      <AdminGate state={{ status: "checking" }} />,
    );
    const failure = renderToStaticMarkup(
      <AdminGate state={{ status: "failure", onRetry: () => undefined }} />,
    );

    assert.match(checking, /Checking owner access/);
    assert.match(checking, /role=\"status\"/);
    assert.match(failure, /role=\"alert\"/);
    assert.match(failure, /Try again/);
  });

  it("uses an unambiguous confirmed denial", () => {
    const html = renderToStaticMarkup(
      <AdminGate state={{ status: "denied" }} />,
    );

    assert.match(html, /Access denied/);
    assert.doesNotMatch(html, /operator/i);
  });
});
