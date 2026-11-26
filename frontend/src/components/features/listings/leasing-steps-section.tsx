const STEPS = [
  {
    title: "Browse rooms",
    body: "See photos, monthly rent, capacity, and the advance and deposit required.",
  },
  {
    title: "Book a viewing",
    body: "Pick a time or contact the manager, then see the room in person. No account needed.",
  },
  {
    title: "Apply online",
    body: "Send your application to hold the room while the landlord reviews it.",
  },
  {
    title: "Move in and manage",
    body: "Pay bills, check meter readings, and report repairs from your phone.",
  },
];

export function LeasingStepsSection() {
  return (
    <section id="how-leasing-works" aria-label="How renting works" className="scroll-mt-20 space-y-8">
      <div className="max-w-xl space-y-2">
        <h2 className="text-2xl font-extrabold tracking-tight text-fg sm:text-3xl">
          How renting works
        </h2>
        <p className="text-sm text-muted sm:text-base">Look first. Apply when you are ready.</p>
      </div>

      <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {STEPS.map((item, index) => {
          const isLast = index === STEPS.length - 1;
          return (
            <li key={item.title} className="relative flex gap-4 lg:flex-col">
              <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold tabular-nums text-white shadow-soft">
                {index + 1}
              </span>

              {/* Connector: vertical on phones, horizontal on desktop */}
              {!isLast && (
                <>
                  <span
                    aria-hidden="true"
                    className="absolute left-5 top-10 -bottom-6 w-px bg-edge-strong sm:hidden"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute left-12 right-[-2rem] top-5 hidden h-px bg-edge-strong lg:block"
                  />
                </>
              )}

              <div className="min-w-0 space-y-1">
                <h3 className="text-base font-bold text-fg">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{item.body}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
