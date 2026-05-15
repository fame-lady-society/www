import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FAME, NATIVE_ETH, USDC, WETH } from "../../tokens";
import { DEFAULT_FAME_OPTIMIZER_BUDGETS } from "./runContext";
import { routeOptimizerTemplatesForPair } from "./templates";

describe("FAME optimizer route templates", () => {
  it("extracts WETH/FAME direct split templates without static allocation ids", () => {
    const templates = routeOptimizerTemplatesForPair(WETH, FAME);
    const directSplits = templates.templates.filter(
      (template) => template.kind === "direct_split",
    );

    assert.ok(directSplits.length > 0);
    assert.ok(
      directSplits.some((template) =>
        template.branches.some(
          (branch) => branch.edge.poolId === "scale-equalizer-weth-fame",
        ),
      ),
    );
    assert.ok(!directSplits.some((template) => /\d+bps/.test(template.id)));
  });

  it("extracts USDC same-intermediate split-merge templates", () => {
    const templates = routeOptimizerTemplatesForPair(USDC, FAME);
    const splitMerge = templates.templates.find(
      (template) =>
        template.kind === "split_merge" &&
        template.branches.some(
          (branch) => branch.edge.poolId === "scale-equalizer-usdc-frxusd",
        ) &&
        template.branches.some(
          (branch) => branch.edge.poolId === "slipstream-usdc-frxusd",
        ) &&
        template.suffix.some(
          (edge) => edge.poolId === "scale-equalizer-frxusd-fame",
        ),
    );

    assert.ok(splitMerge);
    assert.ok(!/\d+bps/.test(splitMerge.id));
  });

  it("extracts USDC terminal split templates through WETH into FAME", () => {
    const templates = routeOptimizerTemplatesForPair(USDC, FAME);
    const terminalSplit = templates.templates.find(
      (template) =>
        template.kind === "terminal_split" &&
        template.prefix?.some(
          (edge) => edge.poolId === "slipstream-usdc-weth-100",
        ) &&
        template.branches.some(
          (branch) => branch.edge.poolId === "scale-equalizer-weth-fame",
        ) &&
        template.branches.some(
          (branch) => branch.edge.poolId === "uniswap-v2-fame-direct",
        ),
    );

    assert.ok(terminalSplit);
    assert.ok(!/\d+bps/.test(terminalSplit.id));
  });

  it("keeps FAME/USDC split templates inside the default template budget", () => {
    const templates = routeOptimizerTemplatesForPair(FAME, USDC).templates;
    const splitIndexes = templates
      .map((template, index) => ({ template, index }))
      .filter(
        ({ template }) =>
          template.kind === "terminal_split" || template.kind === "split_merge",
      )
      .map(({ index }) => index);

    assert.ok(splitIndexes.length > 0);
    assert.equal(Math.min(...splitIndexes), 0);
    assert.ok(
      Math.min(...splitIndexes) < DEFAULT_FAME_OPTIMIZER_BUDGETS.maxTemplates,
    );
  });

  it("enables native ETH terminal splits through the WETH wrap edge", () => {
    const templates = routeOptimizerTemplatesForPair(NATIVE_ETH, FAME);

    const terminalSplit = templates.templates.find(
      (template) =>
        template.kind === "terminal_split" &&
        template.prefix?.some((edge) => edge.poolId === "native-wrap-weth") &&
        template.branches.some(
          (branch) => branch.edge.poolId === "scale-equalizer-weth-fame",
        ) &&
        template.branches.some(
          (branch) => branch.edge.poolId === "uniswap-v2-fame-direct",
        ),
    );

    assert.ok(terminalSplit);
    assert.ok(
      terminalSplit.branches.some(
        (branch) =>
          branch.edge.tokenIn.toLowerCase() === WETH.toLowerCase() ||
          branch.edge.tokenOut.toLowerCase() === WETH.toLowerCase(),
      ),
    );
    assert.equal(
      templates.eligibility.some((entry) => entry.reason.includes("NativeWrap")),
      false,
    );
  });
});
