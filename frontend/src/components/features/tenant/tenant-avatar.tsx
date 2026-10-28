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
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent text-[11px] font-semibold text-white ${
        className ?? ""
      }`}
    >
      {initials}
    </div>
  );
}
