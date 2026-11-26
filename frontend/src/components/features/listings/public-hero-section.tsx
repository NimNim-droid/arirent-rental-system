import { useState } from "react";
import { ArrowRight, Building2, CheckCircle2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PublicHeroSectionProps {
  totalBuildings: number;
  totalVacant: number;
  loading: boolean;
  onExploreClick: () => void;
}

export function PublicHeroSection({
  totalBuildings,
  totalVacant,
  loading,
  onExploreClick,
}: PublicHeroSectionProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <section className="relative overflow-hidden bg-[#eef3fa] dark:bg-[#0d1424] border-b border-edge">
      {/* Architectural residence photography positioned on the right, fading smoothly left */}
      {!imageError && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 select-none"
        >
          <img
            src="/images/hero-residence.jpg"
            alt=""
            onError={() => setImageError(true)}
            className="h-full w-full object-cover object-right lg:object-[72%_center] opacity-90 dark:opacity-35"
          />
          {/* Light mode directional readability fade */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#f4f7fb] via-[#f4f7fb]/92 via-45% to-[#f4f7fb]/15 dark:hidden" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#f4f7fb] via-transparent to-[#f4f7fb]/30 lg:hidden dark:hidden" />
          {/* Dark mode directional readability fade */}
          <div className="hidden dark:block absolute inset-0 bg-gradient-to-r from-[#0b0f17] via-[#0b0f17]/90 via-50% to-[#0b0f17]/35" />
          <div className="hidden dark:block absolute inset-0 bg-gradient-to-t from-[#0b0f17] via-transparent to-[#0b0f17]/40" />
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 pt-10 pb-20 sm:pt-14 sm:pb-24 lg:pt-16 lg:pb-28">
        <div className="max-w-xl space-y-5">
          {/* Eyebrow pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-edge bg-card/95 px-3.5 py-1.5 text-xs font-semibold text-fg-soft shadow-soft backdrop-blur-sm">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-soft text-accent">
              <Building2 className="h-3 w-3" />
            </span>
            <span>Direct Landlord-Managed Residential Units</span>
          </div>

          {/* Editorial headline */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-tight text-fg leading-[1.12]">
              Find a Verified Room{" "}
              <span className="text-accent">Ready to Move In</span>
            </h1>
            <p className="text-sm sm:text-base text-fg-soft leading-relaxed max-w-lg">
              Compare real monthly rates and move-in terms upfront, inspect rooms in person
              with the property manager, and apply online with no broker fees.
            </p>
          </div>

          {/* Primary CTAs */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 pt-1">
            <Button
              type="button"
              size="lg"
              onClick={onExploreClick}
              className="h-11 rounded-xl px-5 text-sm font-semibold w-full sm:w-auto"
            >
              <span>Explore Properties</span>
              <ArrowRight className="h-4 w-4" />
            </Button>

            <a href="#contact" className="w-full sm:w-auto">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="h-11 rounded-xl px-5 text-sm font-semibold w-full bg-card/95 backdrop-blur-sm"
              >
                <Phone className="h-4 w-4 text-accent" />
                <span>Inquire or Visit</span>
              </Button>
            </a>
          </div>

          {/* Grounded live inventory indicator */}
          {!loading && totalBuildings > 0 && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-xs font-medium text-fg-soft">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-success-fg" />
                <strong className="text-fg tabular-nums">{totalVacant}</strong> vacant{" "}
                {totalVacant === 1 ? "unit" : "units"} open now
              </span>
              <span className="text-edge-strong" aria-hidden="true">
                &bull;
              </span>
              <span>
                Across <strong className="text-fg tabular-nums">{totalBuildings}</strong> managed{" "}
                {totalBuildings === 1 ? "building" : "buildings"}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
