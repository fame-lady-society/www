import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FAME_SWAP_ROUTE_GRAPH_EXAMPLES,
  type FameSwapRouteGraphExampleKind,
} from "./routeGraphExamples";

const requiredKinds: readonly FameSwapRouteGraphExampleKind[] = [
  "single-hop",
  "multi-hop-serial",
  "direct-split",
  "split-then-merge",
  "native-eth",
  "missing-token-image",
  "unknown-token",
];

function collectValues(value: unknown, values: string[] = []): string[] {
  if (typeof value === "string") {
    values.push(value);
    return values;
  }
  if (!value || typeof value !== "object") return values;
  for (const entry of Object.values(value)) {
    collectValues(entry, values);
  }
  return values;
}

describe("FAME swap route graph examples", () => {
  it("covers every required inspection fixture kind", () => {
    const kinds = new Set(
      FAME_SWAP_ROUTE_GRAPH_EXAMPLES.map((example) => example.kind),
    );

    for (const kind of requiredKinds) {
      assert.equal(kinds.has(kind), true, `${kind} fixture is missing`);
    }
  });

  it("uses stable labels and the production graph display model", () => {
    for (const example of FAME_SWAP_ROUTE_GRAPH_EXAMPLES) {
      assert.ok(example.id);
      assert.ok(example.label);
      assert.equal(example.displaySafe, true);
      assert.ok(example.graph.nodes.length >= 2);
      assert.ok(example.graph.edges.length >= 1);
      assert.ok(example.graph.semanticLines.length >= 1);
    }
  });

  it("does not expose raw executable route data in fixtures", () => {
    const forbiddenKeys = [
      "abiEncodedRoute",
      "callValue",
      "data",
      "deadline",
      "executionContext",
      "materializedRouteHash",
      "recipient",
      "routerAddress",
      "target",
    ];
    const payload = JSON.stringify(FAME_SWAP_ROUTE_GRAPH_EXAMPLES);

    for (const key of forbiddenKeys) {
      assert.doesNotMatch(payload, new RegExp(`"${key}"`));
    }

    const longHexValues = collectValues(FAME_SWAP_ROUTE_GRAPH_EXAMPLES).filter(
      (value) => /^0x[0-9a-f]{80,}$/i.test(value),
    );
    assert.deepEqual(longHexValues, []);
  });

  it("keeps fallback examples explicit", () => {
    const imageFallback = FAME_SWAP_ROUTE_GRAPH_EXAMPLES.find(
      (example) => example.kind === "missing-token-image",
    );
    const unknownFallback = FAME_SWAP_ROUTE_GRAPH_EXAMPLES.find(
      (example) => example.kind === "unknown-token",
    );

    assert.ok(imageFallback);
    assert.ok(
      imageFallback.graph.nodes.some(
        (node) => node.token.imageStatus === "fallback",
      ),
    );
    assert.ok(unknownFallback);
    assert.ok(unknownFallback.graph.nodes.some((node) => !node.token.known));
  });
});
