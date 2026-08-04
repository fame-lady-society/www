"use client";

import { useState } from "react";

export type DisplayState = {
  value: string | null;
  note: string;
  asOf?: string;
};
export type CurrencyBoard = Record<
  "FAME" | "USDC" | "ETH",
  { buy: DisplayState; sell: DisplayState }
>;

function Value({ state }: { state: DisplayState }) {
  return (
    <>
      <p className="mt-3 text-2xl font-semibold tabular-nums text-[#fff5d8]">
        {state.value ?? "Unavailable"}
      </p>
      <p className="mt-2 text-sm text-[#c6b98b]">{state.note}</p>
      {state.asOf ? (
        <time
          className="mt-2 block text-xs text-[#a99d76]"
          dateTime={state.asOf}
        >
          As of {new Date(state.asOf).toLocaleString()}
        </time>
      ) : null}
    </>
  );
}

export function FameMarketBoard({ currencies }: { currencies: CurrencyBoard }) {
  const [currency, setCurrency] = useState<keyof CurrencyBoard>("FAME");
  const prices = currencies[currency];
  return (
    <section aria-label="FAME Society market board">
      <div
        role="radiogroup"
        aria-label="Society price currency"
        className="mb-5 flex gap-2"
      >
        {(Object.keys(currencies) as Array<keyof CurrencyBoard>).map(
          (option) => (
            <label key={option} className="cursor-pointer">
              <input
                type="radio"
                name="fame-currency"
                value={option}
                checked={currency === option}
                onChange={() => setCurrency(option)}
                className="sr-only peer"
              />
              <span className="inline-flex min-h-11 items-center border border-[#8e762c] px-4 text-sm text-[#c6b98b] peer-checked:border-[#f5d46d] peer-checked:bg-[#2c2511] peer-checked:text-[#fff5d8] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-[#f5d46d]">
                {option}
              </span>
            </label>
          ),
        )}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <article className="border border-[#8e762c] p-4">
          <h2 className="text-xs font-bold tracking-[.14em] text-[#f5d46d]">
            BUY A FAME SOCIETY NFT FOR
          </h2>
          <Value state={prices.buy} />
        </article>
        <article className="border border-[#8e762c] p-4">
          <h2 className="text-xs font-bold tracking-[.14em] text-[#f5d46d]">
            SELL A FAME SOCIETY NFT FOR
          </h2>
          <Value state={prices.sell} />
        </article>
      </div>
    </section>
  );
}
