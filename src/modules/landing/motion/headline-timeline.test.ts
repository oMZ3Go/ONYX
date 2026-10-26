import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CYCLE_MS,
  IDLE_MS,
  IDLE_START_MS,
  createTimelineLoop,
  frameAt,
  type TimelineScheduler,
} from "./headline-timeline";
afterEach(() => vi.useRealTimers());
function setup() {
  vi.useFakeTimers();
  const scheduler: TimelineScheduler = {
    now: () => Date.now(),
    frame: (cb) => setTimeout(cb, 16) as unknown as number,
    cancelFrame: (id) => clearTimeout(id),
    delay: (cb, ms) => setTimeout(cb, ms) as unknown as number,
    cancelDelay: (id) => clearTimeout(id),
  };
  const render = vi.fn();
  return { render, loop: createTimelineLoop(render, scheduler) };
}
describe("headline design sequence", () => {
  it("can preserve an already visible fallback for a full idle period", () => {
    vi.useFakeTimers();
    const render = vi.fn();
    const loop = createTimelineLoop(
      render,
      {
        now: () => Date.now(),
        frame: (cb) => setTimeout(cb, 16) as unknown as number,
        cancelFrame: (id) => clearTimeout(id),
        delay: (cb, ms) => setTimeout(cb, ms) as unknown as number,
        cancelDelay: (id) => clearTimeout(id),
      },
      IDLE_START_MS,
    );
    loop.resume();
    expect(render.mock.lastCall?.[0].phase).toBe("idle");
    vi.advanceTimersByTime(14999);
    expect(render).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(render.mock.lastCall?.[0].phase).toBe("return");
    loop.dispose();
  });
  it("orders whole-object drags, palette selection, CTA pulse and deletion", () => {
    expect(frameAt(0).phase).toBe("empty");
    expect(frameAt(1500).phase).toBe("drag-first");
    expect(frameAt(4000).phase).toBe("drag-second");
    expect(frameAt(5100).phase).toBe("context");
    expect(frameAt(6000).phase).toBe("palette");
    expect(frameAt(6500).phase).toBe("color");
    expect(frameAt(8000).phase).toBe("pulse");
    expect(frameAt(8400).phase).toBe("fade");
    expect(frameAt(24500).phase).toBe("select-all");
    expect(frameAt(25000).phase).toBe("delete");
    expect(frameAt(CYCLE_MS).phase).toBe("empty");
  });
  it("reserves exactly 15000 ms after the cursor is fully gone", () => {
    expect(IDLE_MS).toBe(15000);
    expect(frameAt(IDLE_START_MS - 1).phase).toBe("fade");
    expect(frameAt(IDLE_START_MS).remaining).toBe(15000);
    expect(frameAt(IDLE_START_MS + 14999).phase).toBe("idle");
    expect(frameAt(IDLE_START_MS + 15000).phase).toBe("return");
  });
  it("sleeps during idle and gives it a full 15 seconds despite frame rounding", () => {
    const { loop, render } = setup();
    loop.resume();
    vi.advanceTimersByTime(8560);
    expect(render.mock.lastCall?.[0].phase).toBe("idle");
    const calls = render.mock.calls.length;
    vi.advanceTimersByTime(14999);
    expect(render).toHaveBeenCalledTimes(calls);
    vi.advanceTimersByTime(1);
    expect(render.mock.lastCall?.[0].phase).toBe("return");
    loop.dispose();
  });
  it("does not advance while hidden or offscreen, including an idle pause", () => {
    const { loop, render } = setup();
    loop.resume();
    vi.advanceTimersByTime(9000);
    loop.pause();
    const elapsed = loop.elapsed,
      calls = render.mock.calls.length;
    vi.advanceTimersByTime(120000);
    expect(loop.elapsed).toBe(elapsed);
    expect(render).toHaveBeenCalledTimes(calls);
    loop.resume();
    expect(render.mock.lastCall?.[0].phase).toBe("idle");
    loop.dispose();
  });
  it("deduplicates resume and cancels every callback on cleanup / Strict Mode remount", () => {
    const { loop, render } = setup();
    loop.resume();
    loop.resume();
    expect(vi.getTimerCount()).toBe(1);
    loop.dispose();
    loop.resume();
    expect(vi.getTimerCount()).toBe(0);
    const calls = render.mock.calls.length;
    vi.advanceTimersByTime(100000);
    expect(render).toHaveBeenCalledTimes(calls);
  });
  it("resets safely when motion eligibility or locale changes", () => {
    const { loop, render } = setup();
    loop.resume();
    vi.advanceTimersByTime(6000);
    loop.pause();
    loop.reset();
    expect(vi.getTimerCount()).toBe(0);
    loop.resume();
    expect(render.mock.lastCall?.[0].phase).toBe("empty");
    loop.dispose();
  });
});
