import { useEffect, useRef, useCallback, type RefObject } from "react";

const MOBILE_BREAKPOINT_PX = 640;
const DRAG_SLOP_PX = 6;
const FLICK_VELOCITY_PX_PER_MS = 0.45;
const MIN_FLICK_DISTANCE_PX = 24;
const DISMISS_MS = 180;
const SNAP_BACK_MS = 220;

export type SwipeIntent = "commit" | "abort" | "pending";

/** Decides whether initial touch movement commits to sheet drag, aborts to scroll, or waits. */
export function evaluateSwipeIntent(dx: number, dy: number): SwipeIntent {
  if (dy < -DRAG_SLOP_PX) return "abort";
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > DRAG_SLOP_PX) return "abort";
  if (dy >= DRAG_SLOP_PX && dy >= Math.abs(dx)) return "commit";
  return "pending";
}

/** Dismisses when pulled past 25% of sheet height (65–110px) or on a fast downward flick. */
export function shouldDismissSwipe(offset: number, panelHeight: number, velocity: number): boolean {
  if (offset <= 0) return false;
  const threshold = panelHeight > 0 ? Math.min(110, Math.max(65, panelHeight * 0.25)) : 80;
  return offset >= threshold || (offset >= MIN_FLICK_DISTANCE_PX && velocity >= FLICK_VELOCITY_PX_PER_MS);
}

function resolveElement(target: EventTarget | null): Element | null {
  if (typeof Element !== "undefined" && target instanceof Element) return target;
  return typeof Node !== "undefined" && target instanceof Node ? target.parentElement : null;
}

/** True when touch began inside a scrolled element (scrollTop > 1), so inner scroll wins first. */
export function hasScrolledAncestor(target: EventTarget | null, boundary: HTMLElement | null): boolean {
  let cur = resolveElement(target);
  while (cur && cur !== boundary) {
    if (cur instanceof HTMLElement && cur.scrollTop > 1 && cur.scrollHeight > cur.clientHeight) {
      return true;
    }
    cur = cur.parentElement;
  }
  return false;
}

/** Prevents hijacking close buttons, select/file/range controls, or focused text inputs. */
export function isExcludedTarget(target: EventTarget | null): boolean {
  const el = resolveElement(target);
  if (!el) return false;
  if (el.closest("[data-modal-close], select, input[type='range'], input[type='file'], [contenteditable='true']")) {
    return true;
  }
  const input = el.closest("textarea, input");
  return Boolean(input && typeof document !== "undefined" && input === document.activeElement);
}

function setSheetMotion(
  panel: HTMLElement,
  backdrop: HTMLElement | null,
  translateY: string,
  backdropOpacity: string,
  durationMs: number
) {
  panel.style.animation = "none";
  panel.style.transition = durationMs > 0 ? `transform ${durationMs}ms cubic-bezier(0.22, 1, 0.36, 1)` : "none";
  panel.style.transform = `translateY(${translateY})`;
  if (backdrop) {
    backdrop.style.animation = "none";
    backdrop.style.transition = durationMs > 0 ? `opacity ${durationMs}ms ease-out` : "none";
    backdrop.style.opacity = backdropOpacity;
  }
}

interface UseBottomSheetSwipeOptions {
  open: boolean;
  panelRef: RefObject<HTMLDivElement | null>;
  backdropRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
}

/** Enables native-feeling pull-down-to-dismiss on mobile bottom sheets (< 640px). */
export function useBottomSheetSwipe({ open, panelRef, backdropRef, onClose }: UseBottomSheetSwipeOptions) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const closingRef = useRef(false);
  const safeClose = useCallback(() => {
    if (!closingRef.current) onCloseRef.current();
  }, []);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;

    let closeTimer: number | null = null;
    let snapTimer: number | null = null;
    const gesture = {
      active: false,
      committed: false,
      aborted: false,
      startX: 0,
      startY: 0,
      dragStartY: 0,
      offset: 0,
      anchorY: 0,
      anchorTime: 0,
      lastY: 0,
      lastTime: 0,
    };

    const resetGesture = () => {
      gesture.active = false;
      gesture.committed = false;
      gesture.aborted = false;
      gesture.offset = 0;
    };

    const clearStyles = (keepNoAnim: boolean) => {
      panel.style.transition = "";
      panel.style.transform = "";
      if (!keepNoAnim) panel.style.animation = "";
      const backdrop = backdropRef.current;
      if (backdrop) {
        backdrop.style.transition = "";
        backdrop.style.opacity = "";
        if (!keepNoAnim) backdrop.style.animation = "";
      }
    };

    const motionMs = (ms: number) =>
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? 0 : ms;

    const snapBack = () => {
      const ms = motionMs(SNAP_BACK_MS);
      setSheetMotion(panel, backdropRef.current, "0px", "1", ms);
      snapTimer = window.setTimeout(() => {
        snapTimer = null;
        clearStyles(true);
      }, ms);
    };

    const dismiss = () => {
      closingRef.current = true;
      const ms = motionMs(DISMISS_MS);
      if (!ms) {
        closingRef.current = false;
        onCloseRef.current();
        return;
      }
      setSheetMotion(panel, backdropRef.current, "100%", "0", ms);
      closeTimer = window.setTimeout(() => {
        closeTimer = null;
        closingRef.current = false;
        onCloseRef.current();
      }, ms);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (
        closingRef.current ||
        window.innerWidth >= MOBILE_BREAKPOINT_PX ||
        e.touches.length !== 1 ||
        isExcludedTarget(e.target) ||
        hasScrolledAncestor(e.target, panel)
      ) {
        resetGesture();
        return;
      }
      if (snapTimer !== null) {
        window.clearTimeout(snapTimer);
        snapTimer = null;
        clearStyles(true);
      }
      gesture.active = true;
      gesture.committed = false;
      gesture.aborted = false;
      gesture.startX = e.touches[0].clientX;
      gesture.startY = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!gesture.active || gesture.aborted || closingRef.current) return;
      if (e.touches.length !== 1) {
        const wasCommitted = gesture.committed;
        resetGesture();
        if (wasCommitted) snapBack();
        return;
      }
      const touch = e.touches[0];
      const now = performance.now();

      if (!gesture.committed) {
        if (hasScrolledAncestor(e.target, panel)) {
          gesture.aborted = true;
          return;
        }
        const intent = evaluateSwipeIntent(touch.clientX - gesture.startX, touch.clientY - gesture.startY);
        if (intent === "abort") {
          gesture.aborted = true;
          return;
        }
        if (intent === "pending") return;
        gesture.committed = true;
        gesture.dragStartY = touch.clientY;
        gesture.anchorY = touch.clientY;
        gesture.anchorTime = now;
        gesture.lastY = touch.clientY;
        gesture.lastTime = now;
      }

      // Non-passive listener blocks iOS Safari pull-to-refresh while dragging down.
      if (e.cancelable) e.preventDefault();
      if (now - gesture.anchorTime > 80) {
        gesture.anchorY = gesture.lastY;
        gesture.anchorTime = gesture.lastTime;
      }
      gesture.lastY = touch.clientY;
      gesture.lastTime = now;
      gesture.offset = Math.max(0, touch.clientY - gesture.dragStartY);

      const progress = Math.min(1, gesture.offset / (panel.offsetHeight || 360));
      setSheetMotion(panel, backdropRef.current, `${gesture.offset}px`, String(Math.max(0.15, 1 - progress * 0.85)), 0);
    };

    const finishTouch = (allowDismiss: boolean) => {
      if (!gesture.active) return;
      const wasCommitted = gesture.committed;
      const finalOffset = gesture.offset;
      const dt = gesture.lastTime - gesture.anchorTime;
      const velocity = performance.now() - gesture.lastTime <= 100 && dt > 0 ? (gesture.lastY - gesture.anchorY) / dt : 0;
      resetGesture();
      if (!wasCommitted) return;

      if (allowDismiss && shouldDismissSwipe(finalOffset, panel.offsetHeight, velocity)) {
        dismiss();
      } else {
        snapBack();
      }
    };

    const onTouchEnd = () => finishTouch(true);
    const onTouchCancel = () => finishTouch(false);

    panel.addEventListener("touchstart", onTouchStart, { passive: true });
    panel.addEventListener("touchmove", onTouchMove, { passive: false });
    panel.addEventListener("touchend", onTouchEnd, { passive: true });
    panel.addEventListener("touchcancel", onTouchCancel, { passive: true });

    return () => {
      if (closeTimer !== null) window.clearTimeout(closeTimer);
      if (snapTimer !== null) window.clearTimeout(snapTimer);
      closingRef.current = false;
      clearStyles(false);
      panel.removeEventListener("touchstart", onTouchStart);
      panel.removeEventListener("touchmove", onTouchMove);
      panel.removeEventListener("touchend", onTouchEnd);
      panel.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [open, panelRef, backdropRef]);

  return safeClose;
}
