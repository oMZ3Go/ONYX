import type { TimelineScheduler } from "./headline-timeline";
export const PROCESS_STEP_MS = 1400;
export const PROCESS_SEQUENCE_MS = PROCESS_STEP_MS * 3;
export const PROCESS_REST_MS = 12_000;
export const PROCESS_CYCLE_MS = PROCESS_SEQUENCE_MS + PROCESS_REST_MS;
export function processFrameAt(elapsed: number) {
  const time = elapsed % PROCESS_CYCLE_MS;
  return { time, replay: elapsed >= PROCESS_CYCLE_MS, rest: time >= PROCESS_SEQUENCE_MS };
}
/** One active-time clock; no frames are scheduled through the 12-second rest. */
export function createProcessLoop(render: (elapsed: number) => void, scheduler: TimelineScheduler) {
  let elapsed = 0,
    started = 0,
    running = false,
    disposed = false;
  let frame: number | undefined, delay: number | undefined;
  const cancel = () => {
    if (frame !== undefined) scheduler.cancelFrame(frame);
    if (delay !== undefined) scheduler.cancelDelay(delay);
    frame = delay = undefined;
  };
  const tick = () => {
    frame = delay = undefined;
    if (!running || disposed) return;
    const total = elapsed + scheduler.now() - started;
    render(total);
    const state = processFrameAt(total);
    if (state.rest) delay = scheduler.delay(tick, PROCESS_CYCLE_MS - state.time);
    else frame = scheduler.frame(tick);
  };
  return {
    resume() {
      if (running || disposed) return;
      running = true;
      started = scheduler.now();
      tick();
    },
    pause() {
      if (!running) return;
      elapsed += scheduler.now() - started;
      running = false;
      cancel();
    },
    static() {
      this.pause();
      elapsed = PROCESS_SEQUENCE_MS;
    },
    dispose() {
      disposed = true;
      running = false;
      cancel();
    },
  };
}
