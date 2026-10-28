import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface SectionHeaderProps {
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: string;
  action?: ReactNode;
  dot?: boolean;
  dotClassName?: string;
  className?: string;
}

export function SectionHeader({
  icon,
  title,
  subtitle,
  action,
  dot = false,
  dotClassName,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3",
        className
      )}
    >
      <div className="flex items-center gap-2">
        {icon && (
          <span className="shrink-0 text-muted">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-fg">
            {dot && (
              <span className={cn("inline-flex h-2 w-2 rounded-full bg-accent", dotClassName)} />
            )}
            {title}
          </h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex shrink-0 items-center gap-3">{action}</div>}
    </div>
  );
}