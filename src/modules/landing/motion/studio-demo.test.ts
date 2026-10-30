import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createStudioDemo,
  STUDIO_REST_MS,
  STUDIO_MOVE_MS,
  STUDIO_HOVER_MS,
  STUDIO_CLICK_MS,
} from "./studio-demo";

const cycle = STUDIO_REST_MS + STUDIO_MOVE_MS + STUDIO_HOVER_MS + STUDIO_CLICK_MS;
function setup() {
  vi.useFakeTimers();
  const select = vi.fn(),
    render = vi.fn();
  const demo = createStudioDemo(4, select, render, {
    now: () => Date.now(),
    delay: (callback, ms) => Number(setTimeout(callback, ms)),
    cancelDelay: (id) => clearTimeout(id),
  });
  return { demo, select, render };
}
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});
describe("studio demonstration", () => {
  it("rests five seconds, approaches, hovers, clicks and cycles through all four designs", () => {
    const { demo, select, render } = setup();
    demo.sync(true);
    vi.advanceTimersByTime(STUDIO_REST_MS - 1);
    expect(select).not.toHaveBeenCalled();
    expect(render).toHaveBeenLastCalledWith("idle", 0);
    vi.advanceTimersByTime(1);
    expect(render).toHaveBeenLastCalledWith("approach", 1);
    vi.advanceTimersByTime(STUDIO_MOVE_MS);
    expect(render).toHaveBeenLastCalledWith("hover", 1);
    expect(select).not.toHaveBeenCalled();
    vi.advanceTimersByTime(STUDIO_HOVER_MS);
    expect(render).toHaveBeenLastCalledWith("click", 1);
    expect(select).toHaveBeenLastCalledWith(1);
    vi.advanceTimersByTime(STUDIO_CLICK_MS + cycle * 3);
    expect(select.mock.calls.map(([index]) => index)).toEqual([1, 2, 3, 0]);
    expect(vi.getTimerCount()).toBe(1);
    demo.dispose();
    expect(vi.getTimerCount()).toBe(0);
  });
  it.each([0, STUDIO_REST_MS + 100, STUDIO_REST_MS + STUDIO_MOVE_MS + 10])(
    "manual input at %d ms cancels the gesture and restarts one five-second delay",
    (time) => {
      const { demo, select, render } = setup();
      demo.sync(true);
      vi.advanceTimersByTime(time);
      for (const index of [0, 3, 2, 1, 2]) demo.select(index);
      expect(select.mock.calls.map(([index]) => index)).toEqual([0, 3, 2, 1, 2]);
      expect(render).toHaveBeenLastCalledWith("idle", 2);
      expect(vi.getTimerCount()).toBe(1);
      vi.advanceTimersByTime(STUDIO_REST_MS - 1);
      expect(render).toHaveBeenLastCalledWith("idle", 2);
      vi.advanceTimersByTime(1);
      expect(render).toHaveBeenLastCalledWith("approach", 3);
      vi.advanceTimersByTime(STUDIO_MOVE_MS + STUDIO_HOVER_MS);
      expect(select.mock.calls.map(([index]) => index)).toEqual([0, 3, 2, 1, 2, 3]);
      vi.advanceTimersByTime(cycle);
      expect(select).toHaveBeenLastCalledWith(0);
      expect(vi.getTimerCount()).toBe(1);
    },
  );
  it("reselecting the current artwork restarts the deadline and manual Dragon wraps to Crown", () => {
    const { demo, select, render } = setup();
    demo.sync(true);
    demo.select(3);
    vi.advanceTimersByTime(4000);
    demo.select(3);
    vi.advanceTimersByTime(4999);
    expect(render).toHaveBeenLastCalledWith("idle", 3);
    vi.advanceTimersByTime(961);
    expect(select.mock.calls.map(([index]) => index)).toEqual([3, 3, 0]);
  });
  it.each([1000, 8000])("selector hover preserves a manual deadline after %d ms", (hoverTime) => {
    const { demo, select, render } = setup();
    demo.sync(true);
    demo.hover(true);
    demo.select(2);
    vi.advanceTimersByTime(hoverTime);
    expect(vi.getTimerCount()).toBe(0);
    expect(select).toHaveBeenCalledExactlyOnceWith(2);
    demo.hover(false);
    const remaining = Math.max(0, STUDIO_REST_MS - hoverTime);
    if (remaining) {
      vi.advanceTimersByTime(remaining - 1);
      expect(render).toHaveBeenLastCalledWith("idle", 2);
      vi.advanceTimersByTime(1);
    } else vi.advanceTimersByTime(0);
    expect(render).toHaveBeenLastCalledWith("approach", 3);
    expect(select).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(STUDIO_MOVE_MS + STUDIO_HOVER_MS);
    expect(select).toHaveBeenLastCalledWith(3);
    expect(vi.getTimerCount()).toBe(1);
  });
  it("entering just before a click cancels it; repeated enter/leave resumes a complete movement", () => {
    const { demo, select, render } = setup();
    demo.sync(true);
    vi.advanceTimersByTime(STUDIO_REST_MS + STUDIO_MOVE_MS + STUDIO_HOVER_MS - 1);
    for (let i = 0; i < 5; i++) {
      demo.hover(true);
      demo.hover(true);
      vi.advanceTimersByTime(1000);
      expect(select).not.toHaveBeenCalled();
      demo.hover(false);
      demo.hover(false);
      vi.advanceTimersByTime(0);
      expect(render).toHaveBeenLastCalledWith("approach", 1);
      expect(vi.getTimerCount()).toBe(1);
    }
    vi.advanceTimersByTime(STUDIO_MOVE_MS + STUDIO_HOVER_MS);
    expect(select).toHaveBeenCalledExactlyOnceWith(1);
  });
  it("global suspension takes precedence over an expired hover deadline", () => {
    const { demo, select, render } = setup();
    demo.sync(true);
    demo.hover(true);
    demo.select(2);
    demo.sync(false);
    vi.advanceTimersByTime(60_000);
    demo.hover(false);
    expect(vi.getTimerCount()).toBe(0);
    demo.sync(true);
    vi.advanceTimersByTime(4999);
    expect(render).toHaveBeenLastCalledWith("idle", 2);
    vi.advanceTimersByTime(961);
    expect(select.mock.calls.map(([index]) => index)).toEqual([2, 3]);
  });
  it("ignores a cancelled callback even if it was already queued", () => {
    const callbacks: (() => void)[] = [];
    const select = vi.fn();
    const demo = createStudioDemo(4, select, vi.fn(), {
      now: () => 0,
      delay: (callback) => callbacks.push(callback),
      cancelDelay: vi.fn(),
    });
    demo.sync(true);
    demo.select(3);
    callbacks[0]!();
    expect(callbacks).toHaveLength(2);
    expect(select).toHaveBeenCalledExactlyOnceWith(3);
    demo.dispose();
    callbacks[1]!();
    expect(callbacks).toHaveLength(2);
  });
  it("suspends without timers and resumes with a full rest instead of catch-up clicks", () => {
    const { demo, select, render } = setup();
    demo.sync(true);
    demo.sync(true);
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(STUDIO_REST_MS + 100);
    demo.sync(false);
    demo.sync(false);
    expect(render).toHaveBeenLastCalledWith("idle", 0);
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(60_000);
    expect(select).not.toHaveBeenCalled();
    demo.sync(true);
    vi.advanceTimersByTime(STUDIO_REST_MS - 1);
    expect(render).toHaveBeenLastCalledWith("idle", 0);
    vi.advanceTimersByTime(STUDIO_MOVE_MS + STUDIO_HOVER_MS + 1);
    expect(select).toHaveBeenCalledExactlyOnceWith(1);
    demo.dispose();
    demo.sync(true);
    demo.select(3);
    vi.advanceTimersByTime(cycle * 2);
    expect(select).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
});
