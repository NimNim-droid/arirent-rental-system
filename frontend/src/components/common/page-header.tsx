import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, icon, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-6 mb-2 border-b border-edge animate-fade-in-up">
      <div className="flex min-w-0 items-start gap-3">
        {icon && <div className="shrink-0 pt-0.5">{icon}</div>}
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-fg">{title}</h1>
          {subtitle && <p className="text-sm text-muted mt-0.5 leading-relaxed">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex items-center gap-3 shrink-0 pt-0.5">{action}</div>}
    </div>
  );
}