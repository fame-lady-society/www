import assert from "node:assert/strict";
// @ts-expect-error Bun runs this test, but the application tsconfig excludes Bun's ambient types.
import { describe, it, mock } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";

mock.module("@/hooks/useAccount", () => ({
  useAccount: () => ({ chainId: 8453 }),
}));
mock.module("@/features/customize/hooks/useLadies", () => ({
  useLadies: () => ({ data: [], isLoading: false }),
}));
mock.module("wagmi", () => ({
  useSwitchChain: () => ({ switchChain: () => undefined }),
}));
mock.module("@/features/customize/SelectPage", () => ({
  SelectPage: () => <div data-testid="select-page" />,
}));
mock.module("@/context/default", () => ({
  DefaultProvider: ({ children }: { children: ReactNode }) => children,
}));
mock.module("@/layouts/Main", () => ({
  Main: ({ children }: { children: ReactNode }) => children,
}));
mock.module("@/features/appbar/components/SiteMenu", () => ({
  SiteMenu: () => null,
}));
mock.module("@/features/appbar/components/LinksMenuItems", () => ({
  LinksMenuItems: () => null,
}));

const { CustomizeContent } = await import("./Customize");

describe("CustomizeContent", () => {
  it("keeps the wrong-network prompt inside the header-offset container", () => {
    const html = renderToStaticMarkup(
      <CustomizeContent network="mainnet" prefix="/mainnet/customize" />,
    );

    assert.match(html, /MuiContainer-root/);
    assert.match(html, /margin-top:64px/);
    assert.match(html, /Switch to Ethereum/);
    assert.doesNotMatch(html, /data-testid="select-page"/);
  });
});
