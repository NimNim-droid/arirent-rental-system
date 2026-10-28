import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  type?: "text" | "search";
}

/**
 * The single search-bar pattern for the whole app.
 * Every list page uses this so toolbars look and behave identically.
 */
export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  label = "Search",
  className,
  type = "search",
}: SearchInputProps) {
  return (
    <Input
      type={type}
      aria-label={label}
      icon={<Search className="h-3.5 w-3.5" />}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn("max-w-xs", className)}
    />
  );
}
