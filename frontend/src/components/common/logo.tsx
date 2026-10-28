import { cn } from "@/lib/cn";

export interface LogoProps {
  variant?: "full" | "mark" | "text";
  size?: "sm" | "md" | "lg";
  subtitle?: string;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

const MARK_SIZES = {
  sm: "h-7 w-7",
  md: "h-9 w-9",
  lg: "h-11 w-11",
};

const WORD_SIZES = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
};

const SUBTITLE_SIZES = {
  sm: "text-[9px]",
  md: "text-[10px]",
  lg: "text-xs",
};

/**
 * AriRent mark — opaque navy tile, white roofline, gold house.
 * Shapes copied byte-for-byte from the official brand SVG
 * (navy #1B2A4A, porcelain roof #F1F4F9, gold #C9A24B).
 * The tile carries its own background, so it holds up on both
 * light and dark surfaces; a faint ring separates it in dark mode.
 */
export function AriRentMark({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      role="img"
      aria-label="AriRent"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        "shrink-0 rounded-[25%] ring-1 ring-edge dark:ring-white/15",
        MARK_SIZES[size],
        className
      )}
    >
      <rect x="0" y="0" width="120" height="120" rx="30" fill="#1B2A4A" />
      <path
        d="M28 84 L60 34 L92 84"
        fill="none"
        stroke="#F1F4F9"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="60" cy="67" r="7" fill="#C9A24B" />
      <rect x="56.5" y="69" width="7" height="15" rx="3.5" fill="#C9A24B" />
    </svg>
  );
}

/**
 * AriRent logo lockup.
 * Icon is the official mark; the wordmark is live text so it reads in
 * both themes ("Ari" in theme ink, "Rent" in brand gold).
 */
export function Logo({
  variant = "full",
  size = "md",
  subtitle,
  className,
  iconClassName,
  textClassName,
}: LogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      {variant !== "text" && <AriRentMark size={size} className={iconClassName} />}

      {variant !== "mark" && (
        <div className={cn("min-w-0 leading-tight", textClassName)}>
          <div
            className={cn(
              "flex items-baseline gap-0.5 font-bold tracking-tight",
              WORD_SIZES[size]
            )}
          >
            <span className="text-fg">Ari</span>
            <span className="text-[#C9A24B]">Rent</span>
          </div>
          {subtitle && (
            <span
              className={cn(
                "block font-medium text-muted print:hidden",
                SUBTITLE_SIZES[size]
              )}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
