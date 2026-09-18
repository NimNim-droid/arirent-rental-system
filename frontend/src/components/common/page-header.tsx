import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-6 mb-2 border-b border-edge animate-fade-in-up">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-fg">{title}</h1>
        {subtitle && <p className="text-sm text-muted mt-0.5 leading-relaxed">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-3 shrink-0 pt-0.5">{action}</div>}
    </div>
  );
}