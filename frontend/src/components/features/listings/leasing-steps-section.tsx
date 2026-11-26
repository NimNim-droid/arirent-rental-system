import { CalendarCheck2, DoorOpen, FileCheck2, Smartphone } from "lucide-react";

const STEPS = [
  {
    step: "01",
    icon: DoorOpen,
    title: "Browse Verified Units",
    body: "Review real room photos, monthly rent, capacity, inclusions, and required advance or deposit.",
  },
  {
    step: "02",
    icon: CalendarCheck2,
    title: "Schedule a Visit",
    body: "Book a viewing window or contact the property manager directly to inspect the unit in person.",
  },
  {
    step: "03",
    icon: FileCheck2,
    title: "Apply & Reserve Online",
    body: "Submit your tenant application to hold your chosen room while the landlord reviews and approves it.",
  },
  {
    step: "04",
    icon: Smartphone,
    title: "Manage via Resident Portal",
    body: "Track sub-meter electricity readings, view statements, pay online, and log maintenance from your phone.",
  },
];

export function LeasingStepsSection() {
  return (
    <section
      id="how-leasing-works"
      aria-label="How leasing works"
      className="scroll-mt-20 space-y-5 sm:space-y-6"
    >
      <div className="space-y-1 max-w-xl">
        <p className="text-[11px] font-bold uppercase tracking-widest text-accent">
          Simple Leasing Process
        </p>
        <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-fg">
          From Viewing to Move-In, Step by Step
        </h2>
        <p className="text-xs sm:text-sm text-muted">
          No hidden reservations or surprise charges—inspect first, then reserve when ready.
        </p>
      </div>

      {/* Compact single-card numbered timeline on phones (< sm) */}
      <div className="sm:hidden rounded-2xl border border-edge bg-card divide-y divide-edge shadow-card">
        {STEPS.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.step} className="flex items-start gap-3.5 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent border border-accent-border/60 mt-0.5">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-bold text-accent tabular-nums">
                    {item.step}
                  </span>
                  <h3 className="text-sm font-bold text-fg">{item.title}</h3>
                </div>
                <p className="text-xs text-muted leading-relaxed">{item.body}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Spacious 2/4-column card grid on tablets and desktop (>= sm) */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STEPS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.step}
              className="rounded-2xl border border-edge bg-card p-5 shadow-card space-y-3.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent border border-accent-border/60">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="font-mono text-xs font-bold text-muted tabular-nums">
                  {item.step}
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-fg">{item.title}</h3>
                <p className="text-xs text-muted leading-relaxed">{item.body}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
