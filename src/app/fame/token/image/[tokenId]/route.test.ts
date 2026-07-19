import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { handleTokenImageRequest } from "./route";

describe("/fame/token/image/[tokenId]", () => {
  it("reads metadata from the renderer and returns the referenced image", async () => {
    const requests: string[] = [];
    const response = await handleTokenImageRequest("645", {
      readTokenUri: async (tokenId) => {
        assert.equal(tokenId, 645n);
        return "https://metadata.example/645";
      },
      fetchResource: async (input) => {
        const url = input.toString();
        requests.push(url);

        if (url === "https://metadata.example/645") {
          return Response.json({
            image: "https://images.example/645.png",
          });
        }

        return new Response("image-bytes", {
          headers: { "Content-Type": "image/png" },
        });
      },
    });

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Content-Type"), "image/png");
    assert.match(response.headers.get("Cache-Control") ?? "", /s-maxage=3600/);
    assert.equal(await response.text(), "image-bytes");
    assert.deepEqual(requests, [
      "https://metadata.example/645",
      "https://images.example/645.png",
    ]);
  });
});
