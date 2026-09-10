import type {
  CSSProperties,
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cn("w-full text-left border-collapse", className)} {...props} />;
}

export function TableHeader({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn(
        "border-b border-edge bg-inset text-[11px] font-bold uppercase tracking-wider text-muted",
        className
      )}
      {...props}
    />
  );
}

export function TableBody({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-edge text-sm", className)} {...props} />;
}

export function TableRow({
  className,
  index,
  ...props
}: HTMLAttributes<HTMLTableRowElement> & { index?: number }) {
  return (
    <tr
      className={cn("transition-colors duration-150 hover:bg-hover", index !== undefined && "animate-fade-in-up", className)}
      style={index !== undefined ? ({ animationDelay: `${index * 50}ms` } as CSSProperties) : undefined}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn("whitespace-nowrap p-4 font-bold", className)} {...props} />;
}

export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("p-4 align-middle", className)} {...props} />;
}