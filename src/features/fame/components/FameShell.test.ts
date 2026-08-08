import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

const source = (path: string) =>
  readFileSync(resolve(process.cwd(), path), "utf8");

describe("FAME route shell", () => {
  it("uses the restored landing and the shared shell on new FAME routes", () => {
    assert.match(source("src/app/fame/page.tsx"), /<Layout/);
    for (const path of [
      "src/app/fame/gallery/page.tsx",
      "src/app/fame/rotate/page.tsx",
    ]) {
      assert.match(source(path), /<FameShell/);
    }
  });

  it("reuses the shared FAME main inside the marketplace shell", () => {
    const shell = source(
      "src/features/fame-market/components/BaseGalleryShell.tsx",
    );
    assert.match(shell, /<FameMain/);
    assert.match(shell, /activeFamePage="marketplace"/);
    assert.doesNotMatch(shell, /<Main/);
  });

  it("marks the gallery and rotator routes as the active FAME destination", () => {
    assert.match(
      source("src/app/fame/gallery/page.tsx"),
      /activeFamePage="gallery"/,
    );
    assert.match(
      source("src/app/fame/rotate/page.tsx"),
      /activeFamePage="rotator"/,
    );
  });

  it("keeps the normal menu, links, addresses, and copy controls", () => {
    const shell = source("src/features/fame/components/FameShell.tsx");
    const landing = source("src/features/fame/layout.tsx");
    assert.match(shell, /<LinksMenuItems/);
    assert.match(shell, /<SiteMenu/);
    assert.match(landing, /<FameMain/);
    assert.equal((landing.match(/<CopyToClipboard/g) ?? []).length, 1);
    assert.equal((landing.match(/<ContractRow/g) ?? []).length, 2);
    assert.match(landing, /fameFromNetwork\(8453\)/);
    assert.match(landing, /0xbb5ed04dd7b207592429eb8d599d103ccad646c4/);
    assert.match(landing, /\/fame\/swap/);
    assert.match(landing, /\/fame\/market/);
    assert.match(landing, /\/fame\/rotate/);
    assert.match(landing, /dexscreener\.com/);
    assert.match(landing, /opensea\.io/);
    assert.match(landing, /t\.me\/famesocietybase/);
    assert.match(landing, /warpcast\.com\/fameladysociety/);
  });

  it("removes only the old token gallery from the landing", () => {
    const landing = source("src/features/fame/layout.tsx");
    assert.doesNotMatch(landing, /BurnPoolImage|burnPool|unrevealed/);
    assert.doesNotMatch(landing, /href="\/fame\/gallery"/);
    assert.match(landing, /1 million \$FAME = 1 Society NFT/);
    assert.match(landing, /<SingleTokenChecker/);
    assert.match(landing, /<FameFAQ/);
  });
});
