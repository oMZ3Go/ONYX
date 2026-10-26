import { createProcessLoop, processFrameAt, PROCESS_STEP_MS } from "./process-timeline";
import { browserScheduler } from "./browser-scheduler";
const progress = (time: number, start: number, duration: number) =>
  Math.max(0, Math.min(1, (time - start) / duration));
export function initializeProcess(root: HTMLElement) {
  const bounds = root.getBoundingClientRect();
  const preserveContent = bounds.top < innerHeight && bounds.bottom > 0;
  const steps = [...root.querySelectorAll("li")].map((el) => ({
    el,
    icon: el.querySelector<HTMLElement>(".step-icon")!,
    number: el.querySelector<HTMLElement>(".step-number")!,
    title: el.querySelector<HTMLElement>(".step-title")!,
    description: el.querySelector<HTMLElement>("p")!,
    connector: el.querySelector<HTMLElement>(".step-connector")!,
  }));
  const render = (elapsed: number) => {
    const { time, replay, rest } = processFrameAt(elapsed);
    root.dataset.processState = rest ? "rest" : replay ? "replay" : "entrance";
    root.dataset.processStep = String(Math.min(3, Math.floor(time / PROCESS_STEP_MS) + 1));
    steps.forEach((step, index) => {
      const t = time - index * PROCESS_STEP_MS;
      for (const [element, offset] of [
        [step.icon, 0],
        [step.number, 180],
        [step.title, 320],
        [step.description, 460],
      ] as const) {
        const p = preserveContent || replay || rest ? 1 : progress(t, offset, 320);
        element.style.opacity = String(p);
        element.style.transform =
          element === step.icon ? `scale(${0.92 + p * 0.08})` : `translateY(${(1 - p) * 8}px)`;
      }
      const glow = rest ? 0.12 : Math.sin(progress(t, 700, 700) * Math.PI);
      step.icon.style.setProperty("--step-light", String(Math.max(0.12, glow)));
      const connection = rest ? 1 : progress(t, 1050, 350);
      step.connector.style.setProperty("--connector-progress", String(connection));
      step.connector.style.opacity = String(rest ? 0.45 : 0.3 + glow * 0.7);
    });
  };
  const loop = createProcessLoop(render, browserScheduler());
  if (
    matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.dataset.motionPaused === "true"
  )
    loop.static();
  else if (!preserveContent) render(0);
  const restore = () => {
    root.dataset.processState = "static";
    steps.forEach(({ el }) =>
      el.querySelectorAll<HTMLElement>("[style]").forEach((node) => node.removeAttribute("style")),
    );
  };
  return {
    sync({
      reduced,
      paused,
      visible,
      hidden,
    }: {
      reduced: boolean;
      paused: boolean;
      visible: boolean;
      hidden: boolean;
    }) {
      root.dataset.processPaused = String(paused || hidden || !visible);
      if (reduced) {
        loop.static();
        restore();
      } else if (paused || hidden || !visible) loop.pause();
      else loop.resume();
    },
    dispose() {
      loop.dispose();
      restore();
    },
  };
}
