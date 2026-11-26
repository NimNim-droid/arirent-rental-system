import { useId } from "react";
import { formatAxisMoney, niceCeiling } from "./chart-utils";

export interface RevenueBarPoint {
  label: string;
  value: number;
}

interface RevenueBarChartProps {
  points: RevenueBarPoint[];
}

const WIDTH = 720;
const HEIGHT = 250;
const PADDING = { top: 26, right: 16, bottom: 32, left: 74 };

export function RevenueBarChart({ points }: RevenueBarChartProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const rawMax = Math.max(1, ...points.map((point) => point.value));
  const max = niceCeiling(rawMax);
  const slotWidth = plotWidth / Math.max(points.length, 1);
  const barWidth = Math.min(44, Math.max(14, slotWidth * 0.52));

  const y = (value: number) =>
    PADDING.top + plotHeight - (Math.max(0, value) / max) * plotHeight;

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full min-w-[440px]"
        role="img"
        aria-label="Revenue by period"
      >
        <defs>
          <linearGradient id={`${uid}-bar`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.72" />
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
                strokeDasharray={index === 4 ? undefined : "2 4"}
              />
              <text
                x={PADDING.left - 10}
                y={gridY + 3.5}
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
              {point.value > 0 ? (
                <rect
                  x={centerX - barWidth / 2}
                  y={barY}
                  width={barWidth}
                  height={Math.max(2, barHeight)}
                  rx="4"
                  fill={`url(#${uid}-bar)`}
                >
                  <title>{`${point.label}: ${formatAxisMoney(point.value)}`}</title>
                </rect>
              ) : (
                <rect
                  x={centerX - barWidth / 2}
                  y={PADDING.top + plotHeight - 2}
                  width={barWidth}
                  height={2}
                  rx="1"
                  fill="var(--edge-strong)"
                  opacity="0.45"
                >
                  <title>{`${point.label}: ₱ 0`}</title>
                </rect>
              )}
              {point.value > 0 && (
                <text
                  x={centerX}
                  y={barY - 7}
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
                y={HEIGHT - 10}
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
