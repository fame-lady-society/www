import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

const activeCopyPaths = [
  "src/features/fame/layout.tsx",
  "src/features/fame/components/FameFAQ.tsx",
  "src/features/appbar/components.app/SiteMenu.tsx",
  "src/features/appbar/components/SiteMenu.tsx",
  "src/features/appbar/components/LinksMenuItems.tsx",
  "src/features/home/Layout.tsx",
  "src/features/lore/LoreContent.tsx",
  "src/features/faq/index.tsx",
  "src/features/presale/components/PresaleFAQ.tsx",
  "src/features/wrap/components/UnwrapCard.tsx",
  "src/app/fameus/layout.tsx",
  "src/app/fameus/page.tsx",
  "src/app/[network]/fameus/layout.tsx",
  "src/app/[network]/fameus/page.tsx",
  "src/app/[network]/fameus/onboarding/page.tsx",
  "src/app/[network]/fameus/wrap/page.tsx",
  "src/app/[network]/fameus/[address]/TabBar.tsx",
  "src/app/[network]/fameus/[address]/governance/ManageTokens.tsx",
  "src/app/[network]/fameus/[address]/governance/SelectableToken.tsx",
  "src/app/[network]/fameus/[address]/governance/layout.tsx",
  "src/app/[network]/fameus/[address]/governance/page.tsx",
  "src/app/[network]/fameus/[address]/wrap/layout.tsx",
  "src/app/[network]/fameus/[address]/wrap/page.tsx",
  "src/app/[network]/fameus/[address]/wrap/SelectableToken.tsx",
  "src/app/fame/creator/[address]/SelectableToken.tsx",
  "src/app/schwing/[address]/unwrap/SelectableToken.tsx",
  "src/app/schwing/wrap/layout.tsx",
  "src/app/schwing/[address]/wrap/layout.tsx",
] as const;

const bannedCopy = [
  "https://www.tally.xyz/gov/fameus-dao",
  "The FAMEus DAO is redefining web3",
  "View governance on Tally",
  "vote on active proposals",
  ["https://fame.support", "thumb/"].join("/"),
] as const;

const source = (path: string) =>
  readFileSync(resolve(process.cwd(), path), "utf8");

describe("active FAME and FAMEus copy policy", () => {
  it("does not publish retired governance links or active-governance claims", () => {
    for (const path of activeCopyPaths) {
      const activeSource = source(path);

      for (const phrase of bannedCopy) {
        assert.equal(
          activeSource.toLowerCase().includes(phrase.toLowerCase()),
          false,
          `${path} still contains retired copy: ${phrase}`,
        );
      }
    }
  });

  it("documents the limits of the FAMEus recovery surface", () => {
    const faq = source("src/features/faq/index.tsx");

    assert.match(faq, /href="\/fameus"/);
    assert.match(faq, /controls for unwrapping existing Governance/);
    assert.match(faq, /does not currently provide an undelegate action/);
    assert.match(
      faq,
      /compatible external wallet or direct contract interface/,
    );
    assert.match(faq, /does not automatically clear a separate delegation/);
  });
});
