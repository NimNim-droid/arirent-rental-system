import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "@/components/ui/spinner";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, loading, children, ...props }, ref) => {
    const variants = {
      primary:
        "btn-primary bg-accent text-white shadow-soft hover:bg-accent-strong",
      secondary:
        "border border-edge bg-card text-fg-soft shadow-soft hover:bg-hover hover:border-edge-strong hover:text-fg",
      danger:
        "bg-danger-fg text-white shadow-soft hover:opacity-90",
      outline:
        "border border-accent-border bg-transparent text-accent hover:bg-accent-soft hover:border-accent",
      ghost:
        "text-muted hover:bg-hover hover:text-fg",
    };

    const sizes = {
      sm: "h-7 px-2.5 text-xs rounded-md gap-1.5",
      md: "h-8 px-3 text-xs sm:text-[13px] rounded-md gap-1.5",
      lg: "h-9 px-4 text-[13px] rounded-md gap-2",
    };

    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-colors duration-150 ease-out cursor-pointer disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-1 focus-visible:ring-offset-app",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading && <Spinner className="h-3.5 w-3.5" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";