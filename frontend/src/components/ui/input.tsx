import {
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  forwardRef,
} from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, icon, type = "text", ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const resolvedType = isPassword && showPassword ? "text" : type;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-xs font-semibold text-muted">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint">
              {icon}
            </span>
          )}
          <input
            id={id}
            ref={ref}
            type={resolvedType}
            className={cn(
              "w-full rounded-xl border border-edge bg-inset px-3.5 py-2.5 text-sm text-fg placeholder:text-faint focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/25 disabled:cursor-not-allowed disabled:bg-hover disabled:text-faint transition-all duration-200",
              icon && "pl-10",
              isPassword && "pr-11",
              error && "border-danger-border focus:border-danger-fg focus:ring-danger-fg/25",
              className
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-hover hover:text-fg transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
        {error && <p className="flex items-center gap-1 text-xs text-danger-fg font-medium">{error}</p>}
        {helperText && !error && <p className="text-xs text-muted">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";