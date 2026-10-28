import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/cn";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 text-center animate-fade-in",
        className
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-inset text-muted ring-1 ring-edge mb-1">
        {icon ?? <Inbox className="h-4 w-4" />}
      </div>
      <h3 className="mt-3 text-[13px] font-medium text-fg">{title}</h3>
      {description && <p className="mt-1 max-w-xs text-xs text-muted leading-relaxed">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}