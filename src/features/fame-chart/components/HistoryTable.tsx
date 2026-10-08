import { memo } from "react";
import type { Bucket, Currency } from "../history";
import {
  bucketStatus,
  formatDecimal,
  selectedPool,
  timeLabel,
  poolLabel,
  MARKET,
} from "../presentation";
export const HistoryTable = memo(function HistoryTable({
  rows,
  currency,
  poolId,
}: {
  rows: Bucket[];
  currency: Currency;
  poolId: string;
}) {
  return (
    <div
      className="max-h-96 overflow-auto"
      tabIndex={0}
      role="region"
      aria-label="Sampled price data"
    >
      <table className="w-full text-left text-xs tabular-nums">
        <caption className="py-3 text-left">
          Five-minute sampled history · {poolLabel(poolId)} · UTC
        </caption>
        <thead>
          <tr>
            {[
              "Time",
              `Price (${currency})`,
              `Volume (${currency})`,
              `Inventory (${currency})`,
              "Executions",
              "Status",
            ].map((name) => (
              <th key={name} scope="col" className="px-3 py-3">
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.toReversed().map((b) => {
            const p = selectedPool(b, poolId);
            return (
              <tr key={b.timestamp} className="border-t border-[#c9aa67]/10">
                <th
                  scope="row"
                  className="whitespace-nowrap px-3 py-3 font-normal"
                >
                  {timeLabel(b.timestamp, true)}
                </th>
                {poolId === MARKET ? (
                  <>
                    <td className="px-3 py-3">{formatDecimal(p?.price)}</td>
                    <td className="px-3 py-3">
                      {formatDecimal(b.totals.volume.value)}
                    </td>
                    <td className="px-3 py-3">
                      {formatDecimal(b.totals.inventory.value)}
                      {b.totals.inventory.status === "partial"
                        ? " (partial)"
                        : ""}
                    </td>
                  </>
                ) : (
                  [p?.price, p?.volume, p?.inventory].map((v, i) => (
                    <td key={i} className="px-3 py-3" title={v ?? undefined}>
                      {formatDecimal(v)}
                    </td>
                  ))
                )}
                <td className="px-3 py-3">
                  {(poolId === MARKET ? b.totals.tradeCount : p?.tradeCount) ??
                    "Unavailable"}
                </td>
                <td className="px-3 py-3">{bucketStatus(b, poolId)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});
