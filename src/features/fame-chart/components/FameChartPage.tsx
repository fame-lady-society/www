"use client";

import { useState } from "react";
import type { Currency } from "../history";
import { FameShell } from "@/features/fame/components/FameShell";
import { useHistory } from "../useHistory";
import { MarketView } from "./MarketView";

function ChartContent() {
  const [currency, setCurrency] = useState<Currency>("USDC");
  const [selection, setSelection] = useState<string[]>(["market"]);
  const query = useHistory(currency, selection);
  return (
    <MarketView
      selection={selection}
      onSelectionChange={setSelection}
      loadingSeries={query.loadingSeries}
      currency={currency}
      onCurrencyChange={setCurrency}
      history={query.data}
      error={query.error}
      fetching={query.isFetching}
      onRefresh={() => {
        void query.refetch();
      }}
    />
  );
}

export function FameChartPage() {
  return (
    <FameShell title="FAME Chart" activeFamePage="chart">
      <div className="mx-auto max-w-[1320px] px-4 pb-16 pt-10 sm:px-8 sm:pt-14">
        <header className="mb-8">
          <h1 className="fame-display text-5xl sm:text-6xl">$FAME market</h1>
          <p className="mt-3 text-sm text-[#bdb4a4]">
            Price and trading volume across FAME pools on Base.
          </p>
        </header>
        <ChartContent />
      </div>
    </FameShell>
  );
}
