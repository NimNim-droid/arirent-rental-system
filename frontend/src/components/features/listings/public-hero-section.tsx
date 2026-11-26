import { useState } from "react";
import { Link } from "react-router";
import { ArrowRight, CalendarCheck2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";

interface PublicHeroSectionProps {
  totalBuildings: number;
  totalVacant: number;
  lowestRent?: number | null;
  loading: boolean;
  onExploreClick: () => void;
}

export function PublicHeroSection({
  totalBuildings,
  totalVacant,
  lowestRent = null,
  loading,
  onExploreClick,
}: PublicHeroSectionProps) {
  const [imageError, setImageError] = useState(false);
  const showFacts = !loading && totalBuildings > 0;

  return (
    <section className="relative overflow-hidden border-b border-edge bg-app">
      {/* Photo on the right, fading into the page background so text stays readable */}
      {!imageError && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 select-none">
          <img
            src="/images/hero-residence.jpg"
            alt=""
            fetchPriority="high"
            decoding="async"
            onError={() => setImageError(true)}
            className="h-full w-full object-cover object-[72%_center] opacity-90 dark:opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-app via-app/90 via-45% to-app/10" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-app to-transparent" />
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-6xl px-6 pt-20 pb-32">
        <div className="max-w-2xl space-y-7">
          {!loading && totalVacant > 0 && (
            <span className="inline-flex items-center gap-2 rounded-full border border-success-border bg-success-bg px-3.5 py-1.5 text-xs font-semibold text-success-fg">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-fg opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success-fg" />
              </span>
              {totalVacant} {totalVacant === 1 ? "room" : "rooms"} open now
            </span>
          )}

          <div className="space-y-4">
            <h1 className="text-5xl font-extrabold tracking-tight text-fg leading-[1.08]">
              Rooms for rent, with the real price up front.
            </h1>
            <p className="max-w-lg text-lg text-fg-soft leading-relaxed">
              See the monthly rent, advance and deposit before you ask. Visit in person, then
              apply online when you are ready.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              size="lg"
              onClick={onExploreClick}
              className="h-12 rounded-xl px-6 text-sm font-semibold"
            >
              <span>Browse available rooms</span>
              <ArrowRight className="h-4 w-4" />
            </Button>

            <a href="/#contact">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="h-12 rounded-xl px-6 text-sm font-semibold"
              >
                <CalendarCheck2 className="h-4 w-4 text-accent" />
                <span>Book a viewing</span>
              </Button>
            </a>

            <Link
              to="/login"
              className="px-2 text-sm font-semibold text-fg-soft underline-offset-4 hover:text-accent hover:underline"
            >
              Tenant sign in
            </Link>
          </div>

          {showFacts && (
            <dl className="flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-edge pt-6">
              <div className="flex flex-col-reverse">
                <dt className="text-xs text-muted">
                  {totalBuildings === 1 ? "managed building" : "managed buildings"}
                </dt>
                <dd className="text-2xl font-extrabold tabular-nums text-fg">{totalBuildings}</dd>
              </div>
              {lowestRent != null && (
                <div className="flex flex-col-reverse">
                  <dt className="text-xs text-muted">lowest open room</dt>
                  <dd className="text-2xl font-extrabold tabular-nums text-fg">
                    {formatCurrency(lowestRent)}
                    <span className="text-sm font-medium text-muted"> /mo</span>
                  </dd>
                </div>
              )}
            </dl>
          )}
        </div>
      </div>
    </section>
  );
}
