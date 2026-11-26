import { Link } from "react-router";
import { ArrowRight, Building2, CreditCard, Wrench, Zap } from "lucide-react";

const POINTS = [
  {
    icon: Building2,
    title: "Managed directly",
    description: "Every building is run by the landlord team. No agents in between.",
  },
  {
    icon: Zap,
    title: "Metered electricity",
    description: "Monthly readings per unit, with photo proof you can see in your account.",
  },
  {
    icon: CreditCard,
    title: "Pay online",
    description: "GCash, Maya, bank transfer, card, or QR Ph.",
  },
  {
    icon: Wrench,
    title: "Repairs and documents",
    description: "Report problems from your phone and find your lease and house rules anytime.",
  },
];

export function PublicAboutSection() {
  return (
    <section
      id="about-us"
      aria-label="About AriRent"
      className="scroll-mt-20 overflow-hidden rounded-3xl bg-brand-navy p-6 text-white ring-1 ring-white/10 sm:p-10 lg:p-12"
    >
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="space-y-5 lg:col-span-5">
          <h2 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
            One place to rent, pay, and ask for repairs
          </h2>
          <p className="text-sm leading-relaxed text-white/70 sm:text-base">
            Find a room and book a viewing here. Once you move in, your bills, meter readings, and
            repair requests live in the same app.
          </p>
          <Link
            to="/register"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-gold px-5 text-sm font-bold text-brand-navy transition-opacity hover:opacity-90 active:scale-95"
          >
            <span>Apply for a room</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <dl className="grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:col-span-7">
          {POINTS.map((point) => {
            const Icon = point.icon;
            return (
              <div key={point.title} className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-brand-gold">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 space-y-1">
                  <dt className="text-base font-bold">{point.title}</dt>
                  <dd className="text-sm leading-relaxed text-white/65">{point.description}</dd>
                </div>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
