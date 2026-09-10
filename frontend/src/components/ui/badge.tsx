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
    success: "bg-success-bg text-success-fg border-success-border ring-success-border",
    warning: "bg-warning-bg text-warning-fg border-warning-border ring-warning-border",
    danger: "bg-danger-bg text-danger-fg border-danger-border ring-danger-border",
    info: "bg-info-bg text-info-fg border-info-border ring-info-border",
    neutral: "bg-neutral-bg text-neutral-fg border-neutral-border ring-neutral-border",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ring-1 ring-inset animate-fade-in transition-transform duration-200 hover:scale-105",
        variants[variant],
        className
      )}
    >
      {dot && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}