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
    <div className="grid grid-cols-4 gap-2 pt-1">
      {/* 1. Report (Featured gold button) */}
      <button
        type="button"
        onClick={onReport}
        className="group flex flex-col items-center gap-2 cursor-pointer transition-transform active:scale-95"
      >
        <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-[#C8A04A] text-[#2A2008] shadow-soft transition-transform group-hover:scale-105">
          <Plus className="h-6 w-6 stroke-[2.5]" />
        </div>
        <span className="text-xs font-semibold text-fg-soft group-hover:text-fg">Report</span>
      </button>

      {/* 2. Pay */}
      <button
        type="button"
        onClick={onPay}
        className="group flex flex-col items-center gap-2 cursor-pointer transition-transform active:scale-95"
      >
        <div className="flex h-13 w-13 items-center justify-center rounded-2xl border border-edge bg-card text-fg shadow-card transition-all group-hover:border-accent/40 group-hover:scale-105">
          <CreditCard className="h-5 w-5 stroke-[2]" />
        </div>
        <span className="text-xs font-semibold text-fg-soft group-hover:text-fg">Pay</span>
      </button>

      {/* 3. Cleaning */}
      <button
        type="button"
        onClick={onCleaning}
        className="group flex flex-col items-center gap-2 cursor-pointer transition-transform active:scale-95"
      >
        <div className="flex h-13 w-13 items-center justify-center rounded-2xl border border-edge bg-card text-fg shadow-card transition-all group-hover:border-accent/40 group-hover:scale-105">
          <Sparkles className="h-5 w-5 stroke-[2]" />
        </div>
        <span className="text-xs font-semibold text-fg-soft group-hover:text-fg">Cleaning</span>
      </button>

      {/* 4. Hotline */}
      <button
        type="button"
        onClick={onHotline}
        className="group flex flex-col items-center gap-2 cursor-pointer transition-transform active:scale-95"
      >
        <div className="flex h-13 w-13 items-center justify-center rounded-2xl border border-edge bg-card text-fg shadow-card transition-all group-hover:border-accent/40 group-hover:scale-105">
          <Phone className="h-5 w-5 stroke-[2]" />
        </div>
        <span className="text-xs font-semibold text-fg-soft group-hover:text-fg">Hotline</span>
      </button>
    </div>
  );
}

