export interface DonutSegment {
  key: string;
  label: string;
  value: number;
  color: string;
  meta: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  centerValue: string;
  centerLabel: string;
}

const SIZE = 220;
const RADIUS = 82;
const STROKE = 30;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function DonutChart({ segments, centerValue, centerLabel }: DonutChartProps) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      <div className="relative h-48 w-48 shrink-0 sm:h-52 sm:w-52">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="h-full w-full"
          role="img"
          aria-label={centerLabel}
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--edge)"
            strokeWidth={STROKE}
          />
          <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
            {segments.map((segment) => {
              const fraction = total > 0 ? segment.value / total : 0;
              const length = fraction * CIRCUMFERENCE;
              const gap = length > 2 ? 2 : 0;
              const dash = Math.max(0, length - gap);
              const dashOffset = -offset;

              offset += length;

              if (fraction <= 0) {
                return null;
              }

              return (
                <circle
                  key={segment.key}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={STROKE}
                  strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="butt"
                >
                  <title>{`${segment.label}: ${segment.meta}`}</title>
                </circle>
              );
            })}
          </g>
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
          <span className="text-lg font-extrabold tracking-tight text-fg tabular-nums sm:text-xl">
            {centerValue}
          </span>
          <span className="mt-0.5 text-[11px] font-medium text-muted">{centerLabel}</span>
        </div>
      </div>

      <ul className="w-full min-w-0 flex-1 space-y-3">
        {segments.map((segment) => {
          const percentage = total > 0 ? (segment.value / total) * 100 : 0;

          return (
            <li key={segment.key} className="flex items-center gap-2.5 text-xs">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="min-w-0 flex-1 truncate font-semibold text-fg-soft">
                {segment.label}
              </span>
              <span className="shrink-0 text-muted tabular-nums">{segment.meta}</span>
              <span className="w-12 shrink-0 text-right font-bold text-fg tabular-nums">
                {percentage.toFixed(1)}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
