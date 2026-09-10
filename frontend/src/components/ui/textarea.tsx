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
            "w-full rounded-xl border border-edge bg-inset px-3.5 py-2.5 text-sm text-fg placeholder:text-faint focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/25 disabled:cursor-not-allowed disabled:bg-hover transition-all duration-200 resize-none",
            error && "border-danger-border focus:border-danger-fg focus:ring-danger-fg/25",
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