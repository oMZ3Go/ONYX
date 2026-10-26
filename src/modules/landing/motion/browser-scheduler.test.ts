import { expect, it } from "vitest";
import { browserScheduler } from "./browser-scheduler";
import { createProcessLoop, PROCESS_SEQUENCE_MS } from "./process-timeline";

for (const phase of ["frame", "delay"] as const) {
  it(`keeps native receivers and cancels a pending ${phase} across repeated lifecycle calls`, () => {
    let time = 0;
    let nextId = 0;
    const frames = new Map<number, FrameRequestCallback>();
    const delays = new Map<number, TimerHandler>();
    const cancellations: string[] = [];
    const performance = {
      now() {
        expect(this).toBe(performance);
        return time;
      },
    } as Performance;
    const browser = {
      performance,
      requestAnimationFrame(callback: FrameRequestCallback) {
        expect(this).toBe(browser);
        frames.set(++nextId, callback);
        return nextId;
      },
      cancelAnimationFrame(id: number) {
        expect(this).toBe(browser);
        expect(frames.delete(id)).toBe(true);
        cancellations.push("frame");
      },
      setTimeout(callback: TimerHandler) {
        expect(this).toBe(browser);
        delays.set(++nextId, callback);
        return nextId;
      },
      clearTimeout(id: number | undefined) {
        expect(this).toBe(browser);
        expect(delays.delete(id!)).toBe(true);
        cancellations.push("delay");
      },
    };
    const rendered: number[] = [];
    const loop = createProcessLoop((elapsed) => rendered.push(elapsed), browserScheduler(browser));
    loop.resume();
    loop.resume();
    expect(frames.size).toBe(1);
    if (phase === "delay") {
      time = PROCESS_SEQUENCE_MS;
      const [id, callback] = [...frames][0]!;
      frames.delete(id);
      callback(time);
      expect(delays.size).toBe(1);
    }
    loop.pause();
    loop.pause();
    expect(cancellations).toEqual([phase]);
    expect(frames.size + delays.size).toBe(0);
    time += 60_000;
    loop.resume();
    expect(rendered.at(-1)).toBe(phase === "frame" ? 0 : PROCESS_SEQUENCE_MS);
    loop.static();
    loop.static();
    loop.resume();
    loop.dispose();
    loop.dispose();
    loop.pause();
    loop.resume();
    expect(cancellations).toEqual([phase, phase, "delay"]);
    expect(frames.size + delays.size).toBe(0);
  });
}
