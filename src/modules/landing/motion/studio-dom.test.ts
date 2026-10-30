import { afterEach, expect, it, vi } from "vitest";
import { initializeStudioDemo } from "./studio-dom";

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it("releases observers, native cursor animation, timers and every lifecycle listener on disposal", () => {
  vi.useFakeTimers();
  const doc = Object.assign(new EventTarget(), { hidden: false, documentElement: { dataset: {} } });
  const reduced = Object.assign(new EventTarget(), { matches: false });
  const fine = Object.assign(new EventTarget(), { matches: true });
  const print = Object.assign(new EventTarget(), { complete: true, naturalWidth: 364 });
  const panel = new EventTarget();
  const listeners = [doc, reduced, fine, print, panel].map((target) => ({
    add: vi.spyOn(target, "addEventListener"),
    remove: vi.spyOn(target, "removeEventListener"),
  }));
  const disconnectIntersection = vi.fn(),
    disconnectResize = vi.fn(),
    cancel = vi.fn();
  let intersect!: (entries: { isIntersecting: boolean }[]) => void;
  vi.stubGlobal("document", doc);
  vi.stubGlobal("getComputedStyle", () => ({ transform: "none" }));
  vi.stubGlobal(
    "DOMMatrixReadOnly",
    class {
      m41 = 0;
      m42 = 0;
    },
  );
  vi.stubGlobal("window", {
    performance,
    setTimeout: (callback: () => void, ms: number) => Number(setTimeout(callback, ms)),
    clearTimeout: (id: number) => clearTimeout(id),
  });
  vi.stubGlobal("matchMedia", (query: string) =>
    query.includes("reduced-motion") ? reduced : fine,
  );
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: typeof intersect) {
        intersect = callback;
      }
      observe() {}
      disconnect = disconnectIntersection;
    },
  );
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect = disconnectResize;
    },
  );
  const cursor = { style: {}, dataset: {}, animate: vi.fn(() => ({ cancel })) };
  const options = [0, 1, 2, 3].map((index) => ({
    offsetLeft: 12 + index * 52,
    offsetTop: 30,
    offsetWidth: 46,
    offsetHeight: 46,
  }));
  const root = {
    dataset: {},
    querySelector: (selector: string) => (selector === ".studio-cursor" ? cursor : panel),
    querySelectorAll: (selector: string) => (selector === ".studio-print img" ? [print] : options),
  } as unknown as HTMLElement;
  const select = vi.fn();
  const controller = initializeStudioDemo(root, select);
  intersect([{ isIntersecting: true }]);
  vi.advanceTimersByTime(5100);
  expect(cursor.animate).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(1);
  controller.dispose();
  expect(disconnectIntersection).toHaveBeenCalledOnce();
  expect(disconnectResize).toHaveBeenCalledOnce();
  expect(cancel).toHaveBeenCalledOnce();
  expect(vi.getTimerCount()).toBe(0);
  for (const { add, remove } of listeners) {
    expect(remove.mock.calls).toEqual(add.mock.calls);
  }
  doc.dispatchEvent(new Event("visibilitychange"));
  doc.dispatchEvent(new Event("onyx-motion-change"));
  fine.dispatchEvent(new Event("change"));
  print.dispatchEvent(new Event("load"));
  panel.dispatchEvent(Object.assign(new Event("pointerenter"), { pointerType: "mouse" }));
  panel.dispatchEvent(Object.assign(new Event("pointerleave"), { pointerType: "mouse" }));
  vi.advanceTimersByTime(60_000);
  expect(select).not.toHaveBeenCalled();
});
