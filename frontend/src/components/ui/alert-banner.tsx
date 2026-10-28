import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle, AlertCircle, Info, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export type AlertVariant = "danger" | "error" | "success" | "warning" | "info";

interface AlertBannerProps {
  variant?: AlertVariant;
  message?: ReactNode;
  onRetry?: () => void;
  onClose?: () => void;
  className?: string;
}

const VARIANT_STYLES: Record<
  AlertVariant,
  { container: string; icon: typeof AlertTriangle; iconClass: string }
> = {
  danger: {
    container: "border-danger-border bg-danger-bg text-danger-fg",
    icon: AlertTriangle,
    iconClass: "text-danger-fg",
  },
  error: {
    container: "border-danger-border bg-danger-bg text-danger-fg",
    icon: AlertTriangle,
    iconClass: "text-danger-fg",
  },
  success: {
    container: "border-success-border bg-success-bg text-success-fg",
    icon: CheckCircle,
    iconClass: "text-success-fg",
  },
  warning: {
    container: "border-warning-border bg-warning-bg text-warning-fg",
    icon: AlertCircle,
    iconClass: "text-warning-fg",
  },
  info: {
    container: "border-info-border bg-info-bg text-info-fg",
    icon: Info,
    iconClass: "text-info-fg",
  },
};

export function AlertBanner({
  variant = "danger",
  message,
  onRetry,
  onClose,
  className,
}: AlertBannerProps) {
  if (!message) return null;

  const style = VARIANT_STYLES[variant];
  const Icon = style.icon;

  return (
    <div
      role="status"
      className={cn(
        "flex animate-fade-in items-center justify-between gap-3 rounded-md border px-4 py-2.5 text-xs sm:text-[13px]",
        style.container,
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <Icon className={cn("h-4 w-4 shrink-0 sm:h-5 sm:w-5", style.iconClass)} />
        <span className="truncate break-words">{message}</span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {onRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry} className="h-8 px-2 text-xs">
            <RefreshCw className="mr-1 h-3.5 w-3.5" />
            Retry
          </Button>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Dismiss alert"
            className="rounded-md p-1 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
