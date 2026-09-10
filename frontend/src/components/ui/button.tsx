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
        "btn-primary bg-gradient-to-b from-indigo-500 via-indigo-600 to-indigo-700 text-white ring-1 ring-inset ring-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_0_0_1px_rgba(129,140,248,0.2),0_4px_16px_-6px_rgba(99,102,241,0.45)] hover:from-indigo-400 hover:via-indigo-500 hover:to-indigo-600 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_0_0_1px_rgba(129,140,248,0.25),0_8px_32px_-8px_rgba(99,102,241,0.5)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
      secondary:
        "border border-edge bg-card text-fg-soft shadow-soft hover:bg-hover hover:border-edge-strong hover:text-fg active:scale-[0.98]",
      danger:
        "bg-gradient-to-b from-red-500 to-red-600 text-white ring-1 ring-inset ring-white/20 shadow-md shadow-red-950/30 hover:from-red-400 hover:to-red-500 active:scale-[0.98]",
      outline:
        "border border-accent-border bg-transparent text-accent hover:bg-accent-soft/60 hover:border-accent hover:text-accent-strong active:scale-[0.98]",
      ghost:
        "text-muted hover:bg-hover hover:text-fg active:scale-[0.98]",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
      md: "h-10 px-4 text-sm rounded-xl gap-2",
      lg: "h-12 px-6 text-base rounded-xl gap-2.5",
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