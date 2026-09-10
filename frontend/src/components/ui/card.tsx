import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  style?: CSSProperties;
}

export function Card({ children, className, onClick, style }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={cn(
        "rounded-2xl border border-edge bg-card shadow-card transition-all duration-300 ease-out hover:shadow-pop",
        onClick &&
          "cursor-pointer hover:-translate-y-0.5 hover:border-edge-strong",
        className
      )}
    >
      {children}
    </div>
  );
}