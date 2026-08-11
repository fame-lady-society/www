import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, it } from "node:test";

const root = process.cwd();
const sourceRoot = resolve(root, "src");
const migrationTestPath = resolve(
  sourceRoot,
  "context/appKitMigration.test.ts",
);

function filesMatching(directory: string, pattern: RegExp): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return filesMatching(path, pattern);
    return pattern.test(entry) ? [path] : [];
  });
}

function sourceFiles(directory: string): string[] {
  return filesMatching(directory, /\.(?:ts|tsx|js|jsx)$/);
}

describe("Reown migration boundaries", () => {
  it("targets browsers that preserve native bigint exponentiation", () => {
    const browsers = readFileSync(resolve(root, ".browserslistrc"), "utf8")
      .trim()
      .split("\n");

    assert.deepEqual(browsers, [
      "chrome >= 111",
      "and_chr >= 111",
      "edge >= 111",
      "firefox >= 111",
      "safari >= 16.4",
      "ios_saf >= 16.4",
    ]);
  });

  it("contains no ConnectKit runtime or direct WalletConnect provider", () => {
    const packageJson = readFileSync(resolve(root, "package.json"), "utf8");
    const sources = sourceFiles(sourceRoot)
      .filter((path) => path !== migrationTestPath)
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");
    const documentation = filesMatching(resolve(root, "docs"), /\.md$/)
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");

    for (const obsolete of [
      "connectkit",
      "connectkit-next-siwe",
      "@walletconnect/ethereum-provider",
    ]) {
      assert.doesNotMatch(packageJson, new RegExp(obsolete, "i"));
      assert.doesNotMatch(sources, new RegExp(obsolete, "i"));
      assert.doesNotMatch(documentation, new RegExp(obsolete, "i"));
    }
  });

  it("uses AppKitButton only in the two headers", () => {
    const allowed = new Set([
      "src/features/appbar/components.app/AppBarClient.tsx",
      "src/features/appbar/components/appBar.tsx",
    ]);
    const consumers = sourceFiles(sourceRoot)
      .filter((path) => path !== migrationTestPath)
      .filter((path) => readFileSync(path, "utf8").includes("AppKitButton"))
      .map((path) => relative(root, path));

    assert.deepEqual(new Set(consumers), allowed);
  });

  it("does not remount a wallet provider inside the embedded FAME swap", () => {
    const source = readFileSync(
      resolve(
        root,
        "src/features/fame-landing/components/EmbeddedFameSwap.tsx",
      ),
      "utf8",
    );

    assert.doesNotMatch(source, /DefaultProvider|Web3Provider|WagmiProvider/);
  });
});
