import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, ...props }, ref) => {
    const variants = {
      primary: "bg-sky-600 text-white hover:bg-sky-700 shadow-sm shadow-sky-600/20 active:bg-sky-800",
      secondary: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100",
      danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-600/20 active:bg-red-800",
      outline: "border border-sky-600 text-sky-600 hover:bg-sky-50 active:bg-sky-100",
      ghost: "text-slate-600 hover:bg-slate-100 active:bg-slate-200",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
      md: "h-10 px-4 text-sm rounded-xl gap-2",
      lg: "h-12 px-6 text-base rounded-xl gap-2.5",
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
