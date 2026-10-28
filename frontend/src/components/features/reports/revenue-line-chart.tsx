import { useId } from "react";
import { formatAxisMoney, niceCeiling } from "./chart-utils";

export interface RevenueLineSeries {
  key: string;
  label: string;
  color: string;
  values: number[];
}

interface RevenueLineChartProps {
  labels: string[];
  series: RevenueLineSeries[];
}

const WIDTH = 760;
const HEIGHT = 300;
const PADDING = { top: 18, right: 18, bottom: 34, left: 82 };

export function RevenueLineChart({ labels, series }: RevenueLineChartProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const rawMax = Math.max(1, ...series.flatMap((item) => item.values));
  const max = niceCeiling(rawMax);

  const x = (index: number) =>
    labels.length <= 1
      ? PADDING.left + plotWidth / 2
      : PADDING.left + (index / (labels.length - 1)) * plotWidth;

  const y = (value: number) =>
    PADDING.top + plotHeight - (Math.max(0, value) / max) * plotHeight;

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full min-w-[620px]"
        role="img"
        aria-label="Revenue overview by month"
      >
        <defs>
          {series.map((item) => (
            <linearGradient
              key={item.key}
              id={`${uid}-${item.key}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={item.color} stopOpacity="0.16" />
              <stop offset="100%" stopColor={item.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {Array.from({ length: 5 }).map((_, index) => {
          const gridY = PADDING.top + (plotHeight / 4) * index;
          const gridValue = max - (max / 4) * index;

          return (
            <g key={index}>
              <line
                x1={PADDING.left}
                x2={WIDTH - PADDING.right}
                y1={gridY}
                y2={gridY}
                stroke="var(--edge)"
                strokeDasharray={index === 4 ? undefined : "3 5"}
              />
              <text
                x={PADDING.left - 12}
                y={gridY + 4}
                textAnchor="end"
                fontSize="10"
                fill="var(--muted)"
              >
                {formatAxisMoney(gridValue)}
              </text>
            </g>
          );
        })}

        {labels.map((label, index) => (
          <text
            key={`${label}-${index}`}
            x={x(index)}
            y={HEIGHT - 10}
            textAnchor="middle"
            fontSize="10"
            fill="var(--muted)"
          >
            {label}
          </text>
        ))}

        {series.map((item) => {
          const points = item.values
            .map((value, index) => `${x(index)},${y(value)}`)
            .join(" ");
          const areaPoints = [
            `${PADDING.left},${PADDING.top + plotHeight}`,
            points,
            `${x(item.values.length - 1)},${PADDING.top + plotHeight}`,
          ].join(" ");

          return (
            <g key={item.key}>
              <polygon points={areaPoints} fill={`url(#${uid}-${item.key})`} />
              <polyline
                points={points}
                fill="none"
                stroke={item.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {item.values.map(
                (value, index) =>
                  value > 0 && (
                    <circle
                      key={index}
                      cx={x(index)}
                      cy={y(value)}
                      r="3"
                      fill="var(--card)"
                      stroke={item.color}
                      strokeWidth="2"
                    >
                      <title>{`${labels[index]} · ${item.label}: ${formatAxisMoney(value)}`}</title>
                    </circle>
                  )
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
