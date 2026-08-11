import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

const recoveryCopyFiles = [
  "src/app/fameus/page.tsx",
  "src/app/fameus/layout.tsx",
  "src/app/[network]/fameus/page.tsx",
  "src/app/[network]/fameus/layout.tsx",
  "src/app/[network]/fameus/onboarding/page.tsx",
  "src/app/[network]/fameus/wrap/page.tsx",
  "src/app/[network]/fameus/[address]/wrap/page.tsx",
  "src/app/[network]/fameus/[address]/governance/page.tsx",
  "src/app/[network]/fameus/[address]/TabBar.tsx",
  "src/features/appbar/components/SiteMenu.tsx",
  "src/features/appbar/components.app/SiteMenu.tsx",
] as const;

function source(path: (typeof recoveryCopyFiles)[number]) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("FAMEus recovery copy", () => {
  it("removes Tally and active governance invitations from FAMEus routes", () => {
    const allCopy = recoveryCopyFiles.map(source).join("\n");

    assert.doesNotMatch(allCopy, /tally\.xyz/i);
    assert.doesNotMatch(allCopy, /vote on (?:the future|proposals)/i);
    assert.doesNotMatch(allCopy, /create a proposal/i);
    assert.doesNotMatch(allCopy, /DAO is redefining web3/i);
  });

  it("labels navigation and connected tabs as recovery surfaces", () => {
    assert.match(
      source("src/features/appbar/components/SiteMenu.tsx"),
      /FAMEus Recovery/,
    );
    assert.match(
      source("src/features/appbar/components.app/SiteMenu.tsx"),
      /FAMEus Recovery/,
    );

    const tabs = source("src/app/[network]/fameus/[address]/TabBar.tsx");
    assert.match(tabs, />\s*Legacy wrap\s*</);
    assert.match(tabs, />\s*Recovery\s*</);
  });

  it("states the recovery boundary without inventing an undelegate control", () => {
    const entry = source("src/app/[network]/fameus/page.tsx");
    const recovery = source(
      "src/app/[network]/fameus/[address]/governance/page.tsx",
    );

    assert.match(entry, /governance is paused/i);
    assert.match(recovery, /unwrap/i);
    assert.match(recovery, /compatible external wallet or contract interface/i);
    assert.match(recovery, /does\s+not clear an existing delegation/i);
    assert.doesNotMatch(recovery, /onClick.*undelegate/is);
  });
});
