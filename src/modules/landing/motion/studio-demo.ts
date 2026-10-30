import type { TimelineScheduler } from "./headline-timeline";

export const STUDIO_REST_MS = 5000;
export const STUDIO_MOVE_MS = 720;
export const STUDIO_HOVER_MS = 240;
export const STUDIO_CLICK_MS = 220;
export type StudioDemoPhase = "idle" | "approach" | "hover" | "click";

/** One current index and timeout. Hover preserves the deadline; global suspension resets it. */
export function createStudioDemo(
  count: number,
  select: (index: number) => void,
  render: (phase: StudioDemoPhase, target: number) => void,
  scheduler: Pick<TimelineScheduler, "now" | "delay" | "cancelDelay">,
) {
  let active = 0,
    eligible = false,
    hovered = false,
    disposed = false;
  let due = 0,
    generation = 0;
  let timer: number | undefined;
  const clear = () => {
    generation++;
    if (timer !== undefined) scheduler.cancelDelay(timer);
    timer = undefined;
  };
  const schedule = (callback: () => void, ms: number) => {
    clear();
    const current = generation;
    timer = scheduler.delay(() => {
      if (current !== generation) return;
      timer = undefined;
      if (eligible && !hovered && !disposed) callback();
    }, ms);
  };
  const rest = () => {
    clear();
    render("idle", active);
    if (!eligible || hovered || disposed) return;
    schedule(
      () => {
        const target = (active + 1) % count;
        render("approach", target);
        schedule(() => {
          render("hover", target);
          schedule(() => {
            active = target;
            due = scheduler.now() + STUDIO_CLICK_MS + STUDIO_REST_MS;
            render("click", target);
            select(active);
            schedule(rest, STUDIO_CLICK_MS);
          }, STUDIO_HOVER_MS);
        }, STUDIO_MOVE_MS);
      },
      Math.max(0, due - scheduler.now()),
    );
  };
  return {
    sync(next: boolean) {
      if (disposed || eligible === next) return;
      eligible = next;
      if (eligible) due = scheduler.now() + STUDIO_REST_MS;
      rest();
    },
    hover(next: boolean) {
      if (disposed || hovered === next) return;
      hovered = next;
      rest();
    },
    select(index: number) {
      if (disposed || !Number.isInteger(index) || index < 0 || index >= count) return;
      active = index;
      due = scheduler.now() + STUDIO_REST_MS;
      rest();
      select(active);
    },
    dispose() {
      disposed = true;
      clear();
      render("idle", active);
    },
  };
}
