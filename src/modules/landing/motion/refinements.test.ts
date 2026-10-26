import { afterEach, describe, expect, it, vi } from "vitest";
import { headlineEffects, dragAfterimage } from "./headline-effects";
import { frameAt } from "./headline-timeline";
import { durationMilliseconds } from "./css-duration";
import {
  createProcessLoop,
  processFrameAt,
  PROCESS_CYCLE_MS,
  PROCESS_REST_MS,
  PROCESS_SEQUENCE_MS,
} from "./process-timeline";
import { activeSection } from "@/components/scroll-navigation";
afterEach(() => vi.useRealTimers());
it("preserves real durations when production CSS converts milliseconds to seconds", () => {
  expect(durationMilliseconds("10000ms", 1)).toBe(10000);
  expect(durationMilliseconds("10s", 1)).toBe(10000);
  expect(durationMilliseconds("720ms", 1)).toBe(720);
  expect(durationMilliseconds(" .72s ", 1)).toBe(720);
  expect(durationMilliseconds("0ms", 1)).toBe(0);
  for (const invalid of ["", "garbage", "-1s", "10", "Infinityms"])
    expect(durationMilliseconds(invalid, 720)).toBe(720);
});
describe("headline feedback in the existing choreography", () => {
  it("trails the actual drag direction, decelerates and is absent outside dragging", () => {
    const fast = dragAfterimage(frameAt(1500), -700);
    const slow = dragAfterimage(frameAt(2250), -700);
    expect(fast.x).toBeLessThan(0);
    expect(fast.opacity).toBeGreaterThan(slow.opacity);
    expect(slow.opacity).toBeGreaterThan(0);
    expect(dragAfterimage(frameAt(1500), 700).x).toBe(-fast.x);
    for (const time of [0, 2400, 4850, 6000, 9000, 20000, 25000])
      expect(dragAfterimage(frameAt(time), -700)).toEqual({ x: 0, y: 0, opacity: 0 });
  });
  it("unfolds before selection and folds away after confirming blue", () => {
    expect(headlineEffects(frameAt(5400)).menu).toBe(0);
    expect(headlineEffects(frameAt(5520)).menu).toBeCloseTo(0.5);
    expect(headlineEffects(frameAt(6000)).menu).toBe(1);
    expect(headlineEffects(frameAt(6300)).chosen).toBe(true);
    expect(headlineEffects(frameAt(6500)).menu).toBeGreaterThan(0);
    expect(headlineEffects(frameAt(6749)).menu).toBeLessThan(0.01);
    expect(headlineEffects(frameAt(6750)).menu).toBe(0);
  });
  it("pulses at pickup/release, context, color, CTA, selection and deletion only", () => {
    for (const time of [1000, 2400, 3450, 4850, 6300, 7750, 24350, 24850]) {
      expect(headlineEffects(frameAt(time)).click).toBe(0);
      expect(headlineEffects(frameAt(time + 211)).click).toBe(1);
    }
    expect(headlineEffects(frameAt(6400)).blueClick).toBe(true);
    expect(headlineEffects(frameAt(8000)).blueClick).toBe(false);
    expect(headlineEffects(frameAt(15000)).click).toBe(1);
  });
});
describe("process active-time lifecycle", () => {
  it("rests for 12 seconds and keeps replay separate from initial content assembly", () => {
    expect(PROCESS_REST_MS).toBe(12000);
    expect(processFrameAt(PROCESS_SEQUENCE_MS)).toMatchObject({ rest: true, replay: false });
    expect(processFrameAt(PROCESS_CYCLE_MS - 1).rest).toBe(true);
    expect(processFrameAt(PROCESS_CYCLE_MS)).toMatchObject({ rest: false, replay: true, time: 0 });
  });
  it("sleeps in rest, preserves time across pause and cancels all work on unmount", () => {
    vi.useFakeTimers();
    const render = vi.fn();
    const loop = createProcessLoop(render, {
      now: () => Date.now(),
      frame: (cb) => setTimeout(cb, 16) as unknown as number,
      cancelFrame: clearTimeout,
      delay: (cb, ms) => setTimeout(cb, ms) as unknown as number,
      cancelDelay: clearTimeout,
    });
    loop.resume();
    loop.resume();
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(4210);
    expect(processFrameAt(render.mock.lastCall![0]).rest).toBe(true);
    const count = render.mock.calls.length;
    vi.advanceTimersByTime(10000);
    expect(render).toHaveBeenCalledTimes(count);
    loop.pause();
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(60000);
    loop.resume();
    expect(processFrameAt(render.mock.lastCall![0]).rest).toBe(true);
    vi.advanceTimersByTime(2000);
    expect(processFrameAt(render.mock.lastCall![0]).replay).toBe(true);
    loop.dispose();
    loop.resume();
    expect(vi.getTimerCount()).toBe(0);
  });
});
it("keeps navigation stable in section gaps and at boundaries in either locale", () => {
  const starts = [88, 720, 1350, 2000, 2300, 2800];
  expect(activeSection(starts, 0)).toBe(0);
  expect(activeSection(starts, 1349)).toBe(1);
  expect(activeSection(starts, 1350)).toBe(2);
  expect(activeSection(starts, 1999)).toBe(2);
  expect(activeSection(starts, 9000)).toBe(5);
});
