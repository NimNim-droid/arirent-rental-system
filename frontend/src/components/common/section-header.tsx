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
      <div className="flex items-center gap-2.5">
        {icon && (
          <span className="flex p-2 shrink-0 rounded-xl bg-accent-soft text-accent ring-1 ring-inset ring-accent-border">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-fg">
            {dot && (
              <span className={cn("relative flex h-2.5 w-2.5", dotClassName)}>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-current" />
              </span>
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