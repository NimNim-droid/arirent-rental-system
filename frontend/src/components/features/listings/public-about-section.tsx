import { Building2, CreditCard, FileText, Wrench, Zap } from "lucide-react";

const PILLARS = [
  {
    icon: Building2,
    title: "Direct Property Management",
    description:
      "Every listed building is managed directly by the landlord team—no middlemen or third-party markups.",
  },
  {
    icon: Zap,
    title: "Sub-Metered Utility Proof",
    description:
      "Monthly electricity readings are recorded per unit with photo proof accessible inside the resident portal.",
  },
  {
    icon: CreditCard,
    title: "Flexible Online Billing",
    description:
      "Settle monthly rent and utility statements online via GCash, Maya, Bank Transfer, Card, or QR Ph.",
  },
  {
    icon: Wrench,
    title: "Mobile Maintenance & Records",
    description:
      "Report repair issues from your phone and access official lease documents and house rules anytime.",
  },
];

export function PublicAboutSection() {
  return (
    <section
      id="about-us"
      aria-label="About AriRent"
      className="scroll-mt-20 rounded-2xl border border-edge bg-card p-5 sm:p-8 lg:p-10 shadow-card"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Editorial Intro */}
        <div className="lg:col-span-5 space-y-3.5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-accent">
            About AriRent
          </p>
          <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-fg leading-snug">
            Residential Renting Built Around Clarity
          </h2>
          <p className="text-xs sm:text-sm text-fg-soft leading-relaxed">
            AriRent brings unit discovery, viewing appointments, lease onboarding, monthly
            billing, and maintenance requests into one structured system for prospective renters
            and current residents.
          </p>

          <div className="rounded-xl border border-edge bg-inset p-3.5 sm:p-4 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-navy text-[#DFB966]">
              <FileText className="h-4 w-4" />
            </div>
            <div className="text-xs leading-relaxed">
              <p className="font-bold text-fg">Written Move-In Terms Upfront</p>
              <p className="text-muted mt-0.5">
                Every unit displays exact monthly rent, advance and security deposit months, and
                building rules before you apply.
              </p>
            </div>
          </div>
        </div>

        {/* 4 System Pillars — compact divider list on phone, 2x2 grid on >= sm */}
        <div className="lg:col-span-7">
          <div className="sm:hidden divide-y divide-edge rounded-xl border border-edge bg-inset/50">
            {PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div key={pillar.title} className="flex items-start gap-3 p-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card border border-edge text-accent shadow-soft mt-0.5">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <h3 className="text-sm font-bold text-fg">{pillar.title}</h3>
                    <p className="text-xs text-muted leading-relaxed">{pillar.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden sm:grid sm:grid-cols-2 gap-4">
            {PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="rounded-xl border border-edge bg-inset/60 p-5 space-y-2.5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-card border border-edge text-accent shadow-soft">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-fg">{pillar.title}</h3>
                  <p className="text-xs text-muted leading-relaxed">{pillar.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
