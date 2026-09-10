import { type SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-xs font-semibold text-muted">
            {label}
          </label>
        )}
        <select
          id={id}
          ref={ref}
          className={cn(
            "w-full rounded-xl border border-edge bg-inset px-3.5 py-2.5 text-sm text-fg focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/25 disabled:cursor-not-allowed disabled:bg-hover transition-all duration-200 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-10",
            error && "border-danger-border focus:border-danger-fg focus:ring-danger-fg/25",
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs text-danger-fg font-medium">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";