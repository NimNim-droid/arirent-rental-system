import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

interface TicketPaginationProps {
  currentPage: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
}

/** Maximum number of page buttons shown at once (matches the mock's 1–5 window). */
const MAX_PAGE_BUTTONS = 5;

function buildPageWindow(currentPage: number, lastPage: number): number[] {
  const from = Math.max(1, Math.min(currentPage - 2, lastPage - MAX_PAGE_BUTTONS + 1));
  const to = Math.min(lastPage, from + MAX_PAGE_BUTTONS - 1);
  const pages: number[] = [];
  for (let i = from; i <= to; i++) pages.push(i);
  return pages;
}

export function TicketPagination({ currentPage, perPage, total, onPageChange }: TicketPaginationProps) {
  if (total <= 0) return null;

  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const start = (currentPage - 1) * perPage + 1;
  const end = Math.min(currentPage * perPage, total);
  const pages = buildPageWindow(currentPage, lastPage);

  return (
    <div className="flex flex-col-reverse items-center justify-between gap-3 border-t border-edge px-4 py-3 sm:flex-row">
      <p className="text-xs text-muted whitespace-nowrap">
        Showing {start} to {end} of {total} tickets
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          aria-label="Previous page"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="px-2"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {pages.map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? "primary" : "ghost"}
            size="sm"
            aria-current={page === currentPage ? "page" : undefined}
            onClick={() => onPageChange(page)}
            className={cn("min-w-8 px-2.5 tabular-nums", page === currentPage && "pointer-events-none")}
          >
            {page}
          </Button>
        ))}

        <Button
          variant="ghost"
          size="sm"
          aria-label="Next page"
          disabled={currentPage >= lastPage}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-2"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
