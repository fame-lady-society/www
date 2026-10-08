"use client";

import { useEffect, useRef } from "react";
import {
  LineSeries,
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import {
  chartSeries,
  formatAxisNumber,
  refreshedViewport,
  timeLabel,
  seriesColor,
} from "../presentation";
import { INTERVAL, type Currency, type History } from "../history";

export function MarketCanvas({
  history,
  currency,
  poolIds,
  hours,
  reset,
  onSelect,
  onLoadOlder,
  preview = false,
}: {
  history: History;
  currency: Currency;
  poolIds: string[];
  hours: number;
  reset: number;
  onSelect: (timestamp: number | null) => void;
  onLoadOlder?: () => void;
  preview?: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi | null>(null);
  const rendered = useRef(
    new Map<
      string,
      {
        price: ISeriesApi<"Line">;
        candle: ISeriesApi<"Candlestick">;
        volume: ISeriesApi<"Histogram">;
      }
    >(),
  );
  const previous = useRef<History | null>(null);
  const previousSelection = useRef<string | null>(null);
  const selection = useRef<number | null>(null);
  const updating = useRef(false);
  const latest = useRef({ history, onSelect, onLoadOlder });
  useEffect(() => {
    latest.current = { history, onSelect, onLoadOlder };
  }, [history, onSelect, onLoadOlder]);

  useEffect(() => {
    const seriesMap = rendered.current;
    const element = container.current!;
    const api = createChart(container.current!, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "#0d0c0a" },
        textColor: "#bdb4a4",
        fontFamily: "Arial, sans-serif",
        attributionLogo: true,
        panes: {
          separatorColor: "#3b3323",
          separatorHoverColor: "#c9aa67",
          enableResize: !preview,
        },
      },
      grid: { vertLines: { visible: false }, horzLines: { color: "#252119" } },
      rightPriceScale: { borderColor: "#3b3323", minimumWidth: 86 },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: "#3b3323",
        minBarSpacing: 0.5,
        tickMarkFormatter: (time: number) => timeLabel(time),
      },
      localization: {
        locale: "en-GB",
        timeFormatter: (time: number) => `${timeLabel(time, true)} UTC`,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "#c9aa67" },
        horzLine: { color: "#c9aa67" },
      },
      handleScroll: preview ? false : { vertTouchDrag: false },
      handleScale: !preview,
    });
    chart.current = api;
    // Freeze the displayed scales before a pan or wheel gesture changes time.
    // Currency/series changes and explicit range presets fit them again.
    const lockPriceScales = () => {
      const item = seriesMap.values().next().value;
      if (!item) return;
      item.price.priceScale().applyOptions({ autoScale: false });
      item.volume.priceScale().applyOptions({ autoScale: false });
    };
    element.addEventListener("pointerdown", lockPriceScales, { capture: true });
    element.addEventListener("wheel", lockPriceScales, {
      capture: true,
      passive: true,
    });
    const crosshair = (event: {
      time?: unknown;
      logical?: number | null;
      point?: unknown;
    }) => {
      if (updating.current) return;
      const current = latest.current;
      const timestamp =
        typeof event.time === "number"
          ? event.time
          : event.point && event.logical !== undefined && event.logical !== null
            ? current.history.buckets[Math.round(event.logical)]?.timestamp ??
              null
            : null;
      selection.current = timestamp;
      current.onSelect(timestamp);
    };
    const visibleRange = (range: { from: number; to: number } | null) => {
      if (!updating.current && range && range.from < 12)
        latest.current.onLoadOlder?.();
    };
    api.timeScale().subscribeVisibleLogicalRangeChange(visibleRange);
    api.subscribeCrosshairMove(crosshair);
    return () => {
      element.removeEventListener("pointerdown", lockPriceScales, true);
      element.removeEventListener("wheel", lockPriceScales, true);
      api.timeScale().unsubscribeVisibleLogicalRangeChange(visibleRange);
      api.unsubscribeCrosshairMove(crosshair);
      api.remove(); // Also disconnects the library's autoSize ResizeObserver.
      chart.current = null;
      seriesMap.clear();
      previous.current = null;
      previousSelection.current = null;
    };
  }, [preview]);

  useEffect(() => {
    const api = chart.current!;
    const visible = api.timeScale().getVisibleLogicalRange();
    const old = previous.current;
    updating.current = true;
    for (const [id, item] of rendered.current) {
      if (!poolIds.includes(id)) {
        api.removeSeries(item.price);
        api.removeSeries(item.candle);
        api.removeSeries(item.volume);
        rendered.current.delete(id);
      }
    }
    const datasets = poolIds.map((id) => ({ id, ...chartSeries(history, id) }));
    const values = datasets.flatMap((s) =>
      s.prices.flatMap((p) => ("value" in p ? [p.value] : [])),
    );
    const smallest = values.length
      ? Math.min(...values)
      : currency === "ETH"
        ? 1e-8
        : 1e-4;
    const priceFormat = {
      type: "custom" as const,
      minMove: 10 ** Math.max(-18, Math.floor(Math.log10(smallest)) - 5),
      formatter: formatAxisNumber,
    };
    for (const series of datasets) {
      const color = seriesColor(series.id);
      let item = rendered.current.get(series.id);
      if (!item) {
        item = {
          candle: api.addSeries(CandlestickSeries, {
            lastValueVisible: false,
            priceLineVisible: false,
          }),
          price: api.addSeries(LineSeries, {
            color,
            lineVisible: false,
            pointMarkersVisible: true,
            pointMarkersRadius: 2,
            lastValueVisible: false,
            priceLineVisible: false,
          }),
          volume: api.addSeries(
            HistogramSeries,
            { lastValueVisible: false, priceLineVisible: false },
            1,
          ),
        };
        rendered.current.set(series.id, item);
      }
      const comparing = poolIds.length > 1;
      item.candle.applyOptions({
        priceFormat,
        upColor: comparing ? color : "#67bf95",
        downColor: comparing ? color : "#ff3b3b",
        borderUpColor: comparing ? color : "#67bf95",
        borderDownColor: comparing ? color : "#ff3b3b",
        wickUpColor: comparing ? color : "#67bf95",
        wickDownColor: comparing ? color : "#ff3b3b",
      });
      item.price.applyOptions({ priceFormat });
      item.candle.setData(
        series.candles.map((p) =>
          "close" in p && comparing
            ? {
                ...p,
                color: p.color === "transparent" ? "transparent" : color,
                borderColor: color,
                wickColor: color,
              }
            : p,
        ),
      );
      item.price.setData(series.prices);
      item.volume.applyOptions({
        priceFormat: {
          type: "custom",
          minMove: currency === "ETH" ? 1e-8 : 0.01,
          formatter: formatAxisNumber,
        },
      });
      item.volume.setData(
        series.volumes.map((p) =>
          "value" in p ? { ...p, color: `${color}88` } : p,
        ),
      );
    }
    api.panes()[0]?.setStretchFactor(4);
    api.panes()[1]?.setStretchFactor(1);
    const selectionKey = `${currency}:${poolIds.join(",")}`;
    if (previousSelection.current !== selectionKey) {
      for (const item of rendered.current.values()) {
        item.price.priceScale().applyOptions({ autoScale: true });
        item.volume.priceScale().applyOptions({ autoScale: true });
      }
      previousSelection.current = selectionKey;
    }
    if (visible && old)
      api
        .timeScale()
        .setVisibleLogicalRange(refreshedViewport(visible, old, history));
    previous.current = history;
    // Keep the selected timestamp through currency changes and boundary rewrites.
    const selected = history.buckets.find(
      (b) => b.timestamp === selection.current,
    );
    if (selected) {
      const active = datasets.find((s) =>
        s.prices.some((p) => p.time === selected.timestamp && "value" in p),
      );
      const point = active?.prices.find((p) => p.time === selected.timestamp);
      if (point && "value" in point)
        api.setCrosshairPosition(
          point.value,
          selected.timestamp as UTCTimestamp,
          rendered.current.get(active!.id)!.price,
        );
      else api.clearCrosshairPosition();
    } else api.clearCrosshairPosition();
    updating.current = false;
  }, [history, currency, poolIds]);

  useEffect(() => {
    const length = latest.current.history.buckets.length;
    for (const item of rendered.current.values()) {
      item.price.priceScale().applyOptions({ autoScale: true });
      item.volume.priceScale().applyOptions({ autoScale: true });
    }
    chart.current!.timeScale().setVisibleLogicalRange({
      from: length - (hours * 3600) / INTERVAL - 0.5,
      to: length - 0.5,
    });
  }, [hours, reset]);

  return (
    <div
      ref={container}
      className={
        preview
          ? "h-[260px] w-full sm:h-[320px]"
          : "h-[390px] w-full sm:h-[480px]"
      }
      role="img"
      aria-label={`FAME ${currency} five-minute spot candles and volume. Use the data table below for values.`}
    />
  );
}
