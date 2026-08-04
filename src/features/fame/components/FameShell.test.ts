import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

const source = (path: string) =>
  readFileSync(resolve(process.cwd(), path), "utf8");

describe("FAME route shell", () => {
  it("wraps the landing, gallery, and rotator in the shared shell", () => {
    for (const path of [
      "src/app/fame/page.tsx",
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
    assert.doesNotMatch(shell, /<Main/);
  });

  it("has one normal menu and no landing-only menu", () => {
    const shell = source("src/features/fame/components/FameShell.tsx");
    const landing = source(
      "src/features/fame-landing/components/FameLandingPage.tsx",
    );
    assert.match(shell, /<LinksMenuItems/);
    assert.match(shell, /<SiteMenu/);
    assert.doesNotMatch(landing, /FameLandingMenu/);
  });
});
