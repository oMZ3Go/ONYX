/** Deterministic whole-object animation. Durations are active, visible milliseconds. */
export const IDLE_MS = 30_000;
export const headlinePhases = [
  { name: "empty", duration: 450 },
  { name: "exit-first", duration: 550 },
  { name: "drag-first", duration: 1400 },
  { name: "release-first", duration: 450 },
  { name: "exit-second", duration: 600 },
  { name: "drag-second", duration: 1400 },
  { name: "context", duration: 550 },
  { name: "palette", duration: 900 },
  { name: "color", duration: 450 },
  { name: "to-button", duration: 1000 },
  { name: "pulse", duration: 500 },
  { name: "fade", duration: 300 },
  { name: "idle", duration: IDLE_MS },
  { name: "return", duration: 800 },
  { name: "select-all", duration: 500 },
  { name: "delete", duration: 400 },
] as const;
export type HeadlinePhase = (typeof headlinePhases)[number]["name"];
export const CYCLE_MS = headlinePhases.reduce((total, phase) => total + phase.duration, 0);
export const IDLE_START_MS = headlinePhases
  .slice(0, 12)
  .reduce((total, phase) => total + phase.duration, 0);
export interface HeadlineFrame {
  phase: HeadlinePhase;
  progress: number;
  remaining: number;
  cycleTime: number;
}
export function frameAt(elapsed: number): HeadlineFrame {
  const cycleTime = Math.max(0, elapsed) % CYCLE_MS;
  let start = 0;
  for (const phase of headlinePhases) {
    if (cycleTime < start + phase.duration)
      return {
        phase: phase.name,
        progress: (cycleTime - start) / phase.duration,
        remaining: start + phase.duration - cycleTime,
        cycleTime,
      };
    start += phase.duration;
  }
  return { phase: "empty", progress: 0, remaining: 450, cycleTime: 0 };
}
export interface TimelineScheduler {
  now(): number;
  frame(callback: () => void): number;
  cancelFrame(id: number): void;
  delay(callback: () => void, milliseconds: number): number;
  cancelDelay(id: number): void;
}
/** One owner, one callback. Idle sleeps; hidden/offscreen time never accumulates. */
export function createTimelineLoop(
  render: (frame: HeadlineFrame) => void,
  scheduler: TimelineScheduler,
  initialElapsed = 0,
) {
  let elapsed = initialElapsed,
    started = 0,
    running = false,
    disposed = false;
  let frameId: number | undefined, delayId: number | undefined;
  let lastPhase: HeadlinePhase | undefined;
  const cancel = () => {
    if (frameId !== undefined) scheduler.cancelFrame(frameId);
    if (delayId !== undefined) scheduler.cancelDelay(delayId);
    frameId = delayId = undefined;
  };
  const tick = () => {
    frameId = delayId = undefined;
    if (!running || disposed) return;
    const total = elapsed + scheduler.now() - started;
    let frame = frameAt(total);
    if (frame.phase === "idle" && lastPhase !== "idle") {
      // Start the full 30 seconds at the frame that actually hides the cursor.
      elapsed = Math.floor(total / CYCLE_MS) * CYCLE_MS + IDLE_START_MS;
      started = scheduler.now();
      frame = frameAt(elapsed);
    }
    lastPhase = frame.phase;
    render(frame);
    if (frame.phase === "idle") delayId = scheduler.delay(tick, frame.remaining);
    else frameId = scheduler.frame(tick);
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
    reset() {
      cancel();
      elapsed = 0;
      lastPhase = undefined;
      started = scheduler.now();
      if (running) tick();
    },
    dispose() {
      running = false;
      disposed = true;
      cancel();
    },
    get elapsed() {
      return elapsed + (running ? scheduler.now() - started : 0);
    },
  };
}
