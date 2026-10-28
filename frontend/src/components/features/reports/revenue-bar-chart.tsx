import { useId } from "react";
import { formatAxisMoney, niceCeiling } from "./chart-utils";

export interface RevenueBarPoint {
  label: string;
  value: number;
}

interface RevenueBarChartProps {
  points: RevenueBarPoint[];
}

const WIDTH = 760;
const HEIGHT = 300;
const PADDING = { top: 28, right: 18, bottom: 38, left: 82 };

export function RevenueBarChart({ points }: RevenueBarChartProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const rawMax = Math.max(1, ...points.map((point) => point.value));
  const max = niceCeiling(rawMax);
  const slotWidth = plotWidth / Math.max(points.length, 1);
  const barWidth = Math.min(54, slotWidth * 0.56);

  const y = (value: number) =>
    PADDING.top + plotHeight - (Math.max(0, value) / max) * plotHeight;

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full min-w-[560px]"
        role="img"
        aria-label="Revenue by period"
      >
        <defs>
          <linearGradient id={`${uid}-bar`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
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

        {points.map((point, index) => {
          const centerX = PADDING.left + slotWidth * index + slotWidth / 2;
          const barY = y(point.value);
          const barHeight = PADDING.top + plotHeight - barY;

          return (
            <g key={`${point.label}-${index}`}>
              <rect
                x={centerX - barWidth / 2}
                y={barY}
                width={barWidth}
                height={Math.max(0, barHeight)}
                rx="5"
                fill={`url(#${uid}-bar)`}
              >
                <title>{`${point.label}: ${formatAxisMoney(point.value)}`}</title>
              </rect>
              {point.value > 0 && (
                <text
                  x={centerX}
                  y={barY - 8}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="600"
                  fill="var(--fg-soft)"
                >
                  {formatAxisMoney(point.value)}
                </text>
              )}
              <text
                x={centerX}
                y={HEIGHT - 12}
                textAnchor="middle"
                fontSize="10"
                fill="var(--muted)"
              >
                {point.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
