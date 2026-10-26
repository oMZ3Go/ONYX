import type { HeadlineFrame } from "./headline-timeline";
const clickPhases = new Set([
  "drag-first",
  "release-first",
  "drag-second",
  "context",
  "color",
  "pulse",
  "select-all",
  "delete",
]);
/** Effects share the existing clock, so pause/visibility also freeze a partially drawn pulse. */
export function headlineEffects({ phase, progress, remaining }: HeadlineFrame) {
  const elapsed = progress === 1 ? Infinity : (remaining * progress) / (1 - progress);
  const click = clickPhases.has(phase) ? Math.min(1, elapsed / 210) : 1;
  const menu =
    phase === "palette"
      ? Math.min(1, elapsed / 240)
      : phase === "color"
        ? 1 - Math.max(0, (elapsed - 170) / 280)
        : 0;
  return { click, menu, chosen: phase === "color", blueClick: phase === "color" };
}

/** Analytic velocity of the existing cubic drag, in px/ms. No new animation clock. */
export function dragAfterimage(frame: HeadlineFrame, offset: number) {
  if (frame.phase !== "drag-first" && frame.phase !== "drag-second")
    return { x: 0, y: 0, opacity: 0 };
  const velocity = (3 * (1 - frame.progress) ** 2) / 1400;
  const speed = Math.abs(offset) * velocity;
  const amount = Math.min(1, speed / 0.85);
  return {
    x: Math.sign(offset) * Math.min(12, speed * 9),
    y: -Math.min(1.2, 26 * velocity * 9),
    opacity: 0.2 * amount,
  };
}
