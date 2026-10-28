import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface BadgeProps {
  children: ReactNode;
  variant?: "success" | "warning" | "danger" | "info" | "neutral";
  dot?: boolean;
  className?: string;
}

export function Badge({ children, variant = "neutral", dot = false, className }: BadgeProps) {
  const variants = {
    success: "bg-success-bg text-success-fg border-success-border",
    warning: "bg-warning-bg text-warning-fg border-warning-border",
    danger: "bg-danger-bg text-danger-fg border-danger-border",
    info: "bg-info-bg text-info-fg border-info-border",
    neutral: "bg-neutral-bg text-neutral-fg border-neutral-border",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-1.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {dot && <span aria-hidden="true" className="h-1 w-1 rounded-full bg-current shrink-0" />}
      {children}
    </span>
  );
}