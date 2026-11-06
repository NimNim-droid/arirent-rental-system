import { cn } from "@/lib/cn";

export interface LogoProps {
  variant?: "full" | "mark" | "text";
  size?: "sm" | "md" | "lg";
  subtitle?: string;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

/**
 * AriRent Crest Icon (Security Shield + Gold Key)
 */
export function AriRentIcon({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-11 w-11",
  };

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-xl p-1 shadow-md transition-all duration-200",
        // Light mode: Clean high-contrast subtle porcelain/cobalt backdrop so the navy shield pops
        "bg-gradient-to-b from-blue-50/90 to-white border border-blue-200/70 shadow-blue-900/5 ring-1 ring-blue-500/10",
        // Dark mode: Deep midnight gradient with electric blue rim so the crest glows
        "dark:bg-gradient-to-b dark:from-[#132247] dark:to-[#091124] dark:border-blue-500/30 dark:shadow-blue-950/60 dark:ring-blue-400/20",
        sizeClasses[size],
        className
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 260 260"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full drop-shadow-sm transition-transform duration-200"
      >
        {/* Shield Body */}
        <path
          d="M130 38 L202 67 L202 142 C202 189 169 217 130 231 C91 217 58 189 58 142 L58 67 Z"
          className="fill-[#1B2A4A] dark:fill-[#1e40af]"
        />
        {/* Shield Inner Rim Highlight */}
        <path
          d="M130 46 L194 72 L194 140 C194 181 165 206 130 220 C95 206 66 181 66 140 L66 72 Z"
          stroke="#C9A24B"
          strokeWidth="3.5"
          strokeOpacity="0.8"
          className="dark:stroke-[#fbbf24] dark:stroke-opacity-90"
        />
        {/* Key Head / Ring */}
        <circle
          cx="130"
          cy="118"
          r="20"
          fill="none"
          stroke="#C9A24B"
          strokeWidth="9"
          className="dark:stroke-[#fbbf24]"
        />
        {/* Key Stem */}
        <rect
          x="122"
          y="130"
          width="16"
          height="46"
          rx="2"
          fill="#C9A24B"
          className="dark:fill-[#fbbf24]"
        />
        {/* Key Bit / Teeth */}
        <rect
          x="138"
          y="152"
          width="8"
          height="6"
          rx="1"
          fill="#C9A24B"
          className="dark:fill-[#fbbf24]"
        />
        <rect
          x="138"
          y="164"
          width="10"
          height="6"
          rx="1"
          fill="#C9A24B"
          className="dark:fill-[#fbbf24]"
        />
      </svg>
    </div>
  );
}

/**
 * Main AriRent Logo Component
 */
export function Logo({
  variant = "full",
  size = "md",
  subtitle,
  className,
  iconClassName,
  textClassName,
}: LogoProps) {
  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  };

  const subtitleSizes = {
    sm: "text-[9px]",
    md: "text-[10px]",
    lg: "text-xs",
  };

  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      {variant !== "text" && (
        <AriRentIcon size={size} className={iconClassName} />
      )}

      {variant !== "mark" && (
        <div className={cn("min-w-0 leading-tight", textClassName)}>
          <div
            className={cn(
              "font-extrabold tracking-tight text-fg flex items-baseline gap-0.5",
              textSizes[size]
            )}
          >
            <span>Ari</span>
            <span className="text-[#C9A24B] dark:text-[#fbbf24]">Rent</span>
          </div>
          {subtitle && (
            <span
              className={cn(
                "block font-bold uppercase tracking-wider text-accent truncate",
                subtitleSizes[size]
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
