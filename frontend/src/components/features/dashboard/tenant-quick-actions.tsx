import { Plus, CreditCard, Sparkles, Phone } from "lucide-react";

interface TenantQuickActionsProps {
  onReport: () => void;
  onPay: () => void;
  onCleaning: () => void;
  onHotline: () => void;
}

export function TenantQuickActions({
  onReport,
  onPay,
  onCleaning,
  onHotline,
}: TenantQuickActionsProps) {
  return (
    <div className="grid grid-cols-4 gap-2.5 pt-0.5">
      {/* 1. Report */}
      <button
        type="button"
        onClick={onReport}
        className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-edge bg-card py-3 px-2 shadow-card cursor-pointer transition-all hover:border-edge-strong hover:bg-hover/50 active:scale-95"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-navy text-[#DFB966] shadow-soft transition-transform group-hover:scale-105">
          <Plus className="h-5 w-5 stroke-[2.25]" />
        </div>
        <span className="text-xs font-semibold text-fg-soft group-hover:text-fg">Report</span>
      </button>

      {/* 2. Pay */}
      <button
        type="button"
        onClick={onPay}
        className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-edge bg-card py-3 px-2 shadow-card cursor-pointer transition-all hover:border-edge-strong hover:bg-hover/50 active:scale-95"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent transition-transform group-hover:scale-105">
          <CreditCard className="h-5 w-5 stroke-[2]" />
        </div>
        <span className="text-xs font-semibold text-fg-soft group-hover:text-fg">Pay</span>
      </button>

      {/* 3. Cleaning */}
      <button
        type="button"
        onClick={onCleaning}
        className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-edge bg-card py-3 px-2 shadow-card cursor-pointer transition-all hover:border-edge-strong hover:bg-hover/50 active:scale-95"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-bg text-success-fg transition-transform group-hover:scale-105">
          <Sparkles className="h-5 w-5 stroke-[2]" />
        </div>
        <span className="text-xs font-semibold text-fg-soft group-hover:text-fg">Cleaning</span>
      </button>

      {/* 4. Hotline */}
      <button
        type="button"
        onClick={onHotline}
        className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-edge bg-card py-3 px-2 shadow-card cursor-pointer transition-all hover:border-edge-strong hover:bg-hover/50 active:scale-95"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-bg text-warning-fg transition-transform group-hover:scale-105">
          <Phone className="h-5 w-5 stroke-[2]" />
        </div>
        <span className="text-xs font-semibold text-fg-soft group-hover:text-fg">Hotline</span>
      </button>
    </div>
  );
}

