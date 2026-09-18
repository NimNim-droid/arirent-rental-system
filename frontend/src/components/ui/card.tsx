import type { CSSProperties, DragEvent, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  style?: CSSProperties;
  onDragOver?: (e: DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: DragEvent<HTMLDivElement>) => void;
}

export function Card({ children, className, onClick, style, onDragOver, onDrop }: CardProps) {
  return (
    <div
      onClick={onClick}
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={style}
      className={cn(
        "rounded-xl border border-edge bg-card shadow-soft transition-all duration-150",
        onClick &&
          "cursor-pointer hover:border-edge-strong hover:bg-hover/20",
        className
      )}
    >
      {children}
    </div>
  );
}