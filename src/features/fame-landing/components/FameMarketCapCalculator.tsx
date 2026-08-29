"use client";

import { useState } from "react";
import {
  calculateMarketCap,
  consumeMarketCapUnitSuffix,
  formatFameUsdc,
  formatSocietyEth,
  formatSocietyUsdc,
  MARKET_CAP_UNITS,
  type MarketCapCalculatorData,
  type MarketCapUnit,
} from "../marketCapCalculator";

export function FameMarketCapCalculator({
  data,
}: {
  data: MarketCapCalculatorData;
}) {
  const [input, setInput] = useState("");
  const [unit, setUnit] = useState<MarketCapUnit>(
    data.currentMarketCapInput?.unit ?? "M",
  );
  const calculation = calculateMarketCap(input, unit, data);
  const invalid = calculation.status === "invalid";

  function handleInputChange(value: string) {
    const withUnit = consumeMarketCapUnitSuffix(value);
    if (!withUnit) {
      setInput(value);
      return;
    }

    setInput(withUnit.value);
    setUnit(withUnit.unit);
  }

  return (
    <section
      aria-labelledby="fame-market-cap-calculator-title"
      className="bg-[#11100d] p-5 sm:p-8 lg:p-10"
    >
      <header className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <h2
          id="fame-market-cap-calculator-title"
          className="fame-display text-3xl sm:text-4xl"
        >
          Market cap calculator
        </h2>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c9aa67]">
          Editable
        </p>
      </header>

      <p className="max-w-5xl text-lg leading-9 text-[#f4eee2] sm:text-xl sm:leading-10">
        <span>At a marketcap of </span>
        <span className="inline-flex h-[1.75em] items-end whitespace-nowrap">
          <span aria-hidden>$</span>
          <span className="relative inline-flex h-[1.75em] items-end">
            <label htmlFor="fame-market-cap-input" className="sr-only">
              Market cap amount, editable
            </label>
            <input
              id="fame-market-cap-input"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
              value={input}
              placeholder={data.currentMarketCapInput?.value ?? "Enter amount"}
              onChange={(event) => handleInputChange(event.target.value)}
              aria-describedby={
                calculation.status === "available"
                  ? undefined
                  : "fame-market-cap-error"
              }
              aria-invalid={invalid}
              className="fame-focus h-full w-[7ch] border-0 bg-transparent px-1 py-0 text-right font-mono leading-[1.5em] text-inherit placeholder:text-[#8f8779]"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-[#c9aa67]/70"
            />
          </span>
          <span className="relative ml-2 inline-flex h-[1.75em] items-end">
            <label htmlFor="fame-market-cap-unit" className="sr-only">
              Market cap unit
            </label>
            <select
              id="fame-market-cap-unit"
              value={unit}
              onChange={(event) => setUnit(event.target.value as MarketCapUnit)}
              aria-label="Market cap unit: K thousands, M millions, B billions"
              className="fame-focus h-full border-0 bg-transparent px-1 py-0 font-mono leading-[1.5em] text-inherit"
            >
              {MARKET_CAP_UNITS.map((option) => (
                <option key={option} value={option} className="bg-[#11100d]">
                  {option}
                </option>
              ))}
            </select>
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-[#c9aa67]/70"
            />
          </span>
        </span>{" "}
        {calculation.status === "available" ? (
          <span aria-live="polite">
            <span>one Society NFT is worth </span>
            <strong className="font-medium tabular-nums">
              {formatSocietyUsdc(calculation.marketCapUsdc)}
            </strong>{" "}
            <span>(</span>
            {calculation.societyEthWei === null ? (
              <span aria-label="Ξ value unavailable">unavailable Ξ</span>
            ) : (
              <span aria-label="Ξ value">
                {formatSocietyEth(calculation.societyEthWei)}
              </span>
            )}
            <span>) and each $FAME is </span>
            <strong className="font-medium tabular-nums">
              {formatFameUsdc(calculation.marketCapUsdc)}
            </strong>
            <span>.</span>
          </span>
        ) : (
          <span
            id="fame-market-cap-error"
            role={invalid ? "alert" : "status"}
            aria-live="polite"
            className={invalid ? "text-[#e4cd96]" : "text-[#9f9789]"}
          >
            {calculation.message}
          </span>
        )}
      </p>
    </section>
  );
}
