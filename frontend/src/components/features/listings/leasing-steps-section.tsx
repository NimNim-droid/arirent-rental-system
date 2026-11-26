import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";

const STEPS = [
  {
    step: "01",
    title: "Browse Verified Units",
    body: "Check room photos, monthly rent, capacity, inclusions, and required advance/deposit.",
  },
  {
    step: "02",
    title: "Contact & Visit in Person",
    body: "Call, message, or book a viewing schedule to inspect the building and unit with the landlord.",
  },
  {
    step: "03",
    title: "Apply & Reserve Your Room",
    body: "Once satisfied with the unit, submit an online application to create your account and hold the room.",
  },
  {
    step: "04",
    title: "Landlord Approval & Portal",
    body: "After approval, sign in to your resident portal to view utility readings, statements, and pay online.",
  },
];

export function LeasingStepsSection() {
  return (
    <section id="how-leasing-works" className="pt-4 border-t border-edge space-y-4">
      <div>
        <h2 className="text-base font-semibold text-fg">How Leasing Works</h2>
        <p className="text-xs text-muted mt-0.5">
          Transparent step-by-step process from room inspection to moving in
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STEPS.map((item) => (
          <Card key={item.step} className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-accent tabular-nums">
                STEP {item.step}
              </span>
              <CheckCircle2 className="h-3.5 w-3.5 text-faint" />
            </div>
            <h3 className="text-sm font-semibold text-fg">{item.title}</h3>
            <p className="text-xs text-muted leading-relaxed">{item.body}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
