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
        "btn-primary bg-accent text-white shadow-soft hover:bg-accent-strong active:scale-[0.98]",
      secondary:
        "border border-edge bg-card text-fg-soft shadow-soft hover:bg-hover hover:border-edge-strong hover:text-fg active:scale-[0.98]",
      danger:
        "bg-danger-fg text-white shadow-soft hover:opacity-90 active:scale-[0.98]",
      outline:
        "border border-accent-border bg-transparent text-accent hover:bg-accent-soft hover:border-accent active:scale-[0.98]",
      ghost:
        "text-muted hover:bg-hover hover:text-fg active:scale-[0.98]",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
      md: "h-9 px-3.5 text-xs sm:text-sm rounded-lg gap-2",
      lg: "h-11 px-5 text-sm rounded-xl gap-2.5",
    };

    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={cn(
          "inline-flex items-center justify-center font-semibold transition-all duration-200 ease-out cursor-pointer disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-app",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading && <Spinner className="h-4 w-4" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";