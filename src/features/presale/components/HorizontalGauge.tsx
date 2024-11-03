import { FC } from "react";

type HorizontalGaugeProps = {
  value: number; // The value to display, should be between 0 and 100.
  max: number; // The maximum value the gauge can represent.
  ticks?: number; // Optional number of ticks to show along the x-axis.
  rightLabel?: string;
};

export const HorizontalGauge: FC<HorizontalGaugeProps> = ({
  value,
  max,
  ticks = 5,
  rightLabel,
}) => {
  const fillPercentage = Math.min(Math.max(value / max, 0), 1) * 100;
  const tickMarks = Array.from(
    { length: ticks + 1 },
    (_, index) => index * (max / ticks),
  );

  return (
    <div className="w-full max-w-lg">
      <div className="flex items-center">
        <div className="flex-grow">
          {/* Gauge Box */}
          <div className="relative h-8 border border-gray-400 rounded-md overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-blue-500"
              style={{ width: `${fillPercentage}%` }}
            ></div>
          </div>
          {/* X-axis Labels with Ticks */}
          <div className="flex justify-between mt-2 text-sm text-gray-700">
            {tickMarks.map((tick, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="w-px h-2 bg-gray-400"></div>
                <span>{Math.round(tick)}</span>
              </div>
            ))}
          </div>
        </div>
        {rightLabel && (
          <div className="ml-4 text-sm text-gray-700">{rightLabel}</div>
        )}
      </div>
    </div>
  );
};
