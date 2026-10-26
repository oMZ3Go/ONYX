import type { TimelineScheduler } from "./headline-timeline";

type BrowserClock = Pick<
  Window,
  "performance" | "requestAnimationFrame" | "cancelAnimationFrame" | "setTimeout" | "clearTimeout"
>;

/** Native methods must keep their Window/Performance receiver when the loop calls them. */
export function browserScheduler(browser: BrowserClock = window): TimelineScheduler {
  return {
    now: () => browser.performance.now(),
    frame: (callback) => browser.requestAnimationFrame(callback),
    cancelFrame: (id) => browser.cancelAnimationFrame(id),
    delay: (callback, ms) => browser.setTimeout(callback, ms),
    cancelDelay: (id) => browser.clearTimeout(id),
  };
}
