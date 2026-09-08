import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-xs backdrop-blur-sm transition-all duration-150",
        onClick && "cursor-pointer hover:shadow-md hover:border-slate-300",
        className
      )}
    >
      {children}
    </div>
  );
}
