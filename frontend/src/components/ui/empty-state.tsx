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
        "flex flex-col items-center justify-center px-6 py-12 text-center animate-fade-in-up",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-inset text-muted ring-1 ring-inset ring-edge">
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>
      <h3 className="mt-3 text-sm font-bold text-fg">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-xs text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}