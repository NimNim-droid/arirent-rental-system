import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface BadgeProps {
  children: ReactNode;
  variant?: "success" | "warning" | "danger" | "info" | "neutral";
  className?: string;
}

export function Badge({ children, variant = "neutral", className }: BadgeProps) {
  const variants = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    warning: "bg-amber-50 text-amber-700 border-amber-200/60",
    danger: "bg-red-50 text-red-700 border-red-200/60",
    info: "bg-sky-50 text-sky-700 border-sky-200/60",
    neutral: "bg-slate-100 text-slate-700 border-slate-200/80",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
