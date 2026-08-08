import assert from "node:assert/strict";
import { it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { TransactionItem } from "./TransactionsModal";

it("does not prefix transaction activity with a placeholder hyphen", () => {
  const html = renderToStaticMarkup(
    <TransactionItem
      transaction={{ kind: "TEST approval" }}
      onConfirmed={() => undefined}
    />,
  );

  assert.match(html, /Awaiting TEST approval transaction/);
  assert.doesNotMatch(html, /^-/);
});
