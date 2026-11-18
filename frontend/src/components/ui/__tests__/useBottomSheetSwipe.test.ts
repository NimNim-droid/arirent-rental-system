import { afterEach, describe, expect, it, vi } from "vitest";
import {
  evaluateSwipeIntent,
  hasScrolledAncestor,
  isExcludedTarget,
  shouldDismissSwipe,
} from "../hooks/useBottomSheetSwipe";

describe("useBottomSheetSwipe helpers", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("distinguishes tap jitter, downward drag, and upward/horizontal scroll", () => {
    expect(evaluateSwipeIntent(1, 3)).toBe("pending");
    expect(evaluateSwipeIntent(2, 8)).toBe("commit");
    expect(evaluateSwipeIntent(0, -8)).toBe("abort");
    expect(evaluateSwipeIntent(14, 7)).toBe("abort");
  });

  it("dismisses when pulled past height threshold or flicked downward quickly", () => {
    expect(shouldDismissSwipe(0, 360, 1.5)).toBe(false);
    expect(shouldDismissSwipe(90, 360, 0)).toBe(true);
    expect(shouldDismissSwipe(85, 360, 0)).toBe(false);
    expect(shouldDismissSwipe(28, 360, 0.5)).toBe(true);
    expect(shouldDismissSwipe(20, 360, 0.8)).toBe(false);
  });

  it("allows sheet pull only when scrollable ancestors are at the top", () => {
    class MockNode {
      parentElement: MockElement | null = null;
    }
    class MockElement extends MockNode {
      scrollTop = 0;
      scrollHeight = 100;
      clientHeight = 100;
    }
    vi.stubGlobal("Node", MockNode);
    vi.stubGlobal("Element", MockElement);
    vi.stubGlobal("HTMLElement", MockElement);

    const panel = new MockElement();
    const body = new MockElement();
    body.parentElement = panel;
    body.scrollHeight = 500;
    body.clientHeight = 300;
    body.scrollTop = 32;

    const text = new MockNode();
    text.parentElement = body;

    expect(hasScrolledAncestor(text as unknown as EventTarget, panel as unknown as HTMLElement)).toBe(true);
    body.scrollTop = 0.5;
    expect(hasScrolledAncestor(text as unknown as EventTarget, panel as unknown as HTMLElement)).toBe(false);
  });

  it("excludes close buttons, selects, and focused text controls", () => {
    class MockNode {
      parentElement: MockElement | null = null;
    }
    class MockElement extends MockNode {
      constructor(private tag = "") {
        super();
      }
      closest(selectors: string) {
        return selectors.includes(this.tag) ? this : null;
      }
    }
    vi.stubGlobal("Node", MockNode);
    vi.stubGlobal("Element", MockElement);

    const closeBtn = new MockElement("[data-modal-close]");
    const textarea = new MockElement("textarea");
    const heading = new MockElement("h2");

    vi.stubGlobal("document", { activeElement: null });
    expect(isExcludedTarget(closeBtn as unknown as EventTarget)).toBe(true);
    expect(isExcludedTarget(heading as unknown as EventTarget)).toBe(false);
    expect(isExcludedTarget(textarea as unknown as EventTarget)).toBe(false);

    vi.stubGlobal("document", { activeElement: textarea });
    expect(isExcludedTarget(textarea as unknown as EventTarget)).toBe(true);
  });
});

