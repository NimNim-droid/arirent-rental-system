export function TenantAvatar({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const initials = String(name)
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-strong text-xs font-bold text-white shadow-sm ${
        className ?? ""
      }`}
    >
      {initials}
    </div>
  );
}
