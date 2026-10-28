import { type TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-xs font-semibold text-muted">
            {label}
          </label>
        )}
        <textarea
          id={id}
          ref={ref}
          className={cn(
            "w-full rounded-md border border-edge bg-card px-3 py-2 text-[13px] text-fg placeholder:text-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-hover transition-colors duration-150 resize-none",
            error && "border-danger-fg/60 focus:border-danger-fg focus:ring-danger-fg/15",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-danger-fg font-medium">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";