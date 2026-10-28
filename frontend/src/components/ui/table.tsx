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
        "border-b border-edge bg-inset text-xs font-medium text-muted",
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
  return <tbody className={cn("divide-y divide-edge text-[13px]", className)} {...props} />;
}

export function TableRow({
  className,
  index: _index,
  ...props
}: HTMLAttributes<HTMLTableRowElement> & { index?: number }) {
  return (
    <tr
      className={cn("transition-colors duration-100 hover:bg-hover/60", className)}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn("whitespace-nowrap px-3 py-2 font-medium text-xs text-muted", className)} {...props} />;
}

export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-3 py-2 align-middle text-[13px]", className)} {...props} />;
}