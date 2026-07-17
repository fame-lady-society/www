import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  TEST_METADATA_LIMITS,
  decodeTestGalleryMetadata,
} from "./testMetadata";

function dataUri(mime: string, value: string) {
  return `data:${mime};base64,${Buffer.from(value).toString("base64")}`;
}

function metadataUri(
  overrides: Record<string, unknown> = {},
  svg = '<svg xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1"/></svg>',
) {
  return dataUri(
    "application/json",
    JSON.stringify({
      name: "Example Society #1",
      description: "On-chain test art",
      image: dataUri("image/svg+xml", svg),
      attributes: [{ trait_type: "Token ID", value: "1" }],
      ...overrides,
    }),
  );
}

describe("TEST gallery metadata", () => {
  it("decodes nested Base64 JSON and passive SVG", () => {
    const result = decodeTestGalleryMetadata(metadataUri());

    assert.equal(result.status, "ready");
    if (result.status !== "ready") return;
    assert.equal(result.name, "Example Society #1");
    assert.equal(result.description, "On-chain test art");
    assert.equal(result.attributes[0]?.traitType, "Token ID");
    assert.match(result.image, /^data:image\/svg\+xml;base64,/);
  });

  it("returns a bounded fallback for unavailable metadata", () => {
    const result = decodeTestGalleryMetadata(" ");

    assert.equal(result.status, "fallback");
    assert.match(result.image, /gold-leaf-square/);
  });

  it("returns parsing failure with fallback art for malformed metadata", () => {
    for (const tokenUri of [
      "https://example.com/metadata.json",
      "data:application/json;base64,***",
      dataUri("application/json", "{"),
      dataUri("text/plain", "{}"),
      metadataUri({ image: "" }),
      metadataUri({ image: dataUri("image/png", "not svg") }),
    ]) {
      const result = decodeTestGalleryMetadata(tokenUri);
      assert.equal(result.status, "failure");
      assert.match(result.image, /gold-leaf-square/);
    }
  });

  it("rejects active or externally loading SVG constructs", () => {
    for (const svg of [
      "<svg><script>alert(1)</script></svg>",
      '<svg onload="alert(1)"></svg>',
      "<svg><foreignObject /></svg>",
      '<svg><image href="https://example.com/image.png" /></svg>',
      '<svg><rect fill="url(https://example.com/a.svg#paint)" /></svg>',
      "<!DOCTYPE svg><svg></svg>",
    ]) {
      assert.equal(
        decodeTestGalleryMetadata(metadataUri({}, svg)).status,
        "failure",
      );
    }
  });

  it("enforces field, attribute, and encoded-size budgets", () => {
    assert.equal(
      decodeTestGalleryMetadata(
        metadataUri({ name: "x".repeat(TEST_METADATA_LIMITS.name + 1) }),
      ).status,
      "failure",
    );
    assert.equal(
      decodeTestGalleryMetadata(
        metadataUri({
          attributes: Array.from(
            { length: TEST_METADATA_LIMITS.attributes + 1 },
            (_, index) => ({
              trait_type: `Trait ${index}`,
              value: `${index}`,
            }),
          ),
        }),
      ).status,
      "failure",
    );
    assert.equal(
      decodeTestGalleryMetadata(
        `data:application/json;base64,${"A".repeat(
          TEST_METADATA_LIMITS.encodedJson + 1,
        )}`,
      ).status,
      "failure",
    );
  });
});
