import { useId, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  hideHeader?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

const MAX_WIDTHS = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
} as const;

/**
 * Responsive Modal / Bottom Sheet Component.
 * - Mobile (< 640px): Slides up as an authentic Bottom Sheet with grab handle and swipe-down-to-dismiss gesture.
 * - Desktop (>= 640px): Centers as an elevated floating dialog with backdrop blur.
 * - Tapping outside or pressing Escape cancels and closes.
 */
export function Modal({ open, onClose, title = "", hideHeader = false, children, footer, maxWidth = "md" }: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const [dragOffset, setDragOffset] = useState<number>(0);
  const touchStartY = useRef<number | null>(null);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current == null) return;
    const currentY = e.touches[0].clientY;
    const delta = currentY - touchStartY.current;
    if (delta > 0) {
      setDragOffset(delta);
    }
  };

  const handleTouchEnd = () => {
    if (dragOffset > 70) {
      onCloseRef.current();
    }
    setDragOffset(0);
    touchStartY.current = null;
  };

  useEffect(() => {
    if (!open) {
      setDragOffset(0);
      return;
    }

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (e.key === "Tab" && panel) {
        const focusables = panel.querySelectorAll<HTMLElement>(
          'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || !panel.contains(active))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (active === last || !panel.contains(active))) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    const frame = requestAnimationFrame(() => {
      if (panel && panel.contains(document.activeElement)) {
        return;
      }
      const initial = panel?.querySelector<HTMLElement>(
        '[autofocus], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])'
      );
      (initial ?? closeButtonRef.current)?.focus();
    });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
      cancelAnimationFrame(frame);
      previousFocusRef.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  const modalElement = (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop: Clicking outside cancels / closes */}
      <div
        className="fixed inset-0 animate-fade-in bg-slate-950/70 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet / Dialog Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{
          transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
          transition: dragOffset > 0 ? "none" : undefined,
        }}
        className={cn(
          "relative z-10 flex max-h-[88vh] sm:max-h-[90vh] w-full flex-col rounded-t-[28px] sm:rounded-2xl border-t sm:border border-edge bg-card shadow-2xl animate-slide-up sm:animate-scale-in overflow-hidden",
          MAX_WIDTHS[maxWidth]
        )}
      >
        {/* Grab Handle Bar (Top Swipe-Down to Dismiss on Mobile) */}
        <div
          className="pt-3 pb-1 flex justify-center cursor-grab active:cursor-grabbing touch-none select-none relative"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-10 h-1.5 rounded-full bg-edge-strong/80" />
          {hideHeader && (
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="absolute right-4 top-2 rounded-lg p-1 text-muted hover:text-fg transition-colors"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {!hideHeader && title && (
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-edge px-5 sm:px-6 py-3.5 sm:py-4">
            <h3 id={titleId} className="text-base sm:text-lg font-bold tracking-tight text-fg">
              {title}
            </h3>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="-mr-1 rounded-lg p-1.5 text-muted transition-all duration-200 hover:bg-hover hover:text-fg cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        <div className="overflow-y-auto px-5 sm:px-6 py-4 sm:py-5">{children}</div>

        {footer && (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-edge px-5 sm:px-6 py-3.5 sm:py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalElement, document.body) : modalElement;
}
